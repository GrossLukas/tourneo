import { Router } from 'express';
import { BracketController } from '../controllers/bracketController';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

// Public
router.get('/events/:id/bracket', authenticate, BracketController.get);

// Admin
router.post('/events/:id/bracket/generate', authenticate, adminOnly, BracketController.generate);
router.put('/events/:id/bracket/publish', authenticate, adminOnly, BracketController.publish);
router.put('/:id/result', authenticate, adminOnly, BracketController.enterResult);

export { router as bracketRouter };