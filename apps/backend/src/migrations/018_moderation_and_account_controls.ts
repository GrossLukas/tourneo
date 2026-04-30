import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(t('user_blocks')))) {
    await knex.schema.createTable(t('user_blocks'), (table) => {
      table.bigIncrements('id').primary();
      table
        .bigInteger('blocker_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(t('users'))
        .onDelete('CASCADE');
      table
        .bigInteger('blocked_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(t('users'))
        .onDelete('CASCADE');
      table.datetime('created_at').notNullable();
      table.unique(['blocker_user_id', 'blocked_user_id']);
      table.index(['blocked_user_id']);
    });
  }

  if (!(await knex.schema.hasTable(t('moderation_reports')))) {
    await knex.schema.createTable(t('moderation_reports'), (table) => {
      table.bigIncrements('id').primary();
      table.string('uuid', 36).notNullable().unique();
      table
        .bigInteger('reporter_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(t('users'))
        .onDelete('CASCADE');
      table
        .bigInteger('target_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable(t('users'))
        .onDelete('SET NULL');
      table
        .enum('target_type', ['profile', 'chat_message', 'venue_review', 'venue_photo', 'event', 'other'])
        .notNullable();
      table.bigInteger('target_id').nullable();
      table
        .enum('reason', ['spam', 'abuse', 'harassment', 'inappropriate', 'privacy', 'fraud', 'other'])
        .notNullable();
      table.text('detail').nullable();
      table.enum('status', ['open', 'reviewed', 'dismissed', 'actioned']).notNullable().defaultTo('open');
      table
        .bigInteger('reviewed_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable(t('users'))
        .onDelete('SET NULL');
      table.datetime('reviewed_at').nullable();
      table.text('action_taken').nullable();
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();
      table.index(['status', 'created_at']);
      table.index(['target_type', 'target_id']);
      table.index(['reporter_user_id']);
    });
  }

  await addModerationColumns(knex, t('chat_messages'), true);
  await addModerationColumns(knex, t('venue_reviews'), true);
  await addModerationColumns(knex, t('venue_photos'), false);
}

export async function down(knex: Knex): Promise<void> {
  await dropModerationColumns(knex, t('venue_photos'));
  await dropModerationColumns(knex, t('venue_reviews'));
  await dropModerationColumns(knex, t('chat_messages'));
  await knex.schema.dropTableIfExists(t('moderation_reports'));
  await knex.schema.dropTableIfExists(t('user_blocks'));
}

async function addModerationColumns(knex: Knex, tableName: string, withUpdatedAt: boolean) {
  if (!(await knex.schema.hasTable(tableName))) return;
  const columns = {
    moderation_status: await knex.schema.hasColumn(tableName, 'moderation_status'),
    hidden_at: await knex.schema.hasColumn(tableName, 'hidden_at'),
    hidden_by: await knex.schema.hasColumn(tableName, 'hidden_by'),
    moderation_note: await knex.schema.hasColumn(tableName, 'moderation_note'),
    updated_at: await knex.schema.hasColumn(tableName, 'updated_at'),
  };

  await knex.schema.alterTable(tableName, (table) => {
    if (!columns.moderation_status) {
      table.enum('moderation_status', ['visible', 'hidden']).notNullable().defaultTo('visible');
    }
    if (!columns.hidden_at) table.datetime('hidden_at').nullable();
    if (!columns.hidden_by) {
      table.bigInteger('hidden_by').unsigned().nullable().references('id').inTable(t('users')).onDelete('SET NULL');
    }
    if (!columns.moderation_note) table.text('moderation_note').nullable();
    if (withUpdatedAt && !columns.updated_at) table.datetime('updated_at').nullable();
  });
}

async function dropModerationColumns(knex: Knex, tableName: string) {
  if (!(await knex.schema.hasTable(tableName))) return;
  for (const column of ['moderation_note', 'hidden_by', 'hidden_at', 'moderation_status']) {
    if (await knex.schema.hasColumn(tableName, column)) {
      await knex.schema.alterTable(tableName, (table) => {
        table.dropColumn(column);
      });
    }
  }
}
