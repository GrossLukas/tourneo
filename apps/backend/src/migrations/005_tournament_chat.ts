import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Migration 005 — Tournament chat rooms.
 * Each event has one chat room. Confirmed participants can post messages.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(t('chat_rooms'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('event_id').unsigned().notNullable()
      .references('id').inTable(t('events')).onDelete('CASCADE');
    table.datetime('created_at').notNullable();
    table.unique(['event_id']);
  });

  await knex.schema.createTable(t('chat_messages'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('room_id').unsigned().notNullable()
      .references('id').inTable(t('chat_rooms')).onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().notNullable()
      .references('id').inTable(t('users')).onDelete('CASCADE');
    table.text('message').notNullable();
    table.datetime('created_at').notNullable();

    table.index(['room_id', 'created_at']);
    table.index(['user_id']);
  });

  // Tracks the last time we sent a chat push to a user (rate limit: 1 per 5 min)
  await knex.schema.createTable(t('chat_push_throttle'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('room_id').unsigned().notNullable();
    table.bigInteger('user_id').unsigned().notNullable();
    table.datetime('last_pushed_at').notNullable();
    table.unique(['room_id', 'user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(t('chat_push_throttle'));
  await knex.schema.dropTableIfExists(t('chat_messages'));
  await knex.schema.dropTableIfExists(t('chat_rooms'));
}
