import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class SupportController {
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const [ticketId] = await db(t('support_tickets')).insert({
        uuid: uuidv4(),
        user_id: req.user!.userId,
        event_id: req.body.event_id || null,
        category: req.body.category,
        subject: req.body.subject,
        message: req.body.message,
        status: 'open',
        priority: 'medium',
        created_at: now,
        updated_at: now,
      });

      const ticket = await db(t('support_tickets')).where('id', ticketId).first();
      res.status(201).json({ success: true, data: ticket });
    } catch (error) {
      next(error);
    }
  }

  static async listUserTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const tickets = await db(t('support_tickets'))
        .where('user_id', req.user!.userId)
        .orderBy('created_at', 'desc');
      res.json({ success: true, data: tickets });
    } catch (error) {
      next(error);
    }
  }

  static async getTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const ticket = await db(t('support_tickets')).where('id', ticketId).first();
      if (!ticket) throw AppError.notFound('Support ticket');

      // Only allow owner or admin to view
      if (ticket.user_id !== req.user!.userId && !['admin', 'superadmin'].includes(req.user!.role)) {
        throw AppError.forbidden();
      }

      const messages = await db(t('support_ticket_messages'))
        .where('ticket_id', ticketId)
        .leftJoin(t('profiles'), `${t('support_ticket_messages')}.sender_id`, `${t('profiles')}.user_id`)
        .select(
          `${t('support_ticket_messages')}.*`,
          `${t('profiles')}.first_name`,
          `${t('profiles')}.last_name`
        )
        .orderBy('created_at', 'asc');

      res.json({ success: true, data: { ...ticket, messages } });
    } catch (error) {
      next(error);
    }
  }

  static async replyToTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const ticket = await db(t('support_tickets')).where('id', ticketId).first();
      if (!ticket) throw AppError.notFound('Support ticket');

      const isAdmin = ['admin', 'superadmin'].includes(req.user!.role);
      if (ticket.user_id !== req.user!.userId && !isAdmin) {
        throw AppError.forbidden();
      }

      await db(t('support_ticket_messages')).insert({
        ticket_id: ticketId,
        sender_id: req.user!.userId,
        message: req.body.message,
        is_admin_reply: isAdmin,
        created_at: new Date(),
      });

      if (isAdmin && ticket.status === 'open') {
        await db(t('support_tickets')).where('id', ticketId).update({
          status: 'in_progress',
          assigned_to: req.user!.userId,
          updated_at: new Date(),
        });
      }

      res.status(201).json({ success: true, data: { message: 'Reply sent' } });
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoints
  static async listAllTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority, page = 1, per_page = 20 } = req.query;
      let query = db(t('support_tickets'))
        .leftJoin(t('profiles'), `${t('support_tickets')}.user_id`, `${t('profiles')}.user_id`)
        .select(
          `${t('support_tickets')}.*`,
          `${t('profiles')}.first_name`,
          `${t('profiles')}.last_name`,
          `${t('profiles')}.email`
        );

      if (status) query = query.where(`${t('support_tickets')}.status`, status as string);
      if (priority) query = query.where(`${t('support_tickets')}.priority`, priority as string);

      const countQuery = query.clone();
      const [{ count: total }] = await countQuery.count('* as count');
      const offset = (Number(page) - 1) * Number(per_page);
      const tickets = await query
        .orderBy('created_at', 'desc')
        .limit(Number(per_page))
        .offset(offset);

      res.json({
        success: true,
        data: tickets,
        meta: {
          page: Number(page),
          per_page: Number(per_page),
          total: Number(total),
          total_pages: Math.ceil(Number(total) / Number(per_page)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTicketStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const { status, priority } = req.body;
      const updates: any = { updated_at: new Date() };
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (status === 'resolved') updates.resolved_at = new Date();

      await db(t('support_tickets')).where('id', ticketId).update(updates);
      const ticket = await db(t('support_tickets')).where('id', ticketId).first();
      res.json({ success: true, data: ticket });
    } catch (error) {
      next(error);
    }
  }
}