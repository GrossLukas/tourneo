import type { Knex } from 'knex';

const PREFIX = process.env.DB_TABLE_PREFIX || 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

const EVENTS = t('events');

/**
 * Migration 021 — Maintenance mode per tournament.
 *
 * Lets an admin pause a single tournament (e.g. while the venue, schedule
 * or prize money is being corrected) without unpublishing it: the event
 * stays visible, shows the admin's note, and registrations are refused
 * server-side until the flag is cleared.
 */
export async function up(knex: Knex): Promise<void> {
  const hasMode = await knex.schema.hasColumn(EVENTS, 'maintenance_mode');
  const hasMessage = await knex.schema.hasColumn(EVENTS, 'maintenance_message');
  if (hasMode && hasMessage) return;
  await knex.schema.alterTable(EVENTS, (table) => {
    if (!hasMode) table.boolean('maintenance_mode').notNullable().defaultTo(false);
    if (!hasMessage) table.text('maintenance_message').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  for (const column of ['maintenance_message', 'maintenance_mode']) {
    if (await knex.schema.hasColumn(EVENTS, column)) {
      await knex.schema.alterTable(EVENTS, (table) => table.dropColumn(column));
    }
  }
}
