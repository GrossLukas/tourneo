import type { Knex } from 'knex';

const PREFIX = process.env.DB_TABLE_PREFIX || 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

const VENUES = t('venues');
const EVENTS = t('events');
const OSM_UNIQUE = 'uq_venues_osm_id';

/**
 * Migration 026 — Tournaments among friends.
 *
 * Every signed-in player can run a private tournament at a hall from the hall
 * finder or at a place of their own. Such a place becomes a community venue:
 * the event needs a venue row, but it is never listed or offered as a
 * bookable partner venue. Halls picked from OpenStreetMap are stored once per
 * OSM id. Events get a flag of their own so results of a tournament run by a
 * player (who also enters the scores) stay out of the public ELO ranking.
 */
export async function up(knex: Knex): Promise<void> {
  const venue = {
    community: await knex.schema.hasColumn(VENUES, 'is_community'),
    osm: await knex.schema.hasColumn(VENUES, 'osm_id'),
  };
  if (!venue.community || !venue.osm) {
    await knex.schema.alterTable(VENUES, (table) => {
      if (!venue.community) table.boolean('is_community').notNullable().defaultTo(false);
      if (!venue.osm) table.string('osm_id', 40).nullable().unique({ indexName: OSM_UNIQUE });
    });
  }
  if (!(await knex.schema.hasColumn(EVENTS, 'is_community'))) {
    await knex.schema.alterTable(EVENTS, (table) => {
      table.boolean('is_community').notNullable().defaultTo(false);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn(EVENTS, 'is_community')) {
    await knex.schema.alterTable(EVENTS, (table) => table.dropColumn('is_community'));
  }
  if (await knex.schema.hasColumn(VENUES, 'is_community')) {
    // Without the flag these rows would turn up as ordinary venues – park them instead
    await knex(VENUES).where('is_community', true).update({ status: 'inactive', updated_at: new Date() });
    await knex.schema.alterTable(VENUES, (table) => table.dropColumn('is_community'));
  }
  if (await knex.schema.hasColumn(VENUES, 'osm_id')) {
    await knex.schema.alterTable(VENUES, (table) => {
      table.dropUnique(['osm_id'], OSM_UNIQUE);
      table.dropColumn('osm_id');
    });
  }
}
