import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class VenueController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { city, is_indoor, is_outdoor, is_partner, page = 1, per_page = 20 } = req.query;
      let query = db(t('venues')).where('status', 'active');

      if (city) query = query.where('address_city', 'LIKE', `%${city}%`);
      if (is_indoor !== undefined) query = query.where('is_indoor', is_indoor === 'true');
      if (is_outdoor !== undefined) query = query.where('is_outdoor', is_outdoor === 'true');
      if (is_partner !== undefined) query = query.where('is_partner_venue', is_partner === 'true');

      const countQuery = query.clone();
      const [{ count: total }] = await countQuery.count('* as count');
      const offset = (Number(page) - 1) * Number(per_page);
      const venues = await query.limit(Number(per_page)).offset(offset).orderBy('name', 'asc');

      // Get courts count for each venue
      const venueIds = venues.map((v: any) => v.id);
      const courtCounts = await db(t('courts'))
        .whereIn('venue_id', venueIds)
        .where('status', 'active')
        .groupBy('venue_id')
        .select('venue_id')
        .count('* as court_count');

      const courtMap = new Map(courtCounts.map((c: any) => [c.venue_id, Number(c.court_count)]));

      const enriched = venues.map((v: any) => ({
        ...v,
        court_count: courtMap.get(v.id) || 0,
      }));

      res.json({
        success: true,
        data: enriched,
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
}