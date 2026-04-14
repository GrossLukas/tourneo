import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatService';

export class ChatController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const data = await ChatService.listMessages(eventId, req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async post(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const { message } = req.body;
      const data = await ChatService.postMessage(eventId, req.user!.userId, message);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
