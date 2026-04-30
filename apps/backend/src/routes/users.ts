import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

const consentSyncSchema = z.object({
  mandatory: z.literal(true),
  pushNotifications: z.boolean().optional().default(false),
  personalization: z.boolean().optional().default(false),
  newsletter: z.boolean().optional().default(false),
  consentDate: z.string().datetime().optional(),
  consentVersion: z.string().max(20).optional(),
});

const notificationPreferencesSchema = z.object({
  notify_nearby_events: z.boolean().optional(),
  notify_radius_km: z.number().int().min(1).max(500).optional(),
  notify_level_filter: z.enum(['all', 'beginner', 'intermediate', 'advanced', 'open']).optional(),
});

router.post(
  '/consent',
  authenticate,
  validateBody(consentSyncSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = req.body.consentDate ? new Date(req.body.consentDate) : new Date();
      const entries = [
        { consent_type: 'terms', granted: true },
        { consent_type: 'privacy', granted: true },
        { consent_type: 'age_verification', granted: true },
        { consent_type: 'marketing', granted: Boolean(req.body.newsletter) },
      ] as const;

      await db.transaction(async (trx) => {
        await trx(t('consents')).insert(
          entries.map((entry) => ({
            user_id: req.user!.userId,
            consent_type: entry.consent_type,
            legal_document_version_id: null,
            granted: entry.granted,
            granted_at: now,
            revoked_at: entry.granted ? null : now,
            ip_address: req.ip || null,
            user_agent: req.get('user-agent')?.slice(0, 500) || null,
            created_at: new Date(),
          }))
        );
      });

      res.json({
        success: true,
        data: {
          mandatory: true,
          pushNotifications: req.body.pushNotifications,
          personalization: req.body.personalization,
          newsletter: req.body.newsletter,
          consentVersion: req.body.consentVersion,
          consentDate: now.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/notification-preferences',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await db(t('profiles'))
        .where('user_id', req.user!.userId)
        .select('notify_nearby_events', 'notify_radius_km', 'notify_level_filter')
        .first();

      res.json({
        success: true,
        data: {
          notify_nearby_events: profile?.notify_nearby_events !== false,
          notify_radius_km: Number(profile?.notify_radius_km || 50),
          notify_level_filter: profile?.notify_level_filter || 'all',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/notification-preferences',
  authenticate,
  validateBody(notificationPreferencesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updates: Record<string, any> = { updated_at: new Date() };
      for (const key of ['notify_nearby_events', 'notify_radius_km', 'notify_level_filter'] as const) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      await db(t('profiles')).where('user_id', req.user!.userId).update(updates);
      const profile = await db(t('profiles'))
        .where('user_id', req.user!.userId)
        .select('notify_nearby_events', 'notify_radius_km', 'notify_level_filter')
        .first();

      res.json({
        success: true,
        data: {
          notify_nearby_events: profile?.notify_nearby_events !== false,
          notify_radius_km: Number(profile?.notify_radius_km || 50),
          notify_level_filter: profile?.notify_level_filter || 'all',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/account',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const now = new Date();
      const anonEmail = `deleted_${uuidv4()}@deleted.tourneo.de`;

      await db.transaction(async (trx) => {
        await trx(t('users')).where('id', userId).update({
          email: anonEmail,
          apple_id: null,
          status: 'deleted',
          email_verified: false,
          email_verification_token: null,
          email_verification_expires_at: null,
          password_reset_token: null,
          password_reset_expires_at: null,
          deleted_at: now,
          updated_at: now,
        });

        await trx(t('profiles')).where('user_id', userId).update({
          first_name: 'Deleted',
          last_name: 'User',
          display_name: null,
          phone: null,
          avatar_url: null,
          bio: null,
          city: null,
          region: null,
          playtomic_screenshot_url: null,
          updated_at: now,
        });

        await trx(t('push_tokens'))
          .where('user_id', userId)
          .update({ is_active: false, updated_at: now });

        await trx(t('audit_log')).insert({
          user_id: userId,
          action: 'user.deleted',
          entity_type: 'user',
          entity_id: userId,
          new_values: JSON.stringify({ anonymized_email: anonEmail }),
          created_at: now,
        });
      });

      res.json({
        success: true,
        data: {
          deleted: true,
          message:
            'Dein Konto wurde geloescht. Personenbezogene Daten wurden anonymisiert. Steuerrelevante Belege bleiben aus rechtlichen Gruenden erhalten.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as userRouter };
