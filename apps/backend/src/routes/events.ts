import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { OrganizerController } from '../controllers/organizerController';
import { authenticate, optionalAuth, adminOnly } from '../middleware/auth';
import { requireEventOrganizer } from '../middleware/organizer';
import { communityEventLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';
import { createEventSchema, updateEventSchema } from '../validators/events';
import { createCommunityEventSchema, updateCommunityEventSchema } from '../validators/communityEvents';

const router = Router();

router.get('/', optionalAuth, EventController.list);

// Tournaments among friends: any signed-in player (must stay above '/:id')
router.get('/community/mine', authenticate, OrganizerController.listMine);
router.post(
  '/community',
  authenticate,
  communityEventLimiter,
  validateBody(createCommunityEventSchema),
  OrganizerController.createCommunity
);

router.get('/:id', optionalAuth, EventController.getById);
router.get('/:id/recap', optionalAuth, EventController.getRecap);
router.get('/:id/schedule', optionalAuth, EventController.getSchedule);
router.get('/:id/ical', optionalAuth, EventController.getIcal);

// Admin routes
router.post('/', authenticate, adminOnly, validateBody(createEventSchema), EventController.create);
router.put('/:id', authenticate, adminOnly, validateBody(updateEventSchema), EventController.update);
router.put('/:id/publish', authenticate, adminOnly, EventController.publish);

// Admins, or the player who created the tournament among friends
const organizer = [authenticate, requireEventOrganizer()];
router.put('/:id/cancel', ...organizer, EventController.cancel);
router.put('/:id/community', ...organizer, validateBody(updateCommunityEventSchema), OrganizerController.updateCommunity);
router.get('/:id/organizer/participants', ...organizer, OrganizerController.participants);
router.post('/:id/organizer/checkin/:regId', ...organizer, OrganizerController.checkIn);
router.delete('/:id/organizer/checkin/:regId', ...organizer, OrganizerController.undoCheckIn);
router.delete('/:id/organizer/participants/:regId', ...organizer, OrganizerController.removeParticipant);

export { router as eventRouter };
