import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { NotificationService } from './notificationService';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'open';
export type PartnerStatus = 'open' | 'matched' | 'closed';

export interface PartnerRequestInput {
  message?: string;
  skill_level?: SkillLevel;
}

export interface PartnerRequestRow {
  id: number;
  uuid: string;
  event_id: number;
  user_id: number;
  message: string | null;
  skill_level: SkillLevel;
  status: PartnerStatus;
  matched_user_id: number | null;
  created_at: Date;
  updated_at: Date;
  // joined display
  display_name?: string;
  avatar_url?: string | null;
}

/**
 * PartnerService — handles partner search requests for doubles events.
 */
export class PartnerService {
  /**
   * List all open partner requests for an event, joined with profile info.
   */
  static async listForEvent(eventId: number): Promise<PartnerRequestRow[]> {
    return db(t('partner_requests') + ' as pr')
      .leftJoin(t('profiles') + ' as p', 'pr.user_id', 'p.user_id')
      .where('pr.event_id', eventId)
      .where('pr.status', 'open')
      .orderBy('pr.created_at', 'desc')
      .select(
        'pr.id',
        'pr.uuid',
        'pr.event_id',
        'pr.user_id',
        'pr.message',
        'pr.skill_level',
        'pr.status',
        'pr.matched_user_id',
        'pr.created_at',
        'pr.updated_at',
        'p.display_name',
        'p.avatar_url',
        'p.first_name',
        'p.last_name',
      );
  }

  /**
   * Create a partner request. One per user per event.
   */
  static async create(
    eventId: number,
    userId: number,
    input: PartnerRequestInput
  ): Promise<PartnerRequestRow> {
    const event = await db(t('events')).where('id', eventId).first();
    if (!event) throw AppError.notFound('Event');
    if (event.format !== 'doubles') {
      throw AppError.badRequest('Partner search is only available for doubles events');
    }

    const existing = await db(t('partner_requests'))
      .where({ event_id: eventId, user_id: userId })
      .first();
    if (existing) {
      throw AppError.conflict('You already have a partner request for this event');
    }

    const now = new Date();
    const [id] = await db(t('partner_requests')).insert({
      uuid: uuidv4(),
      event_id: eventId,
      user_id: userId,
      message: input.message ?? null,
      skill_level: input.skill_level ?? 'open',
      status: 'open',
      created_at: now,
      updated_at: now,
    });

    const row = await db(t('partner_requests')).where('id', id).first();
    return row as PartnerRequestRow;
  }

  /**
   * Delete a partner request (only by owner).
   */
  static async delete(requestId: number, userId: number): Promise<void> {
    const row = await db(t('partner_requests')).where('id', requestId).first();
    if (!row) throw AppError.notFound('Partner request');
    if (row.user_id !== userId) {
      throw AppError.forbidden('You can only delete your own request');
    }
    await db(t('partner_requests')).where('id', requestId).del();
  }

  /**
   * Contact a partner-request owner. Sends a push notification.
   */
  static async contact(requestId: number, fromUserId: number): Promise<void> {
    const row = await db(t('partner_requests')).where('id', requestId).first();
    if (!row) throw AppError.notFound('Partner request');
    if (row.user_id === fromUserId) {
      throw AppError.badRequest('You cannot contact your own request');
    }

    const fromProfile = await db(t('profiles')).where('user_id', fromUserId).first();
    const event = await db(t('events')).where('id', row.event_id).first();
    const fromName =
      fromProfile?.display_name ||
      [fromProfile?.first_name, fromProfile?.last_name].filter(Boolean).join(' ') ||
      'Ein Spieler';

    await NotificationService.send(
      row.user_id,
      'general',
      'Neue Partner-Anfrage',
      `${fromName} möchte mit dir bei "${event?.title ?? 'einem Turnier'}" spielen.`,
      {
        partner_request_id: requestId,
        event_id: row.event_id,
        from_user_id: fromUserId,
      }
    );
  }
}
