import crypto from 'crypto';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type { AuthTokenPayload } from '../types';

export type Viewer = Pick<AuthTokenPayload, 'userId' | 'role'> | undefined;

interface EventAccessFields {
  status?: unknown;
  access_type?: unknown;
  invite_token?: unknown;
  created_by?: unknown;
  is_community?: unknown;
}

/** Registrations that still take part – cancelled and refunded ones do not. */
const ACTIVE_REGISTRATION = ['confirmed', 'pending_payment', 'waitlisted'];

export function isAdminRole(role?: string): boolean {
  return role === 'admin' || role === 'superadmin';
}

/**
 * Admins may run every tournament; a player only the tournaments among
 * friends they created themselves (not, say, an official event they created
 * back when they were an admin).
 */
export function canOrganizeEvent(
  viewer: Viewer,
  event: Pick<EventAccessFields, 'created_by' | 'is_community'>
): boolean {
  if (!viewer) return false;
  if (isAdminRole(viewer.role)) return true;
  return Boolean(Number(event.is_community))
    && event.created_by != null
    && Number(event.created_by) === Number(viewer.userId);
}

export function inviteTokenMatches(expected: unknown, given: unknown): boolean {
  if (typeof expected !== 'string' || typeof given !== 'string' || !expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Who may see a tournament: drafts only its organisers, private tournaments
 * additionally their participants and whoever holds the invite link.
 */
export function canViewEvent(args: {
  event: EventAccessFields;
  viewer: Viewer;
  isParticipant?: boolean;
  inviteToken?: unknown;
}): boolean {
  const { event, viewer } = args;
  if (canOrganizeEvent(viewer, event)) return true;
  if (event.status === 'draft') return false;
  if (event.access_type !== 'private') return true;
  return Boolean(args.isParticipant) || inviteTokenMatches(event.invite_token, args.inviteToken);
}

/** The invite token a request carries as ?invite=…, if any. */
export function inviteFromQuery(query: Record<string, unknown> | undefined): string | undefined {
  const value = query?.invite;
  return typeof value === 'string' && value ? value.slice(0, 64) : undefined;
}

export class EventAccess {
  /**
   * Throws 404 – not 403, so private tournaments do not reveal themselves –
   * when the viewer may not see the event.
   */
  static async assertVisible(eventId: number, viewer: Viewer, inviteToken?: unknown) {
    if (!Number.isFinite(eventId)) throw AppError.notFound('Event');
    const event = await db(t('events'))
      .where('id', eventId)
      .first('id', 'status', 'access_type', 'invite_token', 'created_by', 'is_community');
    if (!event) throw AppError.notFound('Event');

    const canOrganize = canOrganizeEvent(viewer, event);
    const tokenOk = inviteTokenMatches(event.invite_token, inviteToken);
    const isParticipant = event.access_type === 'private' && viewer && !canOrganize && !tokenOk
      ? await this.isParticipant(eventId, viewer.userId)
      : false;
    if (!canViewEvent({ event, viewer, isParticipant, inviteToken })) throw AppError.notFound('Event');

    // The organiser hands the invite link out; everybody else only gets back the one they came with
    return { canOrganize, canSeeInvite: canOrganize || tokenOk };
  }

  static async isParticipant(eventId: number, userId: number): Promise<boolean> {
    const row = await db(t('registrations'))
      .where('event_id', eventId)
      .where(function () {
        this.where('user_id', userId).orWhere('partner_user_id', userId);
      })
      .whereIn('status', ACTIVE_REGISTRATION)
      .first('id');
    return Boolean(row);
  }
}
