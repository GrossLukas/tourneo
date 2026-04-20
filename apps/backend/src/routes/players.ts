import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { PlayerDiscoveryService } from '../services/playerDiscoveryService';

const router = Router();

/**
 * GET /api/v2/players/search
 * Query: sport, elo_min, elo_max, city, lat, lng, radius_km, limit
 */
router.get(
  '/search',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sport = (req.query.sport as string) === 'fifa' ? 'fifa' : 'padel';
      const toNum = (v: unknown) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const players = await PlayerDiscoveryService.search({
        sport,
        eloMin: toNum(req.query.elo_min),
        eloMax: toNum(req.query.elo_max),
        city: typeof req.query.city === 'string' ? req.query.city : undefined,
        lat: toNum(req.query.lat),
        lng: toNum(req.query.lng),
        radiusKm: toNum(req.query.radius_km),
        excludeUserId: req.user!.userId,
        limit: toNum(req.query.limit),
      });

      // Bump last_active for the searcher
      PlayerDiscoveryService.bumpLastActive(req.user!.userId).catch(() => {});

      res.json({ success: true, data: players });
    } catch (error) {
      next(error);
    }
  },
);

export { router as playersRouter };
