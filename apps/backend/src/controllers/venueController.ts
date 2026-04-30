import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { VenueReviewService } from '../services/venueReviewService';

export class VenueController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        city,
        is_indoor,
        is_outdoor,
        is_partner,
        lat,
        lng,
        radius_km,
        page = 1,
        per_page = 20,
      } = req.query;

      // Geo-Suche aktiv?
      const latNum = lat !== undefined ? Number(lat) : NaN;
      const lngNum = lng !== undefined ? Number(lng) : NaN;
      const useGeo = Number.isFinite(latNum) && Number.isFinite(lngNum);
      const radius = Number(radius_km) > 0 ? Number(radius_km) : 25;

      const venuesTable = t('venues');

      let query = db(venuesTable).where('status', 'active');

      if (useGeo) {
        // Haversine-Formel (km), nutzt MySQL/MariaDB-Funktionen.
        // distance_km wird als Computed Column zurückgegeben.
        query = query
          .select('*')
          .select(
            db.raw(
              `ROUND((6371 * ACOS(
                COS(RADIANS(?)) * COS(RADIANS(latitude)) *
                COS(RADIANS(longitude) - RADIANS(?)) +
                SIN(RADIANS(?)) * SIN(RADIANS(latitude))
              )), 1) AS distance_km`,
              [latNum, lngNum, latNum]
            )
          )
          .whereNotNull('latitude')
          .whereNotNull('longitude')
          .havingRaw(
            `(6371 * ACOS(
              COS(RADIANS(?)) * COS(RADIANS(latitude)) *
              COS(RADIANS(longitude) - RADIANS(?)) +
              SIN(RADIANS(?)) * SIN(RADIANS(latitude))
            )) <= ?`,
            [latNum, lngNum, latNum, radius]
          )
          .orderBy('distance_km', 'asc');
      } else if (city) {
        // Klassische Stadt-Suche als Fallback
        query = query.where('address_city', 'LIKE', `%${city}%`).orderBy('name', 'asc');
      } else {
        query = query.orderBy('name', 'asc');
      }

      if (is_indoor !== undefined) query = query.where('is_indoor', is_indoor === 'true');
      if (is_outdoor !== undefined) query = query.where('is_outdoor', is_outdoor === 'true');
      if (is_partner !== undefined) query = query.where('is_partner_venue', is_partner === 'true');

      // Total count (separate query – HAVING-Filter ohne ORDER)
      let total = 0;
      if (useGeo) {
        const totalRows = await db(venuesTable)
          .where('status', 'active')
          .whereNotNull('latitude')
          .whereNotNull('longitude')
          .modify((qb) => {
            if (is_indoor !== undefined) qb.where('is_indoor', is_indoor === 'true');
            if (is_outdoor !== undefined) qb.where('is_outdoor', is_outdoor === 'true');
            if (is_partner !== undefined) qb.where('is_partner_venue', is_partner === 'true');
          })
          .havingRaw(
            `(6371 * ACOS(
              COS(RADIANS(?)) * COS(RADIANS(latitude)) *
              COS(RADIANS(longitude) - RADIANS(?)) +
              SIN(RADIANS(?)) * SIN(RADIANS(latitude))
            )) <= ?`,
            [latNum, lngNum, latNum, radius]
          )
          .select(
            db.raw(
              `(6371 * ACOS(
                COS(RADIANS(?)) * COS(RADIANS(latitude)) *
                COS(RADIANS(longitude) - RADIANS(?)) +
                SIN(RADIANS(?)) * SIN(RADIANS(latitude))
              )) AS d`,
              [latNum, lngNum, latNum]
            )
          );
        total = totalRows.length;
      } else {
        const [{ count }] = await query.clone().clearSelect().clearOrder().count('* as count');
        total = Number(count);
      }

      const offset = (Number(page) - 1) * Number(per_page);
      const venues = await query.limit(Number(per_page)).offset(offset);

      // Get courts count for each venue
      const venueIds = venues.map((v: any) => v.id);
      const courtCounts = venueIds.length
        ? await db(t('courts'))
            .whereIn('venue_id', venueIds)
            .where('status', 'active')
            .groupBy('venue_id')
            .select('venue_id')
            .count('* as court_count')
        : [];

      const courtMap = new Map(courtCounts.map((c: any) => [c.venue_id, Number(c.court_count)]));

      const enriched = venues.map((v: any) => ({
        ...v,
        court_count: courtMap.get(v.id) || 0,
        distance_km:
          v.distance_km !== undefined && v.distance_km !== null ? Number(v.distance_km) : null,
      }));

      res.json({
        success: true,
        data: enriched,
        meta: {
          page: Number(page),
          per_page: Number(per_page),
          total,
          total_pages: Math.ceil(total / Number(per_page)),
          ...(useGeo ? { geo: { lat: latNum, lng: lngNum, radius_km: radius } } : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const venueId = parseInt(req.params.id, 10);
      const venue = await db(t('venues')).where('id', venueId).first();
      if (!venue) throw AppError.notFound('Venue');

      const courts = await db(t('courts')).where('venue_id', venueId).where('status', 'active');
      const bookingLinks = await db(t('external_booking_links'))
        .where('venue_id', venueId)
        .where('is_active', true);

      res.json({
        success: true,
        data: { ...venue, courts, booking_links: bookingLinks },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const [venueId] = await db(t('venues')).insert({
        uuid: uuidv4(),
        ...req.body,
        status: 'active',
        created_at: now,
        updated_at: now,
      });

      const venue = await db(t('venues')).where('id', venueId).first();
      res.status(201).json({ success: true, data: venue });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const venueId = parseInt(req.params.id, 10);
      await db(t('venues')).where('id', venueId).update({
        ...req.body,
        updated_at: new Date(),
      });
      const venue = await db(t('venues')).where('id', venueId).first();
      res.json({ success: true, data: venue });
    } catch (error) {
      next(error);
    }
  }

  // ──────────────────────────────────────────────
  // REVIEWS
  // ──────────────────────────────────────────────
  static async listReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const venueId = parseInt(req.params.id, 10);
      const [reviews, summary] = await Promise.all([
        VenueReviewService.listReviews(venueId, req.user?.userId),
        VenueReviewService.getRatingSummary(venueId),
      ]);
      res.json({ success: true, data: reviews, meta: summary });
    } catch (error) {
      next(error);
    }
  }

  static async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const venueId = parseInt(req.params.id, 10);
      const { rating, comment } = req.body || {};
      const ratingNum = Number(rating);
      if (!Number.isFinite(ratingNum)) {
        throw AppError.badRequest('Rating is required');
      }
      const review = await VenueReviewService.upsertReview(
        venueId,
        req.user!.userId,
        ratingNum,
        typeof comment === 'string' ? comment : undefined
      );
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  // ──────────────────────────────────────────────
  // PHOTOS
  // ──────────────────────────────────────────────
  static async listPhotos(req: Request, res: Response, next: NextFunction) {
    try {
      const venueId = parseInt(req.params.id, 10);
      const photos = await VenueReviewService.listPhotos(venueId, req.user?.userId);
      res.json({ success: true, data: photos });
    } catch (error) {
      next(error);
    }
  }

  static async uploadPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const venueId = parseInt(req.params.id, 10);
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) throw AppError.badRequest('No image uploaded');

      // Resize + compress to 1280px wide WebP
      const processed = await sharp(file.buffer)
        .resize({ width: 1280, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      // Local storage under uploads/venues/{venueId}/{uuid}.webp
      const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'venues', String(venueId));
      fs.mkdirSync(uploadsRoot, { recursive: true });
      const filename = `${uuidv4()}.webp`;
      fs.writeFileSync(path.join(uploadsRoot, filename), processed);

      const publicUrl = `/uploads/venues/${venueId}/${filename}`;
      const row = await VenueReviewService.addPhoto(venueId, req.user!.userId, publicUrl);
      res.status(201).json({ success: true, data: row });
    } catch (error) {
      next(error);
    }
  }
}
