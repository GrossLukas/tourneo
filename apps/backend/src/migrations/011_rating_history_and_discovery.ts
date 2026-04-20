import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Migration 011 — ELO history + player discovery indexes.
 *
 * Adds:
 *  - rating_history table (time-series ELO snapshots per match)
 *  - player discovery fields on profiles (last_active_at, visibility)
 *  - compound indexes for player search (sport_elo, city, last_active)
 */
export async function up(knex: Knex): Promise<void> {
  const hasRatingHistory = await knex.schema.hasTable(t('rating_history'));
  if (!hasRatingHistory) {
    await knex.schema.createTable(t('rating_history'), (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
      table.enum('sport', ['padel', 'fifa']).notNullable();
      table.integer('elo').notNullable();
      table.integer('delta').notNullable().defaultTo(0);
      table.integer('match_id').nullable().references('id').inTable(t('matches')).onDelete('SET NULL');
      table.enum('reason', ['match', 'calibration', 'seed', 'admin']).notNullable().defaultTo('match');
      table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
      table.index(['user_id', 'sport', 'recorded_at']);
    });
  }

  const hasLastActive = await knex.schema.hasColumn(t('profiles'), 'last_active_at');
  if (!hasLastActive) {
    await knex.schema.alterTable(t('profiles'), (table) => {
      table.timestamp('last_active_at').nullable();
      table.boolean('discoverable').notNullable().defaultTo(true);
      table.index(['discoverable', 'last_active_at']);
      table.index(['elo_padel', 'discoverable']);
      table.index(['elo_fifa', 'discoverable']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(t('profiles'), (table) => {
    table.dropIndex(['elo_fifa', 'discoverable']);
    table.dropIndex(['elo_padel', 'discoverable']);
    table.dropIndex(['discoverable', 'last_active_at']);
    table.dropColumn('discoverable');
    table.dropColumn('last_active_at');
  });

  await knex.schema.dropTableIfExists(t('rating_history'));
}
