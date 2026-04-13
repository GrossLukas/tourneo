import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/eventService';
import { eventFiltersSchema } from '../validators/events';

export class EventController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.createEvent(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const event = await EventService.getEventById(eventId);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = eventFiltersSchema.parse(req.query);
      const result = await EventService.listEvents(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const event = await EventService.publishEvent(eventId, req.user!.userId);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const event = await EventService.cancelEvent(eventId, req.user!.userId);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.id, 10);
      // Partial update logic
      const { db: database, t } = require('../config/database');
      const now = new Date();
      await database(t('events')).where('id', eventId).update({
        ...req.body,
        updated_at: now,
      });
      const event = await EventService.getEventById(eventId);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }
}