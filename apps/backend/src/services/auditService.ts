import { db, t } from '../config/database';
import { Request } from 'express';

// ============================================
// TOURNEO - Audit Service
// Centralized logging for all admin/system actions
// ============================================

export interface AuditLogEntry {
  actor_id: number | null;
  actor_email?: string;
  actor_role: 'user' | 'admin' | 'superadmin';
  action: string;
  resource_type: string;
  resource_id?: number | null;
  resource_label?: string;
  changes?: { before?: Record<string, any>; after?: Record<string, any> } | null;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export class AuditService {
  /**
   * Log an admin/system action with full context
   */
  static async log(entry: AuditLogEntry, trx?: any): Promise<void> {
    const executor = trx || db;
    await executor(t('audit_logs')).insert({
      actor_id: entry.actor_id,
      actor_email: entry.actor_email || null,
      actor_role: entry.actor_role,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id || null,
      resource_label: entry.resource_label || null,
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      created_at: new Date(),
    });
  }

  /**
   * Log from Express request context (extracts IP, user-agent, actor info)
   */
  static async logFromRequest(
    req: Request,
    action: string,
    resourceType: string,
    resourceId: number | null,
    opts?: {
      resourceLabel?: string;
      changes?: { before?: Record<string, any>; after?: Record<string, any> };
      metadata?: Record<string, any>;
    },
    trx?: any
  ): Promise<void> {
    await this.log(
      {
        actor_id: req.user?.userId || null,
        actor_email: req.user?.email || undefined,
        actor_role: req.user?.role || 'user',
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        resource_label: opts?.resourceLabel,
        changes: opts?.changes,
        metadata: opts?.metadata,
        ip_address: (req.headers['x-forwarded-for'] as string) || req.ip || null,
        user_agent: req.headers['user-agent'] || null,
      },
      trx
    );
  }

  /**
   * Query audit logs with filtering and pagination
   */
  static async query(filters: {
    actor_id?: number;
    action?: string;
    resource_type?: string;
    resource_id?: number;
    from_date?: string;
    to_date?: string;
    page?: number;
    per_page?: number;
  }) {
    const page = filters.page || 1;
    const perPage = filters.per_page || 50;

    let query = db(t('audit_logs'))
      .leftJoin(t('users'), `${t('audit_logs')}.actor_id`, `${t('users')}.id`)
      .select(
        `${t('audit_logs')}.*`,
        `${t('users')}.email as actor_email_resolved`
      );

    if (filters.actor_id) {
      query = query.where(`${t('audit_logs')}.actor_id`, filters.actor_id);
    }
    if (filters.action) {
      query = query.where(`${t('audit_logs')}.action`, 'LIKE', `%${filters.action}%`);
    }
    if (filters.resource_type) {
      query = query.where(`${t('audit_logs')}.resource_type`, filters.resource_type);
    }
    if (filters.resource_id) {
      query = query.where(`${t('audit_logs')}.resource_id`, filters.resource_id);
    }
    if (filters.from_date) {
      query = query.where(`${t('audit_logs')}.created_at`, '>=', filters.from_date);
    }
    if (filters.to_date) {
      query = query.where(`${t('audit_logs')}.created_at`, '<=', filters.to_date);
    }

    const countQuery = query.clone();
    const [{ count: total }] = await countQuery.count('* as count');
    const offset = (page - 1) * perPage;

    const logs = await query
      .orderBy(`${t('audit_logs')}.created_at`, 'desc')
      .limit(perPage)
      .offset(offset);

    return {
      data: logs.map((log: any) => ({
        ...log,
        changes: log.changes ? JSON.parse(log.changes) : null,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      meta: {
        page,
        per_page: perPage,
        total: Number(total),
        total_pages: Math.ceil(Number(total) / perPage),
      },
    };
  }

  /**
   * Get audit trail for a specific resource
   */
  static async getResourceHistory(resourceType: string, resourceId: number) {
    const logs = await db(t('audit_logs'))
      .where('resource_type', resourceType)
      .where('resource_id', resourceId)
      .leftJoin(t('users'), `${t('audit_logs')}.actor_id`, `${t('users')}.id`)
      .select(
        `${t('audit_logs')}.*`,
        `${t('users')}.email as actor_email_resolved`
      )
      .orderBy('created_at', 'desc');

    return logs.map((log: any) => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  }
}