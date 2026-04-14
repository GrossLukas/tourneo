import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Migration 003 – Email verification, password reset tokens and helpful indexes.
 *
 * Additive only – no existing columns are dropped or renamed.
 */
export async function up(knex: Knex): Promise<void> {
  // ──────────────────────────────────────────────
  // EMAIL VERIFICATION + PASSWORD RESET COLUMNS
  // ──────────────────────────────────────────────
  await knex.schema.alterTable(t('users'), (table) => {
    table.string('email_verification_token', 64).nullable();
    table.datetime('email_verification_expires_at').nullable();
    table.string('password_reset_token', 64).nullable();
    table.datetime('password_reset_expires_at').nullable();
    table.datetime('email_verified_at').nullable();
    table.index(['email_verification_token']);
    table.index(['password_reset_token']);
  });

  // ──────────────────────────────────────────────
  // PERFORMANCE INDEXES (8c)
  // ──────────────────────────────────────────────
  // Geo-Suche
  await knex.schema.alterTable(t('venues'), (table) => {
    table.index(['latitude', 'longitude'], 'idx_geo');
  });

  // Warteliste
  await knex.schema.alterTable(t('registrations'), (table) => {
    table.index(['event_id', 'status', 'waitlist_position'], 'idx_waitlist');
  });

  // Benachrichtigungen (unread)
  await knex.schema.alterTable(t('notifications'), (table) => {
    table.index(['user_id', 'is_read', 'created_at'], 'idx_unread');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(t('notifications'), (table) => {
    table.dropIndex(['user_id', 'is_read', 'created_at'], 'idx_unread');
  });

  await knex.schema.alterTable(t('registrations'), (table) => {
    table.dropIndex(['event_id', 'status', 'waitlist_position'], 'idx_waitlist');
  });

  await knex.schema.alterTable(t('venues'), (table) => {
    table.dropIndex(['latitude', 'longitude'], 'idx_geo');
  });

  await knex.schema.alterTable(t('users'), (table) => {
    table.dropIndex(['email_verification_token']);
    table.dropIndex(['password_reset_token']);
    table.dropColumn('email_verification_token');
    table.dropColumn('email_verification_expires_at');
    table.dropColumn('password_reset_token');
    table.dropColumn('password_reset_expires_at');
    table.dropColumn('email_verified_at');
  });
}
