import type { Knex } from 'knex';

const PREFIX = process.env.DB_TABLE_PREFIX || 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

const EVENTS = t('events');
const REGISTRATIONS = t('registrations');
const PROFILES = t('profiles');
const HASH_INDEX = 'idx_profiles_playtomic_screenshot_sha256';

/**
 * Migration 024 — Level requirements per tournament.
 *
 * Events can require a Playtomic level range and/or an admin-verified level;
 * the registration keeps the level the player had at sign-up. Screenshots
 * get a SHA-256 so the review queue can flag the same image submitted by
 * two accounts.
 */
export async function up(knex: Knex): Promise<void> {
  const ev = {
    min: await knex.schema.hasColumn(EVENTS, 'min_playtomic_level'),
    max: await knex.schema.hasColumn(EVENTS, 'max_playtomic_level'),
    req: await knex.schema.hasColumn(EVENTS, 'requires_playtomic_verification'),
  };
  if (!ev.min || !ev.max || !ev.req) {
    await knex.schema.alterTable(EVENTS, (table) => {
      if (!ev.min) table.decimal('min_playtomic_level', 3, 1).nullable();
      if (!ev.max) table.decimal('max_playtomic_level', 3, 1).nullable();
      if (!ev.req) table.boolean('requires_playtomic_verification').notNullable().defaultTo(false);
    });
  }
  if (!(await knex.schema.hasColumn(REGISTRATIONS, 'playtomic_level_at_registration'))) {
    await knex.schema.alterTable(REGISTRATIONS, (table) => {
      table.decimal('playtomic_level_at_registration', 3, 1).nullable();
    });
  }
  if (!(await knex.schema.hasColumn(PROFILES, 'playtomic_screenshot_sha256'))) {
    await knex.schema.alterTable(PROFILES, (table) => {
      table.string('playtomic_screenshot_sha256', 64).nullable();
      table.index(['playtomic_screenshot_sha256'], HASH_INDEX);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn(PROFILES, 'playtomic_screenshot_sha256')) {
    await knex.schema.alterTable(PROFILES, (table) => {
      table.dropIndex(['playtomic_screenshot_sha256'], HASH_INDEX);
      table.dropColumn('playtomic_screenshot_sha256');
    });
  }
  if (await knex.schema.hasColumn(REGISTRATIONS, 'playtomic_level_at_registration')) {
    await knex.schema.alterTable(REGISTRATIONS, (table) => table.dropColumn('playtomic_level_at_registration'));
  }
  for (const column of ['requires_playtomic_verification', 'max_playtomic_level', 'min_playtomic_level']) {
    if (await knex.schema.hasColumn(EVENTS, column)) {
      await knex.schema.alterTable(EVENTS, (table) => table.dropColumn(column));
    }
  }
}
