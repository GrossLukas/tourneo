import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Migration 006 — ELO ratings on profiles and a reminder-sent flag on matches.
 *
 * Additive only. Existing rows default to 1000 ELO.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(t('profiles'), (table) => {
    table.integer('elo_padel').defaultTo(1000);
    table.integer('elo_fifa').defaultTo(1000);
    table.integer('elo_matches_played').defaultTo(0);
    table.integer('elo_padel_peak').defaultTo(1000);
    table.integer('elo_fifa_peak').defaultTo(1000);
    table.index(['elo_padel']);
    table.index(['elo_fifa']);
  });

  await knex.schema.alterTable(t('matches'), (table) => {
    table.datetime('reminder_sent_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(t('matches'), (table) => {
    table.dropColumn('reminder_sent_at');
  });

  await knex.schema.alterTable(t('profiles'), (table) => {
    table.dropIndex(['elo_padel']);
    table.dropIndex(['elo_fifa']);
    table.dropColumn('elo_padel');
    table.dropColumn('elo_fifa');
    table.dropColumn('elo_matches_played');
    table.dropColumn('elo_padel_peak');
    table.dropColumn('elo_fifa_peak');
  });
}
