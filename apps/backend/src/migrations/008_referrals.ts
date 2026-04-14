import { Knex } from 'knex';

const PREFIX = 'tourneo_';
const t = (name: string) => `${PREFIX}${name}`;

/**
 * Migration 008 — Referral codes. Each user gets a permanent referral code.
 * When a new user signs up with a code, a referral row is created and the
 * referrer is rewarded (1 month Plus) on first successful payment.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(t('users'), (table) => {
    table.string('referral_code', 20).nullable();
    table.index(['referral_code']);
  });

  await knex.schema.createTable(t('referrals'), (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('referrer_user_id').unsigned().notNullable()
      .references('id').inTable(t('users')).onDelete('CASCADE');
    table.bigInteger('referred_user_id').unsigned().notNullable()
      .references('id').inTable(t('users')).onDelete('CASCADE');
    table.string('referral_code', 20).notNullable();
    table.boolean('reward_granted').defaultTo(false);
    table.datetime('reward_granted_at').nullable();
    table.datetime('created_at').notNullable();

    table.unique(['referred_user_id']);
    table.index(['referrer_user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(t('referrals'));
  await knex.schema.alterTable(t('users'), (table) => {
    table.dropIndex(['referral_code']);
    table.dropColumn('referral_code');
  });
}
