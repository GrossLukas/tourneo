import { Router } from 'express';
import { BracketController } from '../controllers/bracketController';
import { OrganizerController } from '../controllers/organizerController';
import { authenticate, adminOnly, optionalAuth } from '../middleware/auth';
import { requireEventOrganizer } from '../middleware/organizer';

const router = Router();

// Public
router.get('/events/:id/bracket', authenticate, BracketController.get);
router.get('/events/:id/standings', optionalAuth, BracketController.getStandings);

// Share-ready match card (players, score, sponsor, ELO delta)
router.get('/:matchId/card', optionalAuth, BracketController.getMatchCard);

// Player-facing match score entry (live scoring / referee mode)
router.post('/:matchId/score', authenticate, BracketController.enterScores);
router.get('/:matchId/score', authenticate, BracketController.getMatchScores);

// Next-match lookup for the home screen alert banner
router.get('/me/next', authenticate, BracketController.getNextMatch);

// Admins, or the player who created the tournament among friends
router.post('/events/:id/bracket/generate', authenticate, requireEventOrganizer(), BracketController.generate);
router.post(
  '/events/:id/bracket/round-robin',
  authenticate,
  requireEventOrganizer(),
  BracketController.generateRoundRobin
);
router.put('/events/:id/bracket/publish', authenticate, requireEventOrganizer(), BracketController.publish);
// Takes a wrong result back so it can be scored again (POST /:matchId/score)
router.put('/:id/reopen', authenticate, requireEventOrganizer('match'), OrganizerController.reopenMatch);

// Admin
router.put('/:id/result', authenticate, adminOnly, BracketController.enterResult);

export { router as bracketRouter };
