import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate, adminOnly } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { notificationSettingsSchema } from '../validators/users';

const router = Router();

router.get('/', authenticate, NotificationController.list);
router.put('/:id/read', authenticate, NotificationController.markRead);
router.put('/read-all', authenticate, NotificationController.markAllRead);
router.post(
  '/push-token',
  authenticate,
  validateBody(notificationSettingsSchema),
  NotificationController.registerPushToken
);
router.delete(
  '/push-token',
  authenticate,
  validateBody(notificationSettingsSchema),
  NotificationController.unregisterPushToken
);

// Admin
router.post('/admin/send', authenticate, adminOnly, NotificationController.adminSend);

export { router as notificationRouter };