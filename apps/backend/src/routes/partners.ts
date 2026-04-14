import { Router } from 'express';
import { PartnerController } from '../controllers/partnerController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createPartnerRequestSchema } from '../validators/partners';

const router = Router();

// Mounted at root so paths read like the spec
router.get('/events/:eventId/partners', authenticate, PartnerController.list);
router.post(
  '/events/:eventId/partners',
  authenticate,
  validateBody(createPartnerRequestSchema),
  PartnerController.create
);
router.delete('/partners/:id', authenticate, PartnerController.delete);
router.post('/partners/:id/contact', authenticate, PartnerController.contact);

export { router as partnerRouter };
