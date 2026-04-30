import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { authenticate, optionalAuth, adminOnly } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createEventSchema, updateEventSchema } from '../validators/events';

const router = Router();

router.get('/', optionalAuth, EventController.list);
router.get('/:id', optionalAuth, EventController.getById);
router.get('/:id/recap', optionalAuth, EventController.getRecap);
router.get('/:id/ical', optionalAuth, EventController.getIcal);
router.get('/:id/schedule', optionalAuth, EventController.getSchedule);

// Admin routes
router.post('/', authenticate, adminOnly, validateBody(createEventSchema), EventController.create);
router.put('/:id', authenticate, adminOnly, validateBody(updateEventSchema), EventController.update);
router.put('/:id/publish', authenticate, adminOnly, EventController.publish);
router.put('/:id/cancel', authenticate, adminOnly, EventController.cancel);

export { router as eventRouter };
