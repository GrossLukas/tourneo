import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

export async function up(knex: Knex): Promise<void> {
  // ==========================================
  // USERS & AUTH
  // ==========================================
  await knex.schema.createTable(t('users'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('apple_id', 255).unique().nullable();
    table.boolean('email_verified').defaultTo(false);
    table.enum('role', ['user', 'admin', 'superadmin']).defaultTo('user');
    table.enum('status', ['active', 'suspended', 'deleted']).defaultTo('active');
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();
    table.datetime('deleted_at').nullable();
    table.index(['email', 'status']);
    table.index(['status']);
  });

  await knex.schema.createTable(t('profiles'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('display_name', 100).nullable();
    table.date('date_of_birth').notNullable();
    table.string('phone', 20).nullable();
    table.string('city', 100).nullable();
    table.string('region', 100).nullable();
    table.string('country', 2).defaultTo('DE');
    table.string('avatar_url', 500).nullable();
    table.text('bio').nullable();
    table.datetime('created_at');
    table.datetime('updated_at');
    table.unique(['user_id']);
    table.index(['city']);
  });

  await knex.schema.createTable(t('language_preferences'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.string('locale', 10).notNullable().defaultTo('de');
    table.string('system_detected_locale', 10).nullable();
    table.boolean('manual_override').defaultTo(false);
    table.datetime('updated_at');
    table.unique(['user_id']);
  });

  // ==========================================
  // LEGAL & CONSENT
  // ==========================================
  await knex.schema.createTable(t('legal_document_versions'), (table) => {
    table.bigIncrements('id').primary();
    table.enum('document_type', ['terms', 'privacy', 'tournament_terms', 'imprint', 'media_policy', 'cancellation_policy']).notNullable();
    table.string('version', 20).notNullable();
    table.string('locale', 10).notNullable();
    table.string('title', 255).notNullable();
    table.text('content', 'longtext').notNullable();
    table.datetime('published_at').nullable();
    table.boolean('is_active').defaultTo(false);
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['document_type', 'locale', 'is_active']);
  });

  await knex.schema.createTable(t('consents'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.enum('consent_type', ['terms', 'privacy', 'age_verification', 'media_consent', 'tournament_terms', 'marketing']).notNullable();
    table.bigInteger('legal_document_version_id').unsigned().nullable().references('id').inTable(t('legal_document_versions'));
    table.boolean('granted').notNullable();
    table.datetime('granted_at').notNullable();
    table.datetime('revoked_at').nullable();
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.datetime('created_at');
    table.index(['user_id', 'consent_type']);
  });

  // ==========================================
  // MEMBERSHIP
  // ==========================================
  await knex.schema.createTable(t('memberships'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.enum('tier', ['free', 'plus', 'club']).defaultTo('free');
    table.enum('status', ['active', 'cancelled', 'expired', 'pending']).defaultTo('active');
    table.string('apple_subscription_id', 255).nullable();
    table.datetime('started_at').notNullable();
    table.datetime('expires_at').nullable();
    table.datetime('cancelled_at').nullable();
    table.integer('price_cents').nullable();
    table.string('currency', 3).defaultTo('EUR');
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['user_id', 'status']);
  });

  // ==========================================
  // TEAMS & SOCIAL
  // ==========================================
  await knex.schema.createTable(t('teams'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.string('name', 100).notNullable();
    table.bigInteger('captain_user_id').unsigned().notNullable().references('id').inTable(t('users'));
    table.enum('sport_category', ['padel', 'fifa', 'other']).defaultTo('padel');
    table.integer('max_members').defaultTo(4);
    table.string('avatar_url', 500).nullable();
    table.enum('status', ['active', 'disbanded']).defaultTo('active');
    table.datetime('created_at');
    table.datetime('updated_at');
  });

  await knex.schema.createTable(t('team_members'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('team_id').unsigned().notNullable().references('id').inTable(t('teams')).onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.enum('role', ['captain', 'member']).defaultTo('member');
    table.datetime('joined_at').notNullable();
    table.datetime('left_at').nullable();
    table.enum('status', ['active', 'invited', 'left', 'removed']).defaultTo('active');
    table.unique(['team_id', 'user_id']);
  });

  await knex.schema.createTable(t('friendships'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('requester_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.bigInteger('addressee_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.enum('status', ['pending', 'accepted', 'declined', 'blocked']).defaultTo('pending');
    table.datetime('created_at');
    table.datetime('updated_at');
    table.unique(['requester_id', 'addressee_id']);
  });

  // ==========================================
  // VENUES & COURTS
  // ==========================================
  await knex.schema.createTable(t('venues'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.string('address_street', 255).notNullable();
    table.string('address_city', 100).notNullable();
    table.string('address_zip', 20).notNullable();
    table.string('address_country', 2).defaultTo('DE');
    table.decimal('latitude', 10, 8).nullable();
    table.decimal('longitude', 11, 8).nullable();
    table.boolean('is_indoor').defaultTo(false);
    table.boolean('is_outdoor').defaultTo(false);
    table.boolean('is_partner_venue').defaultTo(false);
    table.string('partner_website_url', 500).nullable();
    table.string('partner_booking_url', 500).nullable();
    table.string('phone', 20).nullable();
    table.string('email', 255).nullable();
    table.string('image_url', 500).nullable();
    table.json('operating_hours').nullable();
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['address_city']);
    table.index(['is_partner_venue']);
    table.index(['status']);
  });

  await knex.schema.createTable(t('courts'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('venue_id').unsigned().notNullable().references('id').inTable(t('venues')).onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.enum('court_type', ['padel', 'tennis', 'multi']).defaultTo('padel');
    table.boolean('is_indoor').defaultTo(false);
    table.string('surface', 50).nullable();
    table.enum('status', ['active', 'maintenance', 'inactive']).defaultTo('active');
    table.datetime('created_at');
    table.datetime('updated_at');
  });

  await knex.schema.createTable(t('external_booking_links'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('venue_id').unsigned().notNullable().references('id').inTable(t('venues')).onDelete('CASCADE');
    table.string('label', 255).notNullable();
    table.string('url', 500).notNullable();
    table.enum('link_type', ['booking', 'website', 'phone', 'email', 'other']).defaultTo('website');
    table.boolean('is_active').defaultTo(true);
    table.datetime('created_at');
    table.datetime('updated_at');
  });

  // ==========================================
  // EVENTS & TOURNAMENTS
  // ==========================================
  await knex.schema.createTable(t('events'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.string('title', 255).notNullable();
    table.text('description', 'longtext').nullable();
    table.enum('sport_category', ['padel', 'fifa', 'other']).defaultTo('padel');
    table.enum('event_type', ['tournament', 'open_play', 'special']).defaultTo('tournament');
    table.bigInteger('venue_id').unsigned().notNullable().references('id').inTable(t('venues'));
    table.datetime('start_date').notNullable();
    table.datetime('end_date').notNullable();
    table.datetime('registration_opens_at').notNullable();
    table.datetime('registration_closes_at').notNullable();
    table.datetime('club_early_access_at').nullable();
    table.datetime('plus_early_access_at').nullable();
    table.boolean('is_indoor').defaultTo(false);
    table.boolean('is_outdoor').defaultTo(false);
    table.enum('format', ['singles', 'doubles']).defaultTo('doubles');
    table.enum('elimination_type', ['single_elimination', 'double_elimination', 'round_robin']).defaultTo('single_elimination');
    table.boolean('has_third_place_match').defaultTo(true);
    table.integer('max_participants').notNullable();
    table.integer('entry_fee_cents').notNullable().defaultTo(0);
    table.string('currency', 3).defaultTo('EUR');
    table.integer('total_prize_pool_cents').defaultTo(0);
    table.enum('level', ['beginner', 'intermediate', 'advanced', 'open']).defaultTo('open');
    table.enum('access_type', ['public', 'members_only', 'club_only']).defaultTo('public');
    table.boolean('has_food_drinks').defaultTo(false);
    table.boolean('has_streaming').defaultTo(false);
    table.text('special_notes').nullable();
    table.text('rules_summary').nullable();
    table.string('banner_image_url', 500).nullable();
    table.enum('status', ['draft', 'published', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled']).defaultTo('draft');
    table.bigInteger('created_by').unsigned().notNullable().references('id').inTable(t('users'));
    table.datetime('published_at').nullable();
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['sport_category', 'status']);
    table.index(['start_date']);
    table.index(['status']);
  });

  await knex.schema.createTable(t('prize_distributions'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('event_id').unsigned().notNullable().references('id').inTable(t('events')).onDelete('CASCADE');
    table.integer('place').notNullable();
    table.integer('amount_cents').notNullable();
    table.string('currency', 3).defaultTo('EUR');
    table.string('label', 50).nullable();
    table.unique(['event_id', 'place']);
  });

  // ==========================================
  // REGISTRATIONS
  // ==========================================
  await knex.schema.createTable(t('registrations'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.bigInteger('event_id').unsigned().notNullable().references('id').inTable(t('events'));
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users'));
    table.bigInteger('team_id').unsigned().nullable().references('id').inTable(t('teams'));
    table.enum('registration_type', ['solo', 'duo', 'team']).defaultTo('solo');
    table.bigInteger('partner_user_id').unsigned().nullable().references('id').inTable(t('users'));
    table.enum('status', ['pending_payment', 'confirmed', 'waitlisted', 'cancelled', 'refunded', 'no_show']).defaultTo('pending_payment');
    table.enum('membership_tier_at_registration', ['free', 'plus', 'club']);
    table.integer('discount_applied_cents').defaultTo(0);
    table.integer('seed_number').nullable();
    table.boolean('checked_in').defaultTo(false);
    table.datetime('checked_in_at').nullable();
    table.integer('final_placement').nullable();
    table.integer('prize_amount_cents').defaultTo(0);
    table.boolean('consent_tournament_terms').defaultTo(false);
    table.boolean('consent_age_verified').defaultTo(false);
    table.boolean('consent_media').defaultTo(false);
    table.integer('waitlist_position').nullable();
    table.datetime('waitlist_promoted_at').nullable();
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['event_id', 'status']);
    table.index(['user_id']);
  });

  // ==========================================
  // PAYMENTS & REFUNDS
  // ==========================================
  await knex.schema.createTable(t('payments'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users'));
    table.bigInteger('registration_id').unsigned().nullable().references('id').inTable(t('registrations'));
    table.enum('payment_type', ['tournament_fee', 'membership', 'other']);
    table.integer('amount_cents').notNullable();
    table.integer('discount_cents').defaultTo(0);
    table.integer('net_amount_cents').notNullable();
    table.string('currency', 3).defaultTo('EUR');
    table.enum('payment_method', ['card', 'apple_pay', 'other']);
    table.string('stripe_payment_intent_id', 255).nullable();
    table.string('stripe_charge_id', 255).nullable();
    table.enum('status', ['pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded']).defaultTo('pending');
    table.datetime('paid_at').nullable();
    table.datetime('failed_at').nullable();
    table.string('failure_reason', 500).nullable();
    table.string('receipt_url', 500).nullable();
    table.string('invoice_number', 50).nullable();
    table.json('metadata').nullable();
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['user_id']);
    table.index(['stripe_payment_intent_id']);
    table.index(['status']);
  });

  await knex.schema.createTable(t('refunds'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.bigInteger('payment_id').unsigned().notNullable().references('id').inTable(t('payments'));
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users'));
    table.integer('amount_cents').notNullable();
    table.enum('reason', ['user_cancellation_14d', 'organizer_cancellation', 'admin_decision', 'duplicate', 'other']);
    table.text('reason_detail').nullable();
    table.string('stripe_refund_id', 255).nullable();
    table.enum('status', ['pending', 'processed', 'failed']).defaultTo('pending');
    table.datetime('processed_at').nullable();
    table.bigInteger('processed_by').unsigned().nullable().references('id').inTable(t('users'));
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['payment_id']);
    table.index(['status']);
  });

  // ==========================================
  // BRACKETS & MATCHES
  // ==========================================
  await knex.schema.createTable(t('brackets'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('event_id').unsigned().notNullable().references('id').inTable(t('events')).unique();
    table.json('structure').notNullable();
    table.integer('total_rounds').notNullable();
    table.enum('status', ['draft', 'published', 'in_progress', 'completed']).defaultTo('draft');
    table.datetime('generated_at').nullable();
    table.datetime('published_at').nullable();
    table.datetime('created_at');
    table.datetime('updated_at');
  });

  await knex.schema.createTable(t('matches'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.bigInteger('event_id').unsigned().notNullable().references('id').inTable(t('events'));
    table.bigInteger('bracket_id').unsigned().notNullable().references('id').inTable(t('brackets')).onDelete('CASCADE');
    table.integer('round_number').notNullable();
    table.integer('match_number').notNullable();
    table.string('round_name', 50).nullable();
    table.bigInteger('court_id').unsigned().nullable().references('id').inTable(t('courts'));
    table.datetime('scheduled_at').nullable();
    table.bigInteger('participant_1_registration_id').unsigned().nullable().references('id').inTable(t('registrations'));
    table.bigInteger('participant_2_registration_id').unsigned().nullable().references('id').inTable(t('registrations'));
    table.bigInteger('winner_registration_id').unsigned().nullable().references('id').inTable(t('registrations'));
    table.boolean('is_third_place_match').defaultTo(false);
    table.boolean('is_final').defaultTo(false);
    table.bigInteger('next_match_id').unsigned().nullable();
    table.enum('status', ['upcoming', 'in_progress', 'completed', 'walkover', 'cancelled']).defaultTo('upcoming');
    table.datetime('started_at').nullable();
    table.datetime('completed_at').nullable();
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['event_id', 'round_number']);
    table.index(['bracket_id']);
  });

  await knex.schema.createTable(t('match_scores'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('match_id').unsigned().notNullable().references('id').inTable(t('matches')).onDelete('CASCADE');
    table.integer('set_number').notNullable();
    table.integer('participant_1_score').notNullable();
    table.integer('participant_2_score').notNullable();
    table.boolean('is_tiebreak').defaultTo(false);
    table.unique(['match_id', 'set_number']);
  });

  // ==========================================
  // PRIZE PAYOUTS
  // ==========================================
  await knex.schema.createTable(t('prize_payouts'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('event_id').unsigned().notNullable().references('id').inTable(t('events'));
    table.bigInteger('registration_id').unsigned().notNullable().references('id').inTable(t('registrations'));
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users'));
    table.integer('place').notNullable();
    table.integer('amount_cents').notNullable();
    table.string('currency', 3).defaultTo('EUR');
    table.enum('payout_method', ['bank_transfer', 'cash', 'other']);
    table.enum('status', ['pending', 'processing', 'paid', 'failed']).defaultTo('pending');
    table.datetime('paid_at').nullable();
    table.string('reference', 255).nullable();
    table.text('notes').nullable();
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['event_id']);
    table.index(['user_id']);
  });

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  await knex.schema.createTable(t('notifications'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.enum('type', [
      'registration_confirmed', 'event_published', 'waitlist_promoted',
      'event_reminder_1d', 'event_reminder_1h', 'checkin_available',
      'match_upcoming', 'result_entered', 'tournament_completed',
      'prize_available', 'membership_renewed', 'general',
    ]);
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.json('data').nullable();
    table.boolean('is_read').defaultTo(false);
    table.boolean('is_push_sent').defaultTo(false);
    table.datetime('push_sent_at').nullable();
    table.datetime('read_at').nullable();
    table.datetime('created_at');
    table.index(['user_id', 'is_read']);
  });

  await knex.schema.createTable(t('push_tokens'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.string('token', 500).notNullable();
    table.enum('platform', ['ios', 'android']).defaultTo('ios');
    table.boolean('is_active').defaultTo(true);
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['user_id', 'is_active']);
  });

  // ==========================================
  // SUPPORT
  // ==========================================
  await knex.schema.createTable(t('support_tickets'), (table) => {
    table.bigIncrements('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users'));
    table.bigInteger('event_id').unsigned().nullable().references('id').inTable(t('events'));
    table.enum('category', ['general', 'payment', 'refund', 'tournament', 'technical', 'account', 'other']);
    table.string('subject', 255).notNullable();
    table.text('message').notNullable();
    table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.bigInteger('assigned_to').unsigned().nullable().references('id').inTable(t('users'));
    table.datetime('resolved_at').nullable();
    table.datetime('created_at');
    table.datetime('updated_at');
    table.index(['user_id']);
    table.index(['status']);
  });

  await knex.schema.createTable(t('support_ticket_messages'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('ticket_id').unsigned().notNullable().references('id').inTable(t('support_tickets')).onDelete('CASCADE');
    table.bigInteger('sender_id').unsigned().notNullable().references('id').inTable(t('users'));
    table.text('message').notNullable();
    table.boolean('is_admin_reply').defaultTo(false);
    table.datetime('created_at');
  });

  // ==========================================
  // MEDIA CONSENTS
  // ==========================================
  await knex.schema.createTable(t('media_consents'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users')).onDelete('CASCADE');
    table.bigInteger('event_id').unsigned().nullable().references('id').inTable(t('events'));
    table.enum('consent_type', ['photo', 'video', 'streaming', 'all']);
    table.boolean('granted').notNullable();
    table.datetime('granted_at');
    table.datetime('revoked_at').nullable();
    table.datetime('created_at');
  });

  // ==========================================
  // HALL OF FAME
  // ==========================================
  await knex.schema.createTable(t('hall_of_fame'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('event_id').unsigned().notNullable().references('id').inTable(t('events'));
    table.bigInteger('registration_id').unsigned().notNullable().references('id').inTable(t('registrations'));
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable(t('users'));
    table.bigInteger('team_id').unsigned().nullable().references('id').inTable(t('teams'));
    table.integer('place').notNullable();
    table.integer('prize_amount_cents').defaultTo(0);
    table.enum('sport_category', ['padel', 'fifa', 'other']);
    table.string('event_title', 255);
    table.date('event_date');
    table.datetime('created_at');
    table.index(['sport_category']);
    table.index(['user_id']);
  });

  // ==========================================
  // AUDIT LOG
  // ==========================================
  await knex.schema.createTable(t('audit_log'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().nullable().references('id').inTable(t('users'));
    table.string('action', 100).notNullable();
    table.string('entity_type', 50).notNullable();
    table.bigInteger('entity_id').nullable();
    table.json('old_values').nullable();
    table.json('new_values').nullable();
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.datetime('created_at');
    table.index(['user_id']);
    table.index(['entity_type', 'entity_id']);
    table.index(['action']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'audit_log',
    'hall_of_fame',
    'media_consents',
    'support_ticket_messages',
    'support_tickets',
    'push_tokens',
    'notifications',
    'prize_payouts',
    'match_scores',
    'matches',
    'brackets',
    'refunds',
    'payments',
    'registrations',
    'prize_distributions',
    'events',
    'external_booking_links',
    'courts',
    'venues',
    'friendships',
    'team_members',
    'teams',
    'memberships',
    'consents',
    'legal_document_versions',
    'language_preferences',
    'profiles',
    'users',
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(t(table));
  }
}