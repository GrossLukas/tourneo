import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { VenueController } from '../controllers/venueController';
import { CourtAvailabilityService } from '../services/courtAvailabilityService';
import { authenticate, optionalAuth, adminOnly } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createVenueSchema, updateVenueSchema } from '../validators/users';

const router = Router();

// 5MB memory upload, JPEG/PNG/WebP only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, or WebP images are accepted'));
  },
});

router.get('/', optionalAuth, VenueController.list);
router.get('/:id', optionalAuth, VenueController.getById);

// Reviews
router.get('/:id/reviews', optionalAuth, VenueController.listReviews);
router.post('/:id/reviews', authenticate, VenueController.createReview);

// Photos
router.get('/:id/photos', optionalAuth, VenueController.listPhotos);
router.post('/:id/photos', authenticate, upload.single('image'), VenueController.uploadPhoto);

// Admin
router.post('/', authenticate, adminOnly, validateBody(createVenueSchema), VenueController.create);
router.put(
  '/:id',
  authenticate,
  adminOnly,
  validateBody(updateVenueSchema),
  VenueController.update
);

// Court availability (public GET)
router.get(
  '/:id/availability',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const venueId = parseInt(req.params.id, 10);
      const slots = await CourtAvailabilityService.listForVenue(venueId, {
        fromDate: req.query.from as string,
        toDate: req.query.to as string,
        courtId: req.query.court_id ? parseInt(req.query.court_id as string, 10) : undefined,
        statusFilter: req.query.status as any,
      });
      res.json({ success: true, data: slots });
    } catch (error) {
      next(error);
    }
  }
);

export { router as venueRouter };