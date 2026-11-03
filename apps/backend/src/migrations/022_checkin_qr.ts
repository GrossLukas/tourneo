import type { Knex } from 'knex';

const PREFIX = process.env.DB_TABLE_PREFIX || 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

const REGISTRATIONS = t('registrations');
const EVENTS = t('events');
const TOKEN_INDEX = 'idx_registrations_checkin_qr_token';

/**
 * Migration 022 — QR check-in.
 *
 * Every confirmed registration can show a QR code at the venue; staff scan it
 * and the player is checked in (recorded in `checkins` with method `qr_code`).
 * The token is random, unique and expires after the event. The check-in
 * window, so far a hard-coded hour before start, becomes configurable per event.
 */
export async function up(knex: Knex): Promise<void> {
  const hasToken = await knex.schema.hasColumn(REGISTRATIONS, 'checkin_qr_token');
  const hasExpiry = await knex.schema.hasColumn(REGISTRATIONS, 'checkin_qr_expires_at');
  if (!hasToken || !hasExpiry) {
    await knex.schema.alterTable(REGISTRATIONS, (table) => {
      if (!hasToken) table.string('checkin_qr_token', 64).nullable().unique(TOKEN_INDEX);
      if (!hasExpiry) table.datetime('checkin_qr_expires_at').nullable();
    });
  }
  if (!(await knex.schema.hasColumn(EVENTS, 'checkin_opens_minutes_before'))) {
    await knex.schema.alterTable(EVENTS, (table) => {
      table.integer('checkin_opens_minutes_before').notNullable().defaultTo(60);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn(EVENTS, 'checkin_opens_minutes_before')) {
    await knex.schema.alterTable(EVENTS, (table) => table.dropColumn('checkin_opens_minutes_before'));
  }
  if (await knex.schema.hasColumn(REGISTRATIONS, 'checkin_qr_token')) {
    await knex.schema.alterTable(REGISTRATIONS, (table) => {
      table.dropUnique(['checkin_qr_token'], TOKEN_INDEX);
      table.dropColumn('checkin_qr_token');
    });
  }
  if (await knex.schema.hasColumn(REGISTRATIONS, 'checkin_qr_expires_at')) {
    await knex.schema.alterTable(REGISTRATIONS, (table) => table.dropColumn('checkin_qr_expires_at'));
  }
}
