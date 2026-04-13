import { Router } from 'express';
import { SupportController } from '../controllers/supportController';
import { authenticate, adminOnly } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createSupportTicketSchema, ticketReplySchema } from '../validators/users';

const router = Router();

router.post('/tickets', authenticate, validateBody(createSupportTicketSchema), SupportController.createTicket);
router.get('/tickets', authenticate, SupportController.listUserTickets);
router.get('/tickets/:id', authenticate, SupportController.getTicket);
router.post('/tickets/:id/reply', authenticate, validateBody(ticketReplySchema), SupportController.replyToTicket);

// Admin
router.get('/admin/tickets', authenticate, adminOnly, SupportController.listAllTickets);
router.put('/admin/tickets/:id', authenticate, adminOnly, SupportController.updateTicketStatus);
router.post('/admin/tickets/:id/reply', authenticate, adminOnly, validateBody(ticketReplySchema), SupportController.replyToTicket);

export { router as supportRouter };