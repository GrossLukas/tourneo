import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

export async function up(knex: Knex): Promise<void> {
  // ==========================================
  // AUDIT LOG
  // ==========================================
  await knex.schema.createTable(t('audit_logs'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('actor_id').unsigned().nullable().references('id').inTable(t('users'));
    table.string('actor_email', 255).nullable();
    table.enum('actor_role', ['user', 'admin', 'superadmin']).notNullable();
    table.string('action', 100).notNullable(); // e.g. 'event.create', 'event.publish', 'registration.cancel'
    table.string('resource_type', 50).notNullable(); // e.g. 'event', 'registration', 'user', 'membership'
    table.bigInteger('resource_id').unsigned().nullable();
    table.string('resource_label', 255).nullable(); // Human-readable label e.g. event title
    table.json('changes').nullable(); // { before: {}, after: {} }
    table.json('metadata').nullable(); // Additional context
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.datetime('created_at').notNullable();
    table.index(['actor_id']);
    table.index(['resource_type', 'resource_id']);
    table.index(['action']);
    table.index(['created_at']);
  });

  // ==========================================
  // EVENT EXTENSIONS
  // ==========================================
  // Add missing columns to events for better admin control
  await knex.schema.alterTable(t('events'), (table) => {
    table.datetime('archived_at').nullable();
    table.boolean('is_archived').defaultTo(false);
    table.bigInteger('duplicated_from_id').unsigned().nullable();
    table.text('faq').nullable(); // JSON array of { question, answer }
    table.text('venue_hints').nullable(); // Parking, food, etc.
    table.text('prize_table').nullable(); // JSON prize distribution
    table.text('streaming_url').nullable();
    table.text('rules_full').nullable(); // Full rules document
  });

  // ==========================================
  // CHECK-IN TRACKING
  // ==========================================
  await knex.schema.createTable(t('checkins'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('registration_id').unsigned().notNullable().references('id').inTable(t('registrations'));
    table.bigInteger('checked_in_by').unsigned().nullable().references('id').inTable(t('users')); // Admin who checked them in
    table.datetime('checked_in_at').notNullable();
    table.string('method', 20).defaultTo('manual'); // 'manual', 'qr_code', 'self'
    table.string('notes', 500).nullable();
    table.datetime('created_at').notNullable();
    table.unique(['registration_id']);
  });

  // ==========================================
  // REFUND TRACKING
  // ==========================================
  await knex.schema.createTable(t('refunds'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.bigInteger('payment_id').unsigned().notNullable().references('id').inTable(t('payments'));
    table.bigInteger('registration_id').unsigned().nullable().references('id').inTable(t('registrations'));
    table.bigInteger('requested_by').unsigned().nullable().references('id').inTable(t('users'));
    table.bigInteger('processed_by').unsigned().nullable().references('id').inTable(t('users'));
    table.integer('amount_cents').notNullable();
    table.string('currency', 3).defaultTo('EUR');
    table.enum('reason', ['user_cancellation_14d', 'organizer_cancellation', 'admin_decision', 'duplicate', 'other']).notNullable();
    table.text('reason_detail').nullable();
    table.enum('status', ['pending', 'approved', 'processed', 'rejected', 'failed']).defaultTo('pending');
    table.string('stripe_refund_id', 255).nullable();
    table.datetime('requested_at').notNullable();
    table.datetime('processed_at').nullable();
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();
    table.index(['payment_id']);
    table.index(['status']);
  });

  // ==========================================
  // HALL OF FAME
  // ==========================================
  await knex.schema.createTable(t('hall_of_fame'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('event_id').unsigned().notNullable().references('id').inTable(t('events'));
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users'));
    table.integer('placement').notNullable(); // 1, 2, 3
    table.integer('prize_amount_cents').defaultTo(0);
    table.string('display_name', 200).nullable();
    table.string('team_name', 200).nullable();
    table.text('achievement_note').nullable(); // e.g. "Unbeaten in 5 rounds"
    table.boolean('featured').defaultTo(false); // Show on home
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();
    table.index(['event_id']);
    table.index(['user_id']);
    table.index(['featured']);
  });

  // ==========================================
  // ADMIN NOTIFICATIONS TO PARTICIPANTS
  // ==========================================
  await knex.schema.createTable(t('admin_messages'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('event_id').unsigned().nullable().references('id').inTable(t('events'));
    table.bigInteger('sent_by').unsigned().notNullable().references('id').inTable(t('users'));
    table.string('subject', 255).notNullable();
    table.text('body').notNullable();
    table.enum('target', ['all_participants', 'confirmed_only', 'waitlisted_only', 'all_users']).defaultTo('all_participants');
    table.integer('recipient_count').defaultTo(0);
    table.datetime('sent_at').notNullable();
    table.datetime('created_at').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(t('admin_messages'));
  await knex.schema.dropTableIfExists(t('hall_of_fame'));
  await knex.schema.dropTableIfExists(t('refunds'));
  await knex.schema.dropTableIfExists(t('checkins'));
  await knex.schema.dropTableIfExists(t('audit_logs'));
  
  await knex.schema.alterTable(t('events'), (table) => {
    table.dropColumn('archived_at');
    table.dropColumn('is_archived');
    table.dropColumn('duplicated_from_id');
    table.dropColumn('faq');
    table.dropColumn('venue_hints');
    table.dropColumn('prize_table');
    table.dropColumn('streaming_url');
    table.dropColumn('rules_full');
  });
}