import { Router } from 'express';
import { VenueController } from '../controllers/venueController';
import { authenticate, optionalAuth, adminOnly } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createVenueSchema, updateVenueSchema } from '../validators/users';

const router = Router();

router.get('/', optionalAuth, VenueController.list);
router.get('/:id', optionalAuth, VenueController.getById);

// Admin
router.post('/', authenticate, adminOnly, validateBody(createVenueSchema), VenueController.create);
router.put(
  '/:id',
  authenticate,
  adminOnly,
  validateBody(updateVenueSchema),
  VenueController.update
);

export { router as venueRouter };