import { Router } from 'express';
import multer from 'multer';
import { VenueController } from '../controllers/venueController';
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

export { router as venueRouter };