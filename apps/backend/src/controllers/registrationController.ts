import { Request, Response, NextFunction } from 'express';
import { RegistrationService } from '../services/registrationService';
import { BracketService } from '../services/bracketService';

export class RegistrationController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RegistrationService.createRegistration(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const registrationId = parseInt(req.params.id, 10);
      const result = await RegistrationService.cancelRegistration(
        registrationId,
        req.user!.userId,
        req.body.reason
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const registrationId = parseInt(req.params.id, 10);
      const result = await RegistrationService.checkIn(registrationId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getCheckinToken(req: Request, res: Response, next: NextFunction) {
    try {
      const registrationId = parseInt(req.params.id, 10);
      const result = await RegistrationService.ensureCheckinToken(
        registrationId,
        req.user!.userId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getCheckinQr(req: Request, res: Response, next: NextFunction) {
    try {
      const registrationId = parseInt(req.params.id, 10);
      const result = await RegistrationService.ensureCheckinToken(
        registrationId,
        req.user!.userId
      );
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const QRCode = require('qrcode');
      const png = await QRCode.toBuffer(result.payload, {
        type: 'png',
        margin: 2,
        scale: 8,
        errorCorrectionLevel: 'M',
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store');
      res.send(png);
    } catch (error) {
      next(error);
    }
  }

  static async listUserRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const registrations = await RegistrationService.getUserRegistrations(
        req.user!.userId,
        status
      );
      res.json({ success: true, data: registrations });
    } catch (error) {
      next(error);
    }
  }

  static async waitlistStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const registrationId = parseInt(req.params.id, 10);
      const data = await BracketService.getWaitlistStatus(registrationId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { db, t } = require('../config/database');
      const registrationId = parseInt(req.params.id, 10);
      const query = db(t('registrations'))
        .where('id', registrationId);

      if (req.user!.role !== 'admin' && req.user!.role !== 'superadmin') {
        query.andWhere((qb: any) => {
          qb.where('user_id', req.user!.userId).orWhere('partner_user_id', req.user!.userId);
        });
      }

      const registration = await query.first();

      if (!registration) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Registration not found' },
        });
      }

      res.json({ success: true, data: registration });
    } catch (error) {
      next(error);
    }
  }
}
