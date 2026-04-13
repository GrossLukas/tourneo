import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, NotificationController.list);
router.put('/:id/read', authenticate, NotificationController.markRead);
router.put('/read-all', authenticate, NotificationController.markAllRead);
router.post('/push-token', authenticate, NotificationController.registerPushToken);
router.delete('/push-token', authenticate, NotificationController.unregisterPushToken);

// Admin
router.post('/admin/send', authenticate, adminOnly, NotificationController.adminSend);

export { router as notificationRouter };