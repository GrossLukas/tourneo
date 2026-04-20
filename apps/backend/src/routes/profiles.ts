import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { PlayerProfileService } from '../services/playerProfileService';
import { RatingHistoryService } from '../services/ratingHistoryService';

const router = Router();

/**
 * GET /api/v2/profiles/:id
 * Public player profile with ELO, stats, achievements.
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetId = Number(req.params.id);
      if (!Number.isFinite(targetId) || targetId <= 0) {
        res.status(400).json({ success: false, error: 'Invalid user id' });
        return;
      }
      const profile = await PlayerProfileService.getPublicProfile(req.user!.userId, targetId);
      if (!profile) {
        res.status(404).json({ success: false, error: 'Profile not found' });
        return;
      }
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v2/profiles/:id/head-to-head
 * Head-to-head stats viewer vs target.
 */
router.get(
  '/:id/head-to-head',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetId = Number(req.params.id);
      if (!Number.isFinite(targetId) || targetId <= 0) {
        res.status(400).json({ success: false, error: 'Invalid user id' });
        return;
      }
      const h2h = await PlayerProfileService.getHeadToHead(req.user!.userId, targetId);
      if (!h2h) {
        res.status(404).json({ success: false, error: 'Not available' });
        return;
      }
      res.json({ success: true, data: h2h });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v2/profiles/:id/elo-history?sport=padel&limit=30
 */
router.get(
  '/:id/elo-history',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetId = Number(req.params.id);
      if (!Number.isFinite(targetId) || targetId <= 0) {
        res.status(400).json({ success: false, error: 'Invalid user id' });
        return;
      }
      const sport = (req.query.sport as string) === 'fifa' ? 'fifa' : 'padel';
      const limitRaw = Number(req.query.limit);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 30;

      // Only return if target opted-in (discoverable) or is viewer themself
      const profile = await PlayerProfileService.getPublicProfile(req.user!.userId, targetId);
      if (!profile || (!profile.discoverable && req.user!.userId !== targetId)) {
        res.json({ success: true, data: [] });
        return;
      }

      const history = await RatingHistoryService.listForUser(targetId, sport, limit);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },
);

export { router as profilesRouter };
