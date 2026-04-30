import { db, t } from '../config/database';
import { EloService } from './eloService';
import { PlaytomicFileService } from './playtomicFileService';
import { PlaytomicOcrService, PlaytomicOcrResult } from './playtomicOcrService';

/**
 * PlaytomicService — Maps Playtomic skill levels (0–7) to our ELO system,
 * manages self-declared levels, screenshot verification, and admin review.
 *
 * Mapping philosophy:
 *   - Playtomic uses a 0–7 scale (granular in 0.1 steps).
 *   - We map to an ELO seed using linear interpolation anchored at key points.
 *   - Self-declared levels get `initial_rating_source = 'playtomic_self'` and
 *     a slightly lower seed (–50) to account for potential inflation.
 *   - Admin-verified levels get `initial_rating_source = 'playtomic_verified'`
 *     and the full mapped seed.
 */
export class PlaytomicService {
  /**
   * Anchor points for Playtomic level → ELO mapping.
   * Based on community consensus that Playtomic 3.0 ≈ solid intermediate.
   */
  private static readonly ANCHORS: Array<[number, number]> = [
    [0.0, 700],
    [1.0, 850],
    [2.0, 950],
    [3.0, 1050],
    [4.0, 1150],
    [5.0, 1280],
    [6.0, 1400],
    [7.0, 1550],
  ];

  /**
   * Converts a Playtomic level (0–7) to an ELO seed via linear interpolation.
   */
  static levelToElo(level: number): number {
    const clamped = Math.max(0, Math.min(7, level));
    for (let i = 0; i < this.ANCHORS.length - 1; i++) {
      const [l1, e1] = this.ANCHORS[i];
      const [l2, e2] = this.ANCHORS[i + 1];
      if (clamped >= l1 && clamped <= l2) {
        const ratio = (clamped - l1) / (l2 - l1);
        return Math.round(e1 + ratio * (e2 - e1));
      }
    }
    return EloService.DEFAULT_ELO;
  }

  /**
   * User self-declares their Playtomic level. This sets a "pending" verification
   * and applies a cautious seed (-50) until admin verifies via screenshot.
   */
  static async declareLevel(
    userId: number,
    level: number,
  ): Promise<{ seedElo: number; status: string }> {
    if (level < 0 || level > 7) {
      throw new Error('Playtomic level must be between 0 and 7');
    }

    const profile = await db(t('profiles')).where('user_id', userId).first();
    if (!profile) throw new Error('Profile not found');

    // Already verified – don't overwrite
    if (profile.playtomic_verification_status === 'approved') {
      return {
        seedElo: profile.elo_padel ?? EloService.DEFAULT_ELO,
        status: 'approved',
      };
    }

    const baseSeed = this.levelToElo(level);
    const seedElo = Math.max(700, baseSeed - 50); // cautious self-declared seed

    const now = new Date();
    await db(t('profiles')).where('user_id', userId).update({
      playtomic_level: level,
      playtomic_verification_status: 'pending',
      initial_rating_source: 'playtomic_self',
      elo_padel: seedElo,
      elo_padel_peak: seedElo,
      updated_at: now,
    });

    return { seedElo, status: 'pending' };
  }

  /**
   * User uploads a screenshot URL for verification.
   */
  static async submitScreenshot(
    userId: number,
    screenshotUrl: string,
    imageBuffer?: Buffer,
  ): Promise<PlaytomicOcrResult | null> {
    await db(t('profiles')).where('user_id', userId).update({
      playtomic_screenshot_url: screenshotUrl,
      playtomic_verification_status: 'pending',
      playtomic_ocr_status: imageBuffer ? 'pending' : null,
      updated_at: new Date(),
    });

    if (!imageBuffer) return null;

    try {
      return await PlaytomicOcrService.analyzeAndPersist(userId, imageBuffer);
    } catch (err) {
      console.warn('[playtomic] OCR analysis failed:', (err as any)?.message || err);
      await db(t('profiles')).where('user_id', userId).update({
        playtomic_ocr_status: 'failed',
        updated_at: new Date(),
      });
      return null;
    }
  }

  /**
   * Admin approves a Playtomic level. Applies the full mapped ELO and marks
   * the user as verified.
   */
  static async approve(
    userId: number,
    adminUserId: number,
    verifiedLevel?: number,
  ): Promise<{ elo: number }> {
    const profile = await db(t('profiles')).where('user_id', userId).first();
    if (!profile) throw new Error('Profile not found');

    const level = verifiedLevel ?? profile.playtomic_level;
    if (level == null) throw new Error('No Playtomic level to verify');

    const elo = this.levelToElo(level);
    const now = new Date();

    await PlaytomicFileService.purgeForUser(userId);

    await db(t('profiles')).where('user_id', userId).update({
      playtomic_level: level,
      playtomic_verification_status: 'approved',
      playtomic_screenshot_url: null,
      playtomic_verified_at: now,
      playtomic_verified_by: adminUserId,
      initial_rating_source: 'playtomic_verified',
      // Only adjust ELO if user hasn't played matches yet
      ...(profile.elo_matches_played === 0
        ? { elo_padel: elo, elo_padel_peak: elo }
        : {}),
      updated_at: now,
    });

    return { elo };
  }

  /**
   * Admin rejects a Playtomic level submission.
   */
  static async reject(
    userId: number,
    adminUserId: number,
  ): Promise<void> {
    const now = new Date();
    await PlaytomicFileService.purgeForUser(userId);
    await db(t('profiles')).where('user_id', userId).update({
      playtomic_verification_status: 'rejected',
      playtomic_screenshot_url: null,
      playtomic_verified_at: now,
      playtomic_verified_by: adminUserId,
      updated_at: now,
    });
  }

  /**
   * Returns the list of pending verifications for admin review.
   */
  static async listPending(): Promise<any[]> {
    return db(t('profiles'))
      .leftJoin(t('users'), `${t('profiles')}.user_id`, `${t('users')}.id`)
      .where(`${t('profiles')}.playtomic_verification_status`, 'pending')
      .whereNotNull(`${t('profiles')}.playtomic_screenshot_url`)
      .select(
        `${t('profiles')}.user_id`,
        `${t('profiles')}.first_name`,
        `${t('profiles')}.last_name`,
        `${t('profiles')}.display_name`,
        `${t('profiles')}.playtomic_level`,
        `${t('profiles')}.playtomic_screenshot_url`,
        `${t('profiles')}.playtomic_ocr_status`,
        `${t('profiles')}.playtomic_ocr_level`,
        `${t('profiles')}.playtomic_ocr_name`,
        `${t('profiles')}.playtomic_ocr_points`,
        `${t('profiles')}.playtomic_duplicate_user_id`,
        `${t('profiles')}.playtomic_duplicate_warning_at`,
        `${t('users')}.email`,
        `${t('profiles')}.updated_at as submitted_at`,
      )
      .orderBy(`${t('profiles')}.updated_at`, 'asc');
  }

  /**
   * Returns the current verification state for a user.
   */
  static async getStatus(userId: number): Promise<{
    level: number | null;
    status: string;
    source: string;
    screenshotUrl: string | null;
    ocr: {
      status: string | null;
      level: number | null;
      name: string | null;
      points: number | null;
      duplicateUserId: number | null;
    };
  }> {
    const profile = await db(t('profiles')).where('user_id', userId).first();
    return {
      level: profile?.playtomic_level ?? null,
      status: profile?.playtomic_verification_status ?? 'none',
      source: profile?.initial_rating_source ?? 'default',
      screenshotUrl: profile?.playtomic_screenshot_url ?? null,
      ocr: {
        status: profile?.playtomic_ocr_status ?? null,
        level: profile?.playtomic_ocr_level == null ? null : Number(profile.playtomic_ocr_level),
        name: profile?.playtomic_ocr_name ?? null,
        points: profile?.playtomic_ocr_points ?? null,
        duplicateUserId: profile?.playtomic_duplicate_user_id ?? null,
      },
    };
  }
}
