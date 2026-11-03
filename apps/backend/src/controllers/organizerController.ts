import { Request, Response, NextFunction } from 'express';
import { CommunityEventService } from '../services/communityEventService';
import { OrganizerService } from '../services/organizerService';
import { AuditService } from '../services/auditService';

const idOf = (value: string) => parseInt(value, 10);

/**
 * Tournaments among friends: creating them (any player) and running them
 * (admin or the creator – routes put requireEventOrganizer in front).
 */
export class OrganizerController {
  static async createCommunity(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await CommunityEventService.create(req.body, req.user!.userId);
      await AuditService.logFromRequest(req, 'event.community_created', 'event', event.id, {
        resourceLabel: event.title,
        metadata: { venue_kind: req.body.venue?.kind, max_participants: event.max_participants },
      });
      res.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CommunityEventService.listMine(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateCommunity(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = idOf(req.params.id);
      const event = await CommunityEventService.update(eventId, req.body);
      await AuditService.logFromRequest(req, 'event.community_updated', 'event', eventId, {
        metadata: { fields: Object.keys(req.body) },
      });
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async participants(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OrganizerService.listParticipants(idOf(req.params.id));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = idOf(req.params.id);
      const regId = idOf(req.params.regId);
      const data = await OrganizerService.checkIn(eventId, regId, req.user!.userId);
      await AuditService.logFromRequest(req, 'checkin.organizer', 'registration', regId, {
        metadata: { event_id: eventId },
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async undoCheckIn(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = idOf(req.params.id);
      const regId = idOf(req.params.regId);
      const data = await OrganizerService.undoCheckIn(eventId, regId);
      await AuditService.logFromRequest(req, 'checkin.undone', 'registration', regId, {
        metadata: { event_id: eventId },
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async removeParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = idOf(req.params.id);
      const regId = idOf(req.params.regId);
      const data = await OrganizerService.removeParticipant(eventId, regId);
      await AuditService.logFromRequest(req, 'participant.removed', 'registration', regId, {
        metadata: { event_id: eventId, by: 'organizer' },
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async reopenMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = idOf(req.params.id);
      const data = await OrganizerService.reopenMatch(matchId);
      await AuditService.logFromRequest(req, 'match.result_corrected', 'match', matchId, {
        metadata: { by: 'organizer' },
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
