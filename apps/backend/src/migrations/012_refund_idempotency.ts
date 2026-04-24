import type { Knex } from 'knex';

/**
 * Adds a UNIQUE constraint on refunds.stripe_refund_id so duplicate
 * Stripe webhooks (same charge.refunded fired twice) cannot create
 * double refund rows. MySQL allows multiple NULLs in a UNIQUE column,
 * so legacy internal refunds (no stripe id) are unaffected.
 *
 * The service layer catches the resulting Duplicate-Key error and
 * returns idempotent success.
 */

const TABLE = (knex: Knex) =>
  (process.env.DB_TABLE_PREFIX || 'tourneo_') + 'refunds';

export async function up(knex: Knex): Promise<void> {
  const table = TABLE(knex);

  // Defensive: drop duplicates before adding the constraint so the
  // migration never fails due to pre-existing bad data. We keep the
  // oldest row and log the ids of the discarded ones.
  const duplicates = await knex(table)
    .select('stripe_refund_id')
    .whereNotNull('stripe_refund_id')
    .groupBy('stripe_refund_id')
    .having(knex.raw('COUNT(*) > 1'));

  for (const row of duplicates) {
    const refundId = row.stripe_refund_id as string;
    const all = await knex(table)
      .where('stripe_refund_id', refundId)
      .orderBy('id', 'asc')
      .select('id');
    const [, ...extras] = all;
    if (extras.length > 0) {
      console.warn(
        `[migration 012] Removing duplicate refund rows for stripe_refund_id=${refundId}: ids=${extras
          .map((r) => r.id)
          .join(',')}`
      );
      await knex(table)
        .whereIn(
          'id',
          extras.map((r) => r.id)
        )
        .delete();
    }
  }

  await knex.schema.alterTable(table, (t) => {
    t.unique(['stripe_refund_id'], { indexName: `${table}_stripe_refund_id_unique` });
  });
}

export async function down(knex: Knex): Promise<void> {
  const table = TABLE(knex);
  await knex.schema.alterTable(table, (t) => {
    t.dropUnique(['stripe_refund_id'], `${table}_stripe_refund_id_unique`);
  });
}
