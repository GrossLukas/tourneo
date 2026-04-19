import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Migration 010 — Playtomic rating bootstrap, match feedback (rating calibration),
 * and court availability.
 *
 * Adds to profiles:
 *   - playtomic_level (decimal 0–7, nullable)
 *   - playtomic_verification_status ('none' | 'pending' | 'approved' | 'rejected')
 *   - playtomic_screenshot_url (nullable)
 *   - playtomic_verified_at (nullable)
 *   - playtomic_verified_by (admin user id, nullable)
 *   - initial_rating_source ('default' | 'playtomic_self' | 'playtomic_verified')
 *
 * New tables:
 *   - match_feedback: post-match opponent strength feedback (lower/correct/higher)
 *   - court_availability: venue/court availability slots
 */
export async function up(knex: Knex): Promise<void> {
  // 1. Extend profiles with Playtomic fields
  await knex.schema.alterTable(t('profiles'), (table) => {
    table.decimal('playtomic_level', 3, 1).nullable();
    table.enum('playtomic_verification_status', ['none', 'pending', 'approved', 'rejected'])
      .defaultTo('none');
    table.string('playtomic_screenshot_url', 500).nullable();
    table.datetime('playtomic_verified_at').nullable();
    table.bigInteger('playtomic_verified_by').unsigned().nullable()
      .references('id').inTable(t('users')).onDelete('SET NULL');
    table.enum('initial_rating_source', ['default', 'playtomic_self', 'playtomic_verified'])
      .defaultTo('default');
    table.index(['playtomic_verification_status']);
  });

  // 2. Match feedback table – players rate opponent strength after match
  await knex.schema.createTable(t('match_feedback'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('match_id').unsigned().notNullable()
      .references('id').inTable(t('matches')).onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().notNullable()
      .references('id').inTable(t('users')).onDelete('CASCADE');
    table.bigInteger('opponent_user_id').unsigned().notNullable()
      .references('id').inTable(t('users')).onDelete('CASCADE');
    table.enum('feedback', ['lower', 'correct', 'higher']).notNullable();
    table.text('comment').nullable();
    table.datetime('created_at').notNullable();

    table.unique(['match_id', 'user_id', 'opponent_user_id']);
    table.index(['opponent_user_id']);
    table.index(['user_id']);
  });

  // 3. Court availability table – venue/court availability slots
  await knex.schema.createTable(t('court_availability'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('venue_id').unsigned().notNullable()
      .references('id').inTable(t('venues')).onDelete('CASCADE');
    table.bigInteger('court_id').unsigned().nullable()
      .references('id').inTable(t('courts')).onDelete('CASCADE');
    table.date('slot_date').notNullable();
    table.time('slot_start').notNullable();
    table.time('slot_end').notNullable();
    table.enum('status', ['available', 'booked', 'blocked']).defaultTo('available');
    table.integer('price_cents').nullable();
    table.string('booking_url', 500).nullable();
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();

    table.index(['venue_id', 'slot_date']);
    table.index(['court_id', 'slot_date']);
    table.index(['slot_date', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(t('court_availability'));
  await knex.schema.dropTableIfExists(t('match_feedback'));

  await knex.schema.alterTable(t('profiles'), (table) => {
    table.dropIndex(['playtomic_verification_status']);
    table.dropColumn('playtomic_level');
    table.dropColumn('playtomic_verification_status');
    table.dropColumn('playtomic_screenshot_url');
    table.dropColumn('playtomic_verified_at');
    table.dropColumn('playtomic_verified_by');
    table.dropColumn('initial_rating_source');
  });
}
