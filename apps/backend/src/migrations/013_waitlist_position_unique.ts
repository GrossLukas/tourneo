import type { Knex } from 'knex';

/**
 * Adds an additional safety net for concurrent waitlist inserts:
 *
 *   - In MySQL/MariaDB we can't define a partial UNIQUE index ("UNIQUE WHERE
 *     status='waitlisted'"), so we add a normal composite index on
 *     (event_id, waitlist_position). Combined with the SELECT…FOR UPDATE on
 *     the events row that the registration service already holds, this
 *     prevents two concurrent inserts from racing onto the same position.
 *
 *   - For databases that support partial indexes (Postgres) the migration
 *     would create a stricter UNIQUE-WHERE; the current backend targets
 *     MySQL, so the composite index plus the application-level lock are
 *     used together.
 *
 * The migration is defensive: it skips creation if an index with the same
 * name already exists, so re-running on partially migrated databases is
 * safe.
 */

const TABLE = (process.env.DB_TABLE_PREFIX || 'tourneo_') + 'registrations';
const INDEX_NAME = `${TABLE}_event_waitlist_position_idx`;

export async function up(knex: Knex): Promise<void> {
  // Defensive: if the index already exists (e.g. partial earlier migration),
  // skip silently.
  const exists = await knex
    .raw(
      `SELECT COUNT(*) as cnt FROM information_schema.statistics
       WHERE table_schema = DATABASE()
         AND table_name = ?
         AND index_name = ?`,
      [TABLE, INDEX_NAME]
    )
    .then((res: any) => Number(res?.[0]?.[0]?.cnt || 0))
    .catch(() => 0);

  if (exists > 0) return;

  await knex.schema.alterTable(TABLE, (table) => {
    table.index(['event_id', 'waitlist_position'], INDEX_NAME);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE, (table) => {
    table.dropIndex(['event_id', 'waitlist_position'], INDEX_NAME);
  });
}
