import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

export async function up(knex: Knex): Promise<void> {
  const profilesTable = t('profiles');
  const registrationsTable = t('registrations');
  const eventsTable = t('events');

  const profileColumns = {
    playtomic_ocr_status: await knex.schema.hasColumn(profilesTable, 'playtomic_ocr_status'),
    playtomic_ocr_level: await knex.schema.hasColumn(profilesTable, 'playtomic_ocr_level'),
    playtomic_ocr_name: await knex.schema.hasColumn(profilesTable, 'playtomic_ocr_name'),
    playtomic_ocr_points: await knex.schema.hasColumn(profilesTable, 'playtomic_ocr_points'),
    playtomic_ocr_raw_text: await knex.schema.hasColumn(profilesTable, 'playtomic_ocr_raw_text'),
    playtomic_screenshot_sha256: await knex.schema.hasColumn(profilesTable, 'playtomic_screenshot_sha256'),
    playtomic_screenshot_phash: await knex.schema.hasColumn(profilesTable, 'playtomic_screenshot_phash'),
    playtomic_duplicate_user_id: await knex.schema.hasColumn(profilesTable, 'playtomic_duplicate_user_id'),
    playtomic_duplicate_warning_at: await knex.schema.hasColumn(profilesTable, 'playtomic_duplicate_warning_at'),
  };

  if (Object.values(profileColumns).some((exists) => !exists)) {
    await knex.schema.alterTable(profilesTable, (table) => {
      if (!profileColumns.playtomic_ocr_status) {
        table.enum('playtomic_ocr_status', ['pending', 'success', 'failed']).nullable();
      }
      if (!profileColumns.playtomic_ocr_level) table.decimal('playtomic_ocr_level', 3, 1).nullable();
      if (!profileColumns.playtomic_ocr_name) table.string('playtomic_ocr_name', 255).nullable();
      if (!profileColumns.playtomic_ocr_points) table.integer('playtomic_ocr_points').nullable();
      if (!profileColumns.playtomic_ocr_raw_text) table.text('playtomic_ocr_raw_text').nullable();
      if (!profileColumns.playtomic_screenshot_sha256) table.string('playtomic_screenshot_sha256', 64).nullable();
      if (!profileColumns.playtomic_screenshot_phash) table.string('playtomic_screenshot_phash', 16).nullable();
      if (!profileColumns.playtomic_duplicate_user_id) {
        table
          .bigInteger('playtomic_duplicate_user_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable(t('users'))
          .onDelete('SET NULL');
      }
      if (!profileColumns.playtomic_duplicate_warning_at) {
        table.datetime('playtomic_duplicate_warning_at').nullable();
      }
    });
  }

  await ensureIndex(knex, profilesTable, 'idx_profiles_playtomic_hash', ['playtomic_screenshot_sha256']);
  await ensureIndex(knex, profilesTable, 'idx_profiles_playtomic_phash', ['playtomic_screenshot_phash']);

  const registrationColumns = {
    checkin_qr_token: await knex.schema.hasColumn(registrationsTable, 'checkin_qr_token'),
    checkin_qr_expires_at: await knex.schema.hasColumn(registrationsTable, 'checkin_qr_expires_at'),
    waitlist_payment_reminder_sent_at: await knex.schema.hasColumn(registrationsTable, 'waitlist_payment_reminder_sent_at'),
  };

  if (Object.values(registrationColumns).some((exists) => !exists)) {
    await knex.schema.alterTable(registrationsTable, (table) => {
      if (!registrationColumns.checkin_qr_token) table.string('checkin_qr_token', 64).nullable();
      if (!registrationColumns.checkin_qr_expires_at) table.datetime('checkin_qr_expires_at').nullable();
      if (!registrationColumns.waitlist_payment_reminder_sent_at) {
        table.datetime('waitlist_payment_reminder_sent_at').nullable();
      }
    });
  }

  await ensureIndex(knex, registrationsTable, 'idx_registrations_checkin_qr_token', ['checkin_qr_token'], true);
  await ensureIndex(
    knex,
    registrationsTable,
    'idx_registrations_waitlist_reminder',
    ['status', 'waitlist_promoted_at', 'waitlist_payment_reminder_sent_at']
  );

  const eventColumns = {
    maintenance_mode: await knex.schema.hasColumn(eventsTable, 'maintenance_mode'),
    maintenance_message: await knex.schema.hasColumn(eventsTable, 'maintenance_message'),
    checkin_opens_minutes_before: await knex.schema.hasColumn(eventsTable, 'checkin_opens_minutes_before'),
    waitlist_payment_window_hours: await knex.schema.hasColumn(eventsTable, 'waitlist_payment_window_hours'),
  };

  if (Object.values(eventColumns).some((exists) => !exists)) {
    await knex.schema.alterTable(eventsTable, (table) => {
      if (!eventColumns.maintenance_mode) table.boolean('maintenance_mode').notNullable().defaultTo(false);
      if (!eventColumns.maintenance_message) table.text('maintenance_message').nullable();
      if (!eventColumns.checkin_opens_minutes_before) {
        table.integer('checkin_opens_minutes_before').notNullable().defaultTo(60);
      }
      if (!eventColumns.waitlist_payment_window_hours) {
        table.integer('waitlist_payment_window_hours').notNullable().defaultTo(24);
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const profilesTable = t('profiles');
  const registrationsTable = t('registrations');
  const eventsTable = t('events');

  await dropIndex(knex, registrationsTable, 'idx_registrations_waitlist_reminder', [
    'status',
    'waitlist_promoted_at',
    'waitlist_payment_reminder_sent_at',
  ]);
  await dropIndex(knex, registrationsTable, 'idx_registrations_checkin_qr_token', ['checkin_qr_token']);
  await dropIndex(knex, profilesTable, 'idx_profiles_playtomic_phash', ['playtomic_screenshot_phash']);
  await dropIndex(knex, profilesTable, 'idx_profiles_playtomic_hash', ['playtomic_screenshot_sha256']);

  for (const column of [
    'waitlist_payment_reminder_sent_at',
    'checkin_qr_expires_at',
    'checkin_qr_token',
  ]) {
    if (await knex.schema.hasColumn(registrationsTable, column)) {
      await knex.schema.alterTable(registrationsTable, (table) => table.dropColumn(column));
    }
  }

  for (const column of [
    'waitlist_payment_window_hours',
    'checkin_opens_minutes_before',
    'maintenance_message',
    'maintenance_mode',
  ]) {
    if (await knex.schema.hasColumn(eventsTable, column)) {
      await knex.schema.alterTable(eventsTable, (table) => table.dropColumn(column));
    }
  }

  for (const column of [
    'playtomic_duplicate_warning_at',
    'playtomic_duplicate_user_id',
    'playtomic_screenshot_phash',
    'playtomic_screenshot_sha256',
    'playtomic_ocr_raw_text',
    'playtomic_ocr_points',
    'playtomic_ocr_name',
    'playtomic_ocr_level',
    'playtomic_ocr_status',
  ]) {
    if (await knex.schema.hasColumn(profilesTable, column)) {
      await knex.schema.alterTable(profilesTable, (table) => table.dropColumn(column));
    }
  }
}

async function ensureIndex(
  knex: Knex,
  tableName: string,
  indexName: string,
  columns: string[],
  unique = false
): Promise<void> {
  if (await hasIndex(knex, tableName, indexName)) return;
  await knex.schema.alterTable(tableName, (table) => {
    if (unique) table.unique(columns, { indexName });
    else table.index(columns, indexName);
  });
}

async function dropIndex(knex: Knex, tableName: string, indexName: string, columns: string[]): Promise<void> {
  if (!(await hasIndex(knex, tableName, indexName))) return;
  await knex.schema.alterTable(tableName, (table) => {
    table.dropIndex(columns, indexName);
  });
}

async function hasIndex(knex: Knex, tableName: string, indexName: string): Promise<boolean> {
  const rows = await knex.raw('SHOW INDEX FROM ?? WHERE Key_name = ?', [tableName, indexName]);
  const result = Array.isArray(rows) ? rows[0] : rows;
  return Array.isArray(result) && result.length > 0;
}
