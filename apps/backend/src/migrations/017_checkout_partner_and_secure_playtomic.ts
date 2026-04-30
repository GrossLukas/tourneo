import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

export async function up(knex: Knex): Promise<void> {
  const paymentsTable = t('payments');
  const registrationsTable = t('registrations');

  const paymentColumns = {
    stripe_checkout_session_id: await knex.schema.hasColumn(paymentsTable, 'stripe_checkout_session_id'),
    stripe_checkout_url: await knex.schema.hasColumn(paymentsTable, 'stripe_checkout_url'),
    checkout_expires_at: await knex.schema.hasColumn(paymentsTable, 'checkout_expires_at'),
  };

  if (Object.values(paymentColumns).some((exists) => !exists)) {
    await knex.schema.alterTable(paymentsTable, (table) => {
      if (!paymentColumns.stripe_checkout_session_id) {
        table.string('stripe_checkout_session_id', 255).nullable();
      }
      if (!paymentColumns.stripe_checkout_url) {
        table.string('stripe_checkout_url', 1000).nullable();
      }
      if (!paymentColumns.checkout_expires_at) {
        table.datetime('checkout_expires_at').nullable();
      }
    });
  }

  const registrationColumns = {
    partner_invite_email: await knex.schema.hasColumn(registrationsTable, 'partner_invite_email'),
    partner_invite_status: await knex.schema.hasColumn(registrationsTable, 'partner_invite_status'),
    partner_invited_at: await knex.schema.hasColumn(registrationsTable, 'partner_invited_at'),
    partner_accepted_at: await knex.schema.hasColumn(registrationsTable, 'partner_accepted_at'),
  };

  if (Object.values(registrationColumns).some((exists) => !exists)) {
    await knex.schema.alterTable(registrationsTable, (table) => {
      if (!registrationColumns.partner_invite_email) {
        table.string('partner_invite_email', 255).nullable();
      }
      if (!registrationColumns.partner_invite_status) {
        table
          .enum('partner_invite_status', ['none', 'pending', 'accepted', 'declined'])
          .notNullable()
          .defaultTo('none');
      }
      if (!registrationColumns.partner_invited_at) table.datetime('partner_invited_at').nullable();
      if (!registrationColumns.partner_accepted_at) table.datetime('partner_accepted_at').nullable();
    });
  }

  if (!(await hasIndex(knex, paymentsTable, 'idx_payments_checkout_session'))) {
    await knex.schema.alterTable(paymentsTable, (table) => {
      table.index(['stripe_checkout_session_id'], 'idx_payments_checkout_session');
    });
  }

  if (!(await hasIndex(knex, registrationsTable, 'idx_registrations_partner_invite'))) {
    await knex.schema.alterTable(registrationsTable, (table) => {
      table.index(['event_id', 'partner_invite_email', 'partner_invite_status'], 'idx_registrations_partner_invite');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const paymentsTable = t('payments');
  const registrationsTable = t('registrations');

  if (await hasIndex(knex, registrationsTable, 'idx_registrations_partner_invite')) {
    await knex.schema.alterTable(registrationsTable, (table) => {
      table.dropIndex(['event_id', 'partner_invite_email', 'partner_invite_status'], 'idx_registrations_partner_invite');
    });
  }

  if (await hasIndex(knex, paymentsTable, 'idx_payments_checkout_session')) {
    await knex.schema.alterTable(paymentsTable, (table) => {
      table.dropIndex(['stripe_checkout_session_id'], 'idx_payments_checkout_session');
    });
  }

  for (const column of ['partner_accepted_at', 'partner_invited_at', 'partner_invite_status', 'partner_invite_email']) {
    if (await knex.schema.hasColumn(registrationsTable, column)) {
      await knex.schema.alterTable(registrationsTable, (table) => table.dropColumn(column));
    }
  }

  for (const column of ['checkout_expires_at', 'stripe_checkout_url', 'stripe_checkout_session_id']) {
    if (await knex.schema.hasColumn(paymentsTable, column)) {
      await knex.schema.alterTable(paymentsTable, (table) => table.dropColumn(column));
    }
  }
}

async function hasIndex(knex: Knex, tableName: string, indexName: string): Promise<boolean> {
  const rows = await knex.raw('SHOW INDEX FROM ?? WHERE Key_name = ?', [tableName, indexName]);
  const result = Array.isArray(rows) ? rows[0] : rows;
  return Array.isArray(result) && result.length > 0;
}
