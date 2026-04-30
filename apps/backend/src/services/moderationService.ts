import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export type ModerationTargetType =
  | 'profile'
  | 'chat_message'
  | 'venue_review'
  | 'venue_photo'
  | 'event'
  | 'other';

export type ModerationReason =
  | 'spam'
  | 'abuse'
  | 'harassment'
  | 'inappropriate'
  | 'privacy'
  | 'fraud'
  | 'other';

type ReportInput = {
  target_type: ModerationTargetType;
  target_id?: number | null;
  target_user_id?: number | null;
  reason: ModerationReason;
  detail?: string | null;
};

export class ModerationService {
  static async report(input: ReportInput, reporterUserId: number) {
    const target = await this.resolveTarget(input);
    if (target.targetUserId === reporterUserId && input.target_type === 'profile') {
      throw AppError.badRequest('You cannot report your own profile');
    }

    const now = new Date();
    const [id] = await db(t('moderation_reports')).insert({
      uuid: uuidv4(),
      reporter_user_id: reporterUserId,
      target_user_id: target.targetUserId ?? input.target_user_id ?? null,
      target_type: input.target_type,
      target_id: input.target_id ?? null,
      reason: input.reason,
      detail: input.detail?.trim() || null,
      status: 'open',
      created_at: now,
      updated_at: now,
    });

    await db(t('audit_log')).insert({
      user_id: reporterUserId,
      action: 'moderation.report_created',
      entity_type: 'moderation_report',
      entity_id: id,
      new_values: JSON.stringify({
        target_type: input.target_type,
        target_id: input.target_id ?? null,
        target_user_id: target.targetUserId ?? input.target_user_id ?? null,
        reason: input.reason,
      }),
      created_at: now,
    });

    return db(t('moderation_reports')).where('id', id).first();
  }

  static async blockUser(blockerUserId: number, blockedUserId: number) {
    if (blockerUserId === blockedUserId) {
      throw AppError.badRequest('You cannot block yourself');
    }
    const user = await db(t('users'))
      .where('id', blockedUserId)
      .where('status', 'active')
      .first();
    if (!user) throw AppError.notFound('User');

    const now = new Date();
    await db(t('user_blocks'))
      .insert({
        blocker_user_id: blockerUserId,
        blocked_user_id: blockedUserId,
        created_at: now,
      })
      .onConflict(['blocker_user_id', 'blocked_user_id'])
      .ignore();

    await db(t('friendships'))
      .where(function () {
        this.where({ requester_id: blockerUserId, addressee_id: blockedUserId }).orWhere({
          requester_id: blockedUserId,
          addressee_id: blockerUserId,
        });
      })
      .update({ status: 'blocked', updated_at: now });

    return { blocked: true, blocked_user_id: blockedUserId };
  }

  static async unblockUser(blockerUserId: number, blockedUserId: number) {
    await db(t('user_blocks'))
      .where({ blocker_user_id: blockerUserId, blocked_user_id: blockedUserId })
      .del();
    return { blocked: false, blocked_user_id: blockedUserId };
  }

  static async listBlockedUsers(userId: number) {
    return db(t('user_blocks') + ' as b')
      .leftJoin(t('profiles') + ' as p', 'b.blocked_user_id', 'p.user_id')
      .where('b.blocker_user_id', userId)
      .orderBy('b.created_at', 'desc')
      .select(
        'b.blocked_user_id',
        'b.created_at',
        'p.display_name',
        'p.first_name',
        'p.last_name',
        'p.avatar_url'
      );
  }

  static async getBlockedUserIds(userId: number): Promise<number[]> {
    const rows = await db(t('user_blocks'))
      .where('blocker_user_id', userId)
      .orWhere('blocked_user_id', userId)
      .select('blocker_user_id', 'blocked_user_id');
    const ids = new Set<number>();
    for (const row of rows) {
      if (row.blocker_user_id !== userId) ids.add(Number(row.blocker_user_id));
      if (row.blocked_user_id !== userId) ids.add(Number(row.blocked_user_id));
    }
    return Array.from(ids);
  }

  static async listReports(status?: string) {
    const query = db(t('moderation_reports') + ' as r')
      .leftJoin(t('users') + ' as reporter', 'r.reporter_user_id', 'reporter.id')
      .leftJoin(t('users') + ' as target', 'r.target_user_id', 'target.id')
      .select(
        'r.*',
        'reporter.email as reporter_email',
        'target.email as target_email'
      )
      .orderBy('r.created_at', 'desc');

    if (status && status !== 'all') query.where('r.status', status);
    return query;
  }

  static async reviewReport(
    reportId: number,
    adminUserId: number,
    status: 'reviewed' | 'dismissed' | 'actioned',
    actionTaken?: string
  ) {
    const report = await db(t('moderation_reports')).where('id', reportId).first();
    if (!report) throw AppError.notFound('Moderation report');

    const now = new Date();
    await db(t('moderation_reports')).where('id', reportId).update({
      status,
      reviewed_by: adminUserId,
      reviewed_at: now,
      action_taken: actionTaken || null,
      updated_at: now,
    });

    await db(t('audit_log')).insert({
      user_id: adminUserId,
      action: 'moderation.report_reviewed',
      entity_type: 'moderation_report',
      entity_id: reportId,
      new_values: JSON.stringify({ status, action_taken: actionTaken || null }),
      created_at: now,
    });

    return db(t('moderation_reports')).where('id', reportId).first();
  }

  static async hideTarget(
    targetType: ModerationTargetType,
    targetId: number,
    adminUserId: number,
    note?: string
  ) {
    const tableName = this.tableForTarget(targetType);
    if (!tableName) throw AppError.badRequest('This target cannot be hidden automatically');

    const row = await db(tableName).where('id', targetId).first();
    if (!row) throw AppError.notFound('Target');

    const now = new Date();
    await db(tableName).where('id', targetId).update({
      moderation_status: 'hidden',
      hidden_at: now,
      hidden_by: adminUserId,
      moderation_note: note || null,
      ...(row.updated_at !== undefined ? { updated_at: now } : {}),
    });

    await db(t('audit_log')).insert({
      user_id: adminUserId,
      action: 'moderation.target_hidden',
      entity_type: targetType,
      entity_id: targetId,
      new_values: JSON.stringify({ note: note || null }),
      created_at: now,
    });

    return { hidden: true, target_type: targetType, target_id: targetId };
  }

  private static async resolveTarget(input: ReportInput): Promise<{ targetUserId: number | null }> {
    if (input.target_user_id) return { targetUserId: input.target_user_id };
    if (!input.target_id) return { targetUserId: null };

    switch (input.target_type) {
      case 'profile':
        return { targetUserId: input.target_id };
      case 'chat_message': {
        const row = await db(t('chat_messages')).where('id', input.target_id).first();
        if (!row) throw AppError.notFound('Chat message');
        return { targetUserId: row.user_id };
      }
      case 'venue_review': {
        const row = await db(t('venue_reviews')).where('id', input.target_id).first();
        if (!row) throw AppError.notFound('Venue review');
        return { targetUserId: row.user_id };
      }
      case 'venue_photo': {
        const row = await db(t('venue_photos')).where('id', input.target_id).first();
        if (!row) throw AppError.notFound('Venue photo');
        return { targetUserId: row.user_id };
      }
      default:
        return { targetUserId: null };
    }
  }

  private static tableForTarget(targetType: ModerationTargetType): string | null {
    switch (targetType) {
      case 'chat_message':
        return t('chat_messages');
      case 'venue_review':
        return t('venue_reviews');
      case 'venue_photo':
        return t('venue_photos');
      default:
        return null;
    }
  }
}
