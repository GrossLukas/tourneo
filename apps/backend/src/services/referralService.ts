import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * ReferralService — manages referral codes and rewards.
 *
 * Each user has a permanent referral_code (generated on first request).
 * A new user can sign up with a referral code; we record the referral row.
 * After the referred user makes their first successful payment, the
 * referrer is granted 1 month of Plus membership.
 */
export class ReferralService {
  /**
   * Returns the user's referral code, generating one if needed.
   */
  static async getOrCreateCode(userId: number): Promise<string> {
    const user = await db(t('users')).where('id', userId).first();
    if (!user) throw AppError.notFound('User');
    if (user.referral_code) return user.referral_code;

    const code = this.generateCode(userId);
    await db(t('users')).where('id', userId).update({ referral_code: code });
    return code;
  }

  /**
   * Looks up the user that owns a given code.
   */
  static async findReferrerByCode(code: string): Promise<number | null> {
    const cleaned = (code || '').trim().toUpperCase();
    if (!cleaned) return null;
    const user = await db(t('users')).where('referral_code', cleaned).first();
    return user?.id ?? null;
  }

  /**
   * Records a referral relationship at sign-up time.
   * Idempotent — does nothing if the referred user is already linked.
   */
  static async recordReferral(referredUserId: number, code: string): Promise<void> {
    const referrerId = await this.findReferrerByCode(code);
    if (!referrerId) return;
    if (referrerId === referredUserId) return;

    const existing = await db(t('referrals')).where('referred_user_id', referredUserId).first();
    if (existing) return;

    await db(t('referrals')).insert({
      referrer_user_id: referrerId,
      referred_user_id: referredUserId,
      referral_code: code.trim().toUpperCase(),
      reward_granted: false,
      created_at: new Date(),
    });
  }

  /**
   * Grants 1 month of Plus to the referrer after the referred user's
   * first successful payment. Idempotent.
   */
  static async grantRewardForReferredUser(referredUserId: number): Promise<void> {
    const ref = await db(t('referrals'))
      .where({ referred_user_id: referredUserId, reward_granted: false })
      .first();
    if (!ref) return;

    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    // Extend (or create) Plus membership for referrer
    const existingMembership = await db(t('memberships'))
      .where('user_id', ref.referrer_user_id)
      .where('status', 'active')
      .first();

    if (existingMembership) {
      // Extend expiry by 1 month from current expiry (or from now if expired)
      const baseExpiry = existingMembership.expires_at && new Date(existingMembership.expires_at) > now
        ? new Date(existingMembership.expires_at)
        : now;
      const newExpiry = new Date(baseExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + 1);
      const newTier = existingMembership.tier === 'free' ? 'plus' : existingMembership.tier;
      await db(t('memberships'))
        .where('id', existingMembership.id)
        .update({ tier: newTier, expires_at: newExpiry, updated_at: now });
    } else {
      await db(t('memberships')).insert({
        user_id: ref.referrer_user_id,
        tier: 'plus',
        status: 'active',
        started_at: now,
        expires_at: oneMonthLater,
        created_at: now,
        updated_at: now,
      });
    }

    await db(t('referrals'))
      .where('id', ref.id)
      .update({ reward_granted: true, reward_granted_at: now });
  }

  /**
   * Stats for the profile screen.
   */
  static async getStats(userId: number): Promise<{ total: number; rewarded: number; code: string }> {
    const code = await this.getOrCreateCode(userId);
    const refs = await db(t('referrals')).where('referrer_user_id', userId);
    return {
      total: refs.length,
      rewarded: refs.filter((r) => r.reward_granted).length,
      code,
    };
  }

  /**
   * Generates a short alphanumeric code unique to a user id.
   */
  private static generateCode(userId: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `T${userId.toString(36).toUpperCase()}${suffix}`;
  }
}
