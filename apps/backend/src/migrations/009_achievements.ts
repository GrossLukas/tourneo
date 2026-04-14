import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Migration 009 — Achievement badges.
 * Types: first_win, first_prize, three_streak, perfect_set, veteran
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(t('achievements'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable()
      .references('id').inTable(t('users')).onDelete('CASCADE');
    table.string('achievement_type', 50).notNullable();
    table.datetime('earned_at').notNullable();

    table.unique(['user_id', 'achievement_type']);
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(t('achievements'));
}
