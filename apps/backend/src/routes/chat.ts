import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { postChatMessageSchema } from '../validators/chat';

const router = Router();

router.get('/events/:eventId/chat', authenticate, ChatController.list);
router.post(
  '/events/:eventId/chat',
  authenticate,
  validateBody(postChatMessageSchema),
  ChatController.post
);

export { router as chatRouter };
