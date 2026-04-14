import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * GDPR – data export.
 * Returns a complete JSON snapshot of every personal data row we hold for
 * the authenticated user (Art. 15 / 20 DSGVO).
 */
router.get(
  '/me/data-export',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const [
        user,
        profile,
        languagePref,
        memberships,
        consents,
        registrations,
        payments,
        refunds,
        notifications,
        mediaConsents,
        pushTokens,
        supportTickets,
      ] = await Promise.all([
        db(t('users'))
          .where('id', userId)
          .select('id', 'uuid', 'email', 'role', 'status', 'email_verified', 'created_at', 'updated_at')
          .first(),
        db(t('profiles')).where('user_id', userId).first(),
        db(t('language_preferences')).where('user_id', userId).first(),
        db(t('memberships')).where('user_id', userId),
        db(t('consents')).where('user_id', userId),
        db(t('registrations')).where('user_id', userId),
        db(t('payments')).where('user_id', userId),
        db(t('refunds')).where('user_id', userId),
        db(t('notifications')).where('user_id', userId),
        db(t('media_consents')).where('user_id', userId),
        db(t('push_tokens')).where('user_id', userId),
        db(t('support_tickets')).where('user_id', userId),
      ]);

      if (!user) throw AppError.notFound('User');

      res.json({
        success: true,
        data: {
          exported_at: new Date().toISOString(),
          user,
          profile,
          language_preference: languagePref,
          memberships,
          consents,
          registrations,
          payments,
          refunds,
          notifications,
          media_consents: mediaConsents,
          push_tokens: pushTokens,
          support_tickets: supportTickets,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GDPR – delete account.
 *
 * Performs a soft-delete:
 *   - users.status = 'deleted', deleted_at = now, email anonymized
 *   - profiles cleared (first_name = "Deleted", last_name = "User", PII nulled)
 *   - audit trail row written
 *
 * Active sessions are not invalidated server-side because the existing JWTs
 * will reject themselves once `users.status !== 'active'`.
 */
router.post(
  '/me/delete-account',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const now = new Date();
      const anonEmail = `deleted_${uuidv4()}@deleted.tourneo.de`;

      await db.transaction(async (trx) => {
        // 1) Anonymize user row
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

        // 2) Anonymize profile (PII)
        await trx(t('profiles')).where('user_id', userId).update({
          first_name: 'Deleted',
          last_name: 'User',
          display_name: null,
          phone: null,
          avatar_url: null,
          bio: null,
          city: null,
          region: null,
          updated_at: now,
        });

        // 3) Disable push tokens
        await trx(t('push_tokens'))
          .where('user_id', userId)
          .update({ is_active: false, updated_at: now });

        // 4) Audit log
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
            'Dein Konto wurde gelöscht. Personenbezogene Daten wurden anonymisiert. Steuerrelevante Belege bleiben aus rechtlichen Gründen erhalten.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as gdprRouter };
