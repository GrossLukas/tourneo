import { Request, Response, NextFunction } from 'express';
import { db, t } from '../config/database';
import { AppError } from './errorHandler';
import { canOrganizeEvent, isAdminRole } from '../services/eventAccess';

/**
 * Admins pass as before; everybody else only for the tournaments among
 * friends they created (see canOrganizeEvent).
 * The event comes from the route's :id, or – for `match` – from the match in
 * :matchId (or :id). Runs after `authenticate`.
 */
export function requireEventOrganizer(from: 'event' | 'match' = 'event') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      if (isAdminRole(req.user.role)) return next();

      let eventId = parseInt(req.params.id, 10);
      if (from === 'match') {
        const matchId = parseInt(req.params.matchId ?? req.params.id, 10);
        const match = Number.isFinite(matchId)
          ? await db(t('matches')).where('id', matchId).first('event_id')
          : undefined;
        if (!match) throw AppError.notFound('Match');
        eventId = Number(match.event_id);
      }

      const event = Number.isFinite(eventId)
        ? await db(t('events')).where('id', eventId).first('id', 'created_by', 'is_community')
        : undefined;
      if (!event) throw AppError.notFound('Event');
      if (!canOrganizeEvent(req.user, event)) {
        throw AppError.forbidden('Nur die Person, die das Turnier angelegt hat, kann das tun.');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
