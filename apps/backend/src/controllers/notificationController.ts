import { Request, Response, NextFunction } from 'express';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, per_page = 30 } = req.query;
      const offset = (Number(page) - 1) * Number(per_page);

      const notifications = await db(t('notifications'))
        .where('user_id', req.user!.userId)
        .orderBy('created_at', 'desc')
        .limit(Number(per_page))
        .offset(offset);

      const [{ count: unread }] = await db(t('notifications'))
        .where('user_id', req.user!.userId)
        .where('is_read', false)
        .count('* as count');

      res.json({
        success: true,
        data: notifications,
        meta: { unread_count: Number(unread) },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notificationId = parseInt(req.params.id, 10);
      await db(t('notifications'))
        .where('id', notificationId)
        .where('user_id', req.user!.userId)
        .update({ is_read: true, read_at: new Date() });

      res.json({ success: true, data: { message: 'Marked as read' } });
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await db(t('notifications'))
        .where('user_id', req.user!.userId)
        .where('is_read', false)
        .update({ is_read: true, read_at: new Date() });

      res.json({ success: true, data: { message: 'All marked as read' } });
    } catch (error) {
      next(error);
    }
  }

  static async registerPushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { push_token, platform } = req.body as { push_token: string; platform: 'ios' | 'android' };

      const existing = await db(t('push_tokens'))
        .where('user_id', req.user!.userId)
        .where('token', push_token)
        .first();

      if (existing) {
        await db(t('push_tokens')).where('id', existing.id).update({
          is_active: true,
          platform,
          updated_at: new Date(),
        });
      } else {
        await db(t('push_tokens')).insert({
          user_id: req.user!.userId,
          token: push_token,
          platform,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      res.json({ success: true, data: { message: 'Push token registered' } });
    } catch (error) {
      next(error);
    }
  }

  static async unregisterPushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { push_token } = req.body;
      await db(t('push_tokens'))
        .where('user_id', req.user!.userId)
        .where('token', push_token)
        .update({ is_active: false, updated_at: new Date() });

      res.json({ success: true, data: { message: 'Push token unregistered' } });
    } catch (error) {
      next(error);
    }
  }

  // Admin: send push notification
  static async adminSend(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_ids, title, body, data, type } = req.body;
      const now = new Date();

      const notifications = user_ids.map((userId: number) => ({
        user_id: userId,
        type: type || 'general',
        title,
        body,
        data: data ? JSON.stringify(data) : null,
        created_at: now,
      }));

      await db(t('notifications')).insert(notifications);

      // In production, this would trigger FCM push delivery
      res.json({ success: true, data: { message: `Notifications sent to ${user_ids.length} users` } });
    } catch (error) {
      next(error);
    }
  }
}