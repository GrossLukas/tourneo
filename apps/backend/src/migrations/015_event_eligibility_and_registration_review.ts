import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

const STATUS_WITH_REVIEW = [
  'pending_verification',
  'pending_payment',
  'confirmed',
  'waitlisted',
  'cancelled',
  'refunded',
  'rejected',
  'no_show',
];

const STATUS_ORIGINAL = [
  'pending_payment',
  'confirmed',
  'waitlisted',
  'cancelled',
  'refunded',
  'no_show',
];

export async function up(knex: Knex): Promise<void> {
  const eventsTable = t('events');
  const registrationsTable = t('registrations');

  const eventColumns = {
    requires_playtomic_verification: await knex.schema.hasColumn(eventsTable, 'requires_playtomic_verification'),
    min_playtomic_level: await knex.schema.hasColumn(eventsTable, 'min_playtomic_level'),
    max_playtomic_level: await knex.schema.hasColumn(eventsTable, 'max_playtomic_level'),
    eligibility_note: await knex.schema.hasColumn(eventsTable, 'eligibility_note'),
    nearby_radius_km: await knex.schema.hasColumn(eventsTable, 'nearby_radius_km'),
  };

  if (Object.values(eventColumns).some((exists) => !exists)) {
    await knex.schema.alterTable(eventsTable, (table) => {
      if (!eventColumns.requires_playtomic_verification) {
        table.boolean('requires_playtomic_verification').notNullable().defaultTo(false);
      }
      if (!eventColumns.min_playtomic_level) table.decimal('min_playtomic_level', 3, 1).nullable();
      if (!eventColumns.max_playtomic_level) table.decimal('max_playtomic_level', 3, 1).nullable();
      if (!eventColumns.eligibility_note) table.text('eligibility_note').nullable();
      if (!eventColumns.nearby_radius_km) table.integer('nearby_radius_km').notNullable().defaultTo(50);
    });
  }

  await knex.raw(`ALTER TABLE ?? MODIFY ?? ENUM(${STATUS_WITH_REVIEW.map(() => '?').join(',')}) NOT NULL DEFAULT ?`, [
    registrationsTable,
    'status',
    ...STATUS_WITH_REVIEW,
    'pending_payment',
  ]);

  const registrationColumns = {
    eligibility_status: await knex.schema.hasColumn(registrationsTable, 'eligibility_status'),
    eligibility_checked_by: await knex.schema.hasColumn(registrationsTable, 'eligibility_checked_by'),
    eligibility_checked_at: await knex.schema.hasColumn(registrationsTable, 'eligibility_checked_at'),
    eligibility_note: await knex.schema.hasColumn(registrationsTable, 'eligibility_note'),
    playtomic_level_at_registration: await knex.schema.hasColumn(registrationsTable, 'playtomic_level_at_registration'),
    playtomic_status_at_registration: await knex.schema.hasColumn(registrationsTable, 'playtomic_status_at_registration'),
  };

  if (Object.values(registrationColumns).some((exists) => !exists)) {
    await knex.schema.alterTable(registrationsTable, (table) => {
      if (!registrationColumns.eligibility_status) {
        table
          .enum('eligibility_status', ['not_required', 'pending', 'approved', 'rejected'])
          .notNullable()
          .defaultTo('not_required');
      }
      if (!registrationColumns.eligibility_checked_by) {
        table
          .bigInteger('eligibility_checked_by')
          .unsigned()
          .nullable()
          .references('id')
          .inTable(t('users'))
          .onDelete('SET NULL');
      }
      if (!registrationColumns.eligibility_checked_at) table.datetime('eligibility_checked_at').nullable();
      if (!registrationColumns.eligibility_note) table.text('eligibility_note').nullable();
      if (!registrationColumns.playtomic_level_at_registration) {
        table.decimal('playtomic_level_at_registration', 3, 1).nullable();
      }
      if (!registrationColumns.playtomic_status_at_registration) {
        table
          .enum('playtomic_status_at_registration', ['none', 'pending', 'approved', 'rejected'])
          .nullable();
      }
    });
  }

  const hasEligibilityIndex = await hasIndex(knex, registrationsTable, 'idx_registrations_eligibility_status');
  if (!hasEligibilityIndex) {
    await knex.schema.alterTable(registrationsTable, (table) => {
      table.index(['event_id', 'eligibility_status'], 'idx_registrations_eligibility_status');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const eventsTable = t('events');
  const registrationsTable = t('registrations');

  const hasEligibilityIndex = await hasIndex(knex, registrationsTable, 'idx_registrations_eligibility_status');
  if (hasEligibilityIndex) {
    await knex.schema.alterTable(registrationsTable, (table) => {
      table.dropIndex(['event_id', 'eligibility_status'], 'idx_registrations_eligibility_status');
    });
  }

  const columnsToDrop = [
    'playtomic_status_at_registration',
    'playtomic_level_at_registration',
    'eligibility_note',
    'eligibility_checked_at',
    'eligibility_checked_by',
    'eligibility_status',
  ];
  for (const column of columnsToDrop) {
    if (await knex.schema.hasColumn(registrationsTable, column)) {
      await knex.schema.alterTable(registrationsTable, (table) => {
        table.dropColumn(column);
      });
    }
  }

  await knex(registrationsTable).whereIn('status', ['pending_verification', 'rejected']).update({
    status: 'cancelled',
  });
  await knex.raw(`ALTER TABLE ?? MODIFY ?? ENUM(${STATUS_ORIGINAL.map(() => '?').join(',')}) NOT NULL DEFAULT ?`, [
    registrationsTable,
    'status',
    ...STATUS_ORIGINAL,
    'pending_payment',
  ]);

  for (const column of [
    'nearby_radius_km',
    'eligibility_note',
    'max_playtomic_level',
    'min_playtomic_level',
    'requires_playtomic_verification',
  ]) {
    if (await knex.schema.hasColumn(eventsTable, column)) {
      await knex.schema.alterTable(eventsTable, (table) => {
        table.dropColumn(column);
      });
    }
  }
}

async function hasIndex(knex: Knex, tableName: string, indexName: string): Promise<boolean> {
  const rows = await knex.raw('SHOW INDEX FROM ?? WHERE Key_name = ?', [tableName, indexName]);
  const result = Array.isArray(rows) ? rows[0] : rows;
  return Array.isArray(result) && result.length > 0;
}
