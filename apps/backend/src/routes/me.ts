import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { ReferralService } from '../services/referralService';
import { AchievementService } from '../services/achievementService';
import { BracketService } from '../services/bracketService';
import { EloService } from '../services/eloService';
import { db, t } from '../config/database';

const router = Router();

// Referral
router.get(
  '/referral',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await ReferralService.getStats(req.user!.userId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/referral/code',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = await ReferralService.getOrCreateCode(req.user!.userId);
      res.json({ success: true, data: { code } });
    } catch (error) {
      next(error);
    }
  }
);

// Achievements
router.get(
  '/achievements',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await AchievementService.list(req.user!.userId);
      res.json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  }
);

// Next match
router.get(
  '/next-match',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const match = await BracketService.getNextMatchForUser(req.user!.userId);
      res.json({ success: true, data: match });
    } catch (error) {
      next(error);
    }
  }
);

// ELO summary (current rating, peak, tier)
router.get(
  '/elo',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await db(t('profiles'))
        .where('user_id', req.user!.userId)
        .first();
      const padel = Number(profile?.elo_padel ?? 1000);
      const fifa = Number(profile?.elo_fifa ?? 1000);
      res.json({
        success: true,
        data: {
          padel: {
            elo: padel,
            peak: Number(profile?.elo_padel_peak ?? 1000),
            tier: EloService.getTier(padel),
          },
          fifa: {
            elo: fifa,
            peak: Number(profile?.elo_fifa_peak ?? 1000),
            tier: EloService.getTier(fifa),
          },
          matches_played: Number(profile?.elo_matches_played ?? 0),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as meRouter };
