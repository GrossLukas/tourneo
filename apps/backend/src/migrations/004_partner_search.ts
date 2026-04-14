import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Migration 004 — Partner search.
 * Players can post requests to find a doubles partner for a specific event.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(t('partner_requests'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.bigInteger('event_id').unsigned().notNullable()
      .references('id').inTable(t('events')).onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().notNullable()
      .references('id').inTable(t('users')).onDelete('CASCADE');
    table.text('message').nullable();
    table.enum('skill_level', ['beginner', 'intermediate', 'advanced', 'open']).defaultTo('open');
    table.enum('status', ['open', 'matched', 'closed']).defaultTo('open');
    table.bigInteger('matched_user_id').unsigned().nullable()
      .references('id').inTable(t('users')).onDelete('SET NULL');
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();

    table.index(['event_id', 'status']);
    table.index(['user_id']);
    table.unique(['event_id', 'user_id'], 'unique_event_user_partner');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(t('partner_requests'));
}
