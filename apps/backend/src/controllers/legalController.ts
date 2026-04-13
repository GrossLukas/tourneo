import { Request, Response, NextFunction } from 'express';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class LegalController {
  static async getActiveDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const locale = (req.query.locale as string) || 'de';

      const doc = await db(t('legal_document_versions'))
        .where('document_type', type)
        .where('locale', locale)
        .where('is_active', true)
        .first();

      if (!doc) {
        // Fallback to German
        const fallback = await db(t('legal_document_versions'))
          .where('document_type', type)
          .where('locale', 'de')
          .where('is_active', true)
          .first();

        if (!fallback) throw AppError.notFound('Legal document');
        return res.json({ success: true, data: fallback });
      }

      res.json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  static async listVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const locale = (req.query.locale as string) || 'de';

      const versions = await db(t('legal_document_versions'))
        .where('document_type', type)
        .where('locale', locale)
        .orderBy('created_at', 'desc')
        .select('id', 'version', 'title', 'is_active', 'published_at', 'created_at');

      res.json({ success: true, data: versions });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Create new version
  static async createVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const { document_type, version, locale, title, content, publish } = req.body;

      await db.transaction(async (trx) => {
        // If publishing, deactivate previous active version
        if (publish) {
          await trx(t('legal_document_versions'))
            .where('document_type', document_type)
            .where('locale', locale)
            .where('is_active', true)
            .update({ is_active: false, updated_at: now });
        }

        await trx(t('legal_document_versions')).insert({
          document_type,
          version,
          locale,
          title,
          content,
          is_active: !!publish,
          published_at: publish ? now : null,
          created_at: now,
          updated_at: now,
        });
      });

      res.status(201).json({ success: true, data: { message: 'Legal document version created' } });
    } catch (error) {
      next(error);
    }
  }
}