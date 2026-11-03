import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { VenueController } from '../controllers/venueController';
import { CourtAvailabilityService } from '../services/courtAvailabilityService';
import { authenticate, optionalAuth, adminOnly } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { hallFinderLimiter } from '../middleware/rateLimiter';
import { HallFinderService, MAX_RADIUS_KM } from '../services/hallFinderService';
import { AppError } from '../middleware/errorHandler';
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

// All padel venues around a point or a place name (OpenStreetMap + Tourneo partners).
// Must stay above '/:id'.
router.get('/discover', hallFinderLimiter, optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const radius = Math.min(Math.max(Number(req.query.radius_km) || 25, 1), MAX_RADIUS_KM);
    const players = Math.min(Math.max(Math.round(Number(req.query.players) || 4), 1), 64);
    let lat = Number(req.query.lat);
    let lng = Number(req.query.lng);
    let label: string | null = null;
    if (typeof req.query.place === 'string' && req.query.place.trim()) {
      const hit = await HallFinderService.geocode(req.query.place);
      if (!hit) throw AppError.notFound('Ort');
      ({ lat, lng, label } = hit);
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw AppError.badRequest('Standort oder Ort angeben');
    }
    const result = await HallFinderService.search(lat, lng, radius, players);
    res.json({ success: true, data: { ...result, place: label } });
  } catch (error) {
    next(error);
  }
});
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