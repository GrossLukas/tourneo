import type { Knex } from 'knex';

const PREFIX = process.env.DB_TABLE_PREFIX || 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

const VENUES = t('osm_padel_venues');

/**
 * Migration 025 — Local copy of all padel venues from OpenStreetMap.
 *
 * Live Overpass queries take up to half a minute and fail under load, which
 * is too slow and too flaky for a search screen. A nightly job imports the
 * configured countries into this table; searches read from here and only
 * fall back to a live query outside the imported countries.
 */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable(VENUES)) return;
  await knex.schema.createTable(VENUES, (table) => {
    table.string('osm_id', 40).primary();
    table.string('country', 2).notNullable();
    table.string('name', 255).notNullable();
    table.decimal('latitude', 10, 7).notNullable();
    table.decimal('longitude', 10, 7).notNullable();
    table.integer('courts').nullable();
    table.boolean('indoor').nullable();
    table.string('address', 255).nullable();
    table.string('website', 500).nullable();
    table.string('phone', 50).nullable();
    table.string('opening_hours', 255).nullable();
    table.datetime('imported_at').notNullable();
    table.index(['latitude', 'longitude'], 'idx_osm_padel_geo');
    table.index(['country'], 'idx_osm_padel_country');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(VENUES);
}
