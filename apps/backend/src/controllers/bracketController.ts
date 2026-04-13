import { Request, Response, NextFunction } from 'express';
import { BracketService } from '../services/bracketService';

export class BracketController {
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const bracket = await BracketService.generateBracket(eventId, req.user!.userId);
      res.status(201).json({ success: true, data: bracket });
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const bracket = await BracketService.getBracket(eventId);
      res.json({ success: true, data: bracket });
    } catch (error) {
      next(error);
    }
  }

  static async enterResult(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = parseInt(req.params.id, 10);
      const { scores, winner_registration_id } = req.body;
      const bracket = await BracketService.enterMatchResult(
        matchId,
        scores,
        winner_registration_id,
        req.user!.userId
      );
      res.json({ success: true, data: bracket });
    } catch (error) {
      next(error);
    }
  }

  static async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const { db, t } = require('../config/database');
      const eventId = parseInt(req.params.id, 10);
      const now = new Date();

      await db(t('brackets')).where('event_id', eventId).update({
        status: 'published',
        published_at: now,
        updated_at: now,
      });

      const bracket = await BracketService.getBracket(eventId);
      res.json({ success: true, data: bracket });
    } catch (error) {
      next(error);
    }
  }
}