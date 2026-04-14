import { Request, Response, NextFunction } from 'express';
import { PartnerService } from '../services/partnerService';

export class PartnerController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const data = await PartnerService.listForEvent(eventId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const data = await PartnerService.create(eventId, req.user!.userId, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await PartnerService.delete(id, req.user!.userId);
      res.json({ success: true, data: { id } });
    } catch (error) {
      next(error);
    }
  }

  static async contact(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await PartnerService.contact(id, req.user!.userId);
      res.json({ success: true, data: { id, contacted: true } });
    } catch (error) {
      next(error);
    }
  }
}
