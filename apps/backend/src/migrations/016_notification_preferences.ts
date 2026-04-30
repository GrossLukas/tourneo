import type { Knex } from 'knex';
import { t } from '../config/database';

async function hasColumn(knex: Knex, table: string, column: string) {
  return knex.schema.hasColumn(table, column);
}

export async function up(knex: Knex): Promise<void> {
  const profilesTable = t('profiles');

  const columns = {
    notify_nearby_events: await hasColumn(knex, profilesTable, 'notify_nearby_events'),
    notify_radius_km: await hasColumn(knex, profilesTable, 'notify_radius_km'),
    notify_level_filter: await hasColumn(knex, profilesTable, 'notify_level_filter'),
  };

  await knex.schema.alterTable(profilesTable, (table) => {
    if (!columns.notify_nearby_events) {
      table.boolean('notify_nearby_events').notNullable().defaultTo(true);
    }
    if (!columns.notify_radius_km) {
      table.integer('notify_radius_km').notNullable().defaultTo(50);
    }
    if (!columns.notify_level_filter) {
      table
        .enum('notify_level_filter', ['all', 'beginner', 'intermediate', 'advanced', 'open'])
        .notNullable()
        .defaultTo('all');
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  const profilesTable = t('profiles');
  for (const column of ['notify_level_filter', 'notify_radius_km', 'notify_nearby_events']) {
    if (await hasColumn(knex, profilesTable, column)) {
      await knex.schema.alterTable(profilesTable, (table) => {
        table.dropColumn(column);
      });
    }
  }
}
