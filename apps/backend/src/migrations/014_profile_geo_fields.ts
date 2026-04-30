import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Adds optional profile coordinates used by player discovery / matchmaking.
 */
export async function up(knex: Knex): Promise<void> {
  const hasLatitude = await knex.schema.hasColumn(t('profiles'), 'latitude');
  const hasLongitude = await knex.schema.hasColumn(t('profiles'), 'longitude');

  if (!hasLatitude || !hasLongitude) {
    await knex.schema.alterTable(t('profiles'), (table) => {
      if (!hasLatitude) table.decimal('latitude', 10, 8).nullable();
      if (!hasLongitude) table.decimal('longitude', 11, 8).nullable();
    });
  }

  const hasProfilesGeoIndex = await hasIndex(knex, t('profiles'), 'idx_profiles_geo');
  if (!hasProfilesGeoIndex) {
    await knex.schema.alterTable(t('profiles'), (table) => {
      table.index(['latitude', 'longitude'], 'idx_profiles_geo');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasProfilesGeoIndex = await hasIndex(knex, t('profiles'), 'idx_profiles_geo');
  if (hasProfilesGeoIndex) {
    await knex.schema.alterTable(t('profiles'), (table) => {
      table.dropIndex(['latitude', 'longitude'], 'idx_profiles_geo');
    });
  }

  const hasLatitude = await knex.schema.hasColumn(t('profiles'), 'latitude');
  const hasLongitude = await knex.schema.hasColumn(t('profiles'), 'longitude');
  if (hasLatitude || hasLongitude) {
    await knex.schema.alterTable(t('profiles'), (table) => {
      if (hasLatitude) table.dropColumn('latitude');
      if (hasLongitude) table.dropColumn('longitude');
    });
  }
}

async function hasIndex(knex: Knex, tableName: string, indexName: string): Promise<boolean> {
  const rows = await knex.raw('SHOW INDEX FROM ?? WHERE Key_name = ?', [tableName, indexName]);
  const result = Array.isArray(rows) ? rows[0] : rows;
  return Array.isArray(result) && result.length > 0;
}
