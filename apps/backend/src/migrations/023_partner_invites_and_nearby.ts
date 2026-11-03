import type { Knex } from 'knex';

const PREFIX = process.env.DB_TABLE_PREFIX || 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

const REGISTRATIONS = t('registrations');
const PROFILES = t('profiles');
const INVITE_INDEX = 'idx_registrations_partner_invite';

/**
 * Migration 023 — Duo partner invites by e-mail, nearby-event alerts.
 *
 * Registrations: a duo can be registered with the partner's e-mail address.
 * When that person registers for the same event the two registrations are
 * linked (invite accepted).
 *
 * Profiles: an opt-in area for "new tournament" pushes. The location is
 * stored rounded to about a kilometre and only when the user enables it.
 */
export async function up(knex: Knex): Promise<void> {
  const reg = {
    email: await knex.schema.hasColumn(REGISTRATIONS, 'partner_invite_email'),
    status: await knex.schema.hasColumn(REGISTRATIONS, 'partner_invite_status'),
    invited: await knex.schema.hasColumn(REGISTRATIONS, 'partner_invited_at'),
    accepted: await knex.schema.hasColumn(REGISTRATIONS, 'partner_accepted_at'),
  };
  if (!reg.email || !reg.status || !reg.invited || !reg.accepted) {
    await knex.schema.alterTable(REGISTRATIONS, (table) => {
      if (!reg.email) table.string('partner_invite_email', 255).nullable();
      if (!reg.status) {
        table.enum('partner_invite_status', ['none', 'pending', 'accepted', 'declined']).notNullable().defaultTo('none');
      }
      if (!reg.invited) table.datetime('partner_invited_at').nullable();
      if (!reg.accepted) table.datetime('partner_accepted_at').nullable();
      if (!reg.email) table.index(['event_id', 'partner_invite_email', 'partner_invite_status'], INVITE_INDEX);
    });
  }

  const prof = {
    lat: await knex.schema.hasColumn(PROFILES, 'latitude'),
    lng: await knex.schema.hasColumn(PROFILES, 'longitude'),
    nearby: await knex.schema.hasColumn(PROFILES, 'notify_nearby_events'),
    radius: await knex.schema.hasColumn(PROFILES, 'notify_radius_km'),
  };
  if (!prof.lat || !prof.lng || !prof.nearby || !prof.radius) {
    await knex.schema.alterTable(PROFILES, (table) => {
      if (!prof.lat) table.decimal('latitude', 7, 2).nullable();
      if (!prof.lng) table.decimal('longitude', 7, 2).nullable();
      if (!prof.nearby) table.boolean('notify_nearby_events').notNullable().defaultTo(false);
      if (!prof.radius) table.integer('notify_radius_km').notNullable().defaultTo(50);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn(REGISTRATIONS, 'partner_invite_email')) {
    await knex.schema.alterTable(REGISTRATIONS, (table) => {
      table.dropIndex(['event_id', 'partner_invite_email', 'partner_invite_status'], INVITE_INDEX);
    });
  }
  for (const column of ['partner_accepted_at', 'partner_invited_at', 'partner_invite_status', 'partner_invite_email']) {
    if (await knex.schema.hasColumn(REGISTRATIONS, column)) {
      await knex.schema.alterTable(REGISTRATIONS, (table) => table.dropColumn(column));
    }
  }
  for (const column of ['notify_radius_km', 'notify_nearby_events', 'longitude', 'latitude']) {
    if (await knex.schema.hasColumn(PROFILES, column)) {
      await knex.schema.alterTable(PROFILES, (table) => table.dropColumn(column));
    }
  }
}
