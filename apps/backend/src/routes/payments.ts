import { Router, raw } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate, adminOnly } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/create-intent', authenticate, paymentLimiter, PaymentController.createIntent);
router.get('/', authenticate, PaymentController.listUserPayments);
router.post('/webhook', raw({ type: 'application/json' }), PaymentController.webhook);

// Admin
router.get('/admin/stats', authenticate, adminOnly, PaymentController.getAdminStats);
router.post('/admin/refunds/:id/process', authenticate, adminOnly, PaymentController.processRefund);

export { router as paymentRouter };