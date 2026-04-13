import { Router } from 'express';
import { LegalController } from '../controllers/legalController';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

router.get('/:type', LegalController.getActiveDocument);
router.get('/:type/versions', LegalController.listVersions);

// Admin
router.post('/', authenticate, adminOnly, LegalController.createVersion);

export { router as legalRouter };