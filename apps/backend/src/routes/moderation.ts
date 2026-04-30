import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, adminOnly } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { ModerationService } from '../services/moderationService';

const router = Router();

const reportSchema = z.object({
  target_type: z.enum(['profile', 'chat_message', 'venue_review', 'venue_photo', 'event', 'other']),
  target_id: z.number().int().positive().optional(),
  target_user_id: z.number().int().positive().optional(),
  reason: z.enum(['spam', 'abuse', 'harassment', 'inappropriate', 'privacy', 'fraud', 'other']),
  detail: z.string().max(2000).optional(),
});

const reviewSchema = z.object({
  status: z.enum(['reviewed', 'dismissed', 'actioned']),
  action_taken: z.string().max(2000).optional(),
});

const hideSchema = z.object({
  target_type: z.enum(['chat_message', 'venue_review', 'venue_photo']),
  target_id: z.number().int().positive(),
  note: z.string().max(2000).optional(),
});

router.post(
  '/reports',
  authenticate,
  validateBody(reportSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ModerationService.report(req.body, req.user!.userId);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/blocks',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ModerationService.listBlockedUsers(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/blocks/:userId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blockedUserId = parseInt(req.params.userId, 10);
      const data = await ModerationService.blockUser(req.user!.userId, blockedUserId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/blocks/:userId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blockedUserId = parseInt(req.params.userId, 10);
      const data = await ModerationService.unblockUser(req.user!.userId, blockedUserId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/admin/reports',
  authenticate,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ModerationService.listReports(req.query.status as string | undefined);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/admin/reports/:id',
  authenticate,
  adminOnly,
  validateBody(reviewSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = parseInt(req.params.id, 10);
      const data = await ModerationService.reviewReport(
        reportId,
        req.user!.userId,
        req.body.status,
        req.body.action_taken
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/admin/hide',
  authenticate,
  adminOnly,
  validateBody(hideSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await ModerationService.hideTarget(
        req.body.target_type,
        req.body.target_id,
        req.user!.userId,
        req.body.note
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

export { router as moderationRouter };
