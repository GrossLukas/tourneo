import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Migration 007 — Venue reviews and user-uploaded photos.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(t('venue_reviews'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('venue_id').unsigned().notNullable()
      .references('id').inTable(t('venues')).onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().notNullable()
      .references('id').inTable(t('users')).onDelete('CASCADE');
    table.tinyint('rating').notNullable();
    table.text('comment').nullable();
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();

    table.unique(['venue_id', 'user_id']);
    table.index(['venue_id']);
  });

  await knex.schema.createTable(t('venue_photos'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('venue_id').unsigned().notNullable()
      .references('id').inTable(t('venues')).onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().notNullable()
      .references('id').inTable(t('users')).onDelete('CASCADE');
    table.string('image_url', 500).notNullable();
    table.datetime('created_at').notNullable();

    table.index(['venue_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(t('venue_photos'));
  await knex.schema.dropTableIfExists(t('venue_reviews'));
}
