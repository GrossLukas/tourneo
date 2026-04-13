import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { env } from '../config/environment';
import { AppError } from '../middleware/errorHandler';
import { AuthTokenPayload, UserRole } from '../types';
import { RegisterInput, LoginInput } from '../validators/auth';

const BCRYPT_ROUNDS = 12;

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await db(t('users')).where('email', input.email).first();
    if (existingUser) {
      throw AppError.conflict('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const userUuid = uuidv4();
    const now = new Date();

    const result = await db.transaction(async (trx) => {
      // Create user
      const [userId] = await trx(t('users')).insert({
        uuid: userUuid,
        email: input.email.toLowerCase().trim(),
        password_hash: passwordHash,
        email_verified: false,
        role: 'user' as UserRole,
        status: 'active',
        created_at: now,
        updated_at: now,
      });

      // Create profile
      await trx(t('profiles')).insert({
        user_id: userId,
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        display_name: input.display_name?.trim() || null,
        date_of_birth: input.date_of_birth,
        city: input.city?.trim() || null,
        region: input.region?.trim() || null,
        country: input.country,
        created_at: now,
        updated_at: now,
      });

      // Create language preference
      await trx(t('language_preferences')).insert({
        user_id: userId,
        locale: input.locale,
        system_detected_locale: input.locale,
        manual_override: false,
        updated_at: now,
      });

      // Create free membership
      await trx(t('memberships')).insert({
        user_id: userId,
        tier: 'free',
        status: 'active',
        started_at: now,
        created_at: now,
        updated_at: now,
      });

      // Log consents
      const consents = [
        {
          user_id: userId,
          consent_type: 'terms',
          legal_document_version_id: input.terms_version_id,
          granted: true,
          granted_at: now,
          created_at: now,
        },
        {
          user_id: userId,
          consent_type: 'privacy',
          legal_document_version_id: input.privacy_version_id,
          granted: true,
          granted_at: now,
          created_at: now,
        },
        {
          user_id: userId,
          consent_type: 'age_verification',
          legal_document_version_id: input.terms_version_id,
          granted: true,
          granted_at: now,
          created_at: now,
        },
      ];

      if (input.consent_media) {
        consents.push({
          user_id: userId,
          consent_type: 'media_consent',
          legal_document_version_id: input.terms_version_id,
          granted: true,
          granted_at: now,
          created_at: now,
        });
      }

      await trx(t('consents')).insert(consents);

      // Audit log
      await trx(t('audit_log')).insert({
        user_id: userId,
        action: 'user.registered',
        entity_type: 'user',
        entity_id: userId,
        new_values: JSON.stringify({ email: input.email, locale: input.locale }),
        created_at: now,
      });

      return { userId, userUuid };
    });

    // Generate tokens
    const tokens = this.generateTokens({
      userId: result.userId,
      uuid: result.userUuid,
      email: input.email.toLowerCase().trim(),
      role: 'user',
    });

    return {
      user: {
        id: result.userId,
        uuid: result.userUuid,
        email: input.email.toLowerCase().trim(),
        first_name: input.first_name,
        last_name: input.last_name,
        role: 'user' as UserRole,
        membership_tier: 'free' as const,
      },
      ...tokens,
    };
  }

  static async login(input: LoginInput) {
    const user = await db(t('users'))
      .where('email', input.email.toLowerCase().trim())
      .where('status', 'active')
      .first();

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const profile = await db(t('profiles')).where('user_id', user.id).first();
    const membership = await db(t('memberships'))
      .where('user_id', user.id)
      .where('status', 'active')
      .first();

    const tokens = this.generateTokens({
      userId: user.id,
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    });

    // Audit log
    await db(t('audit_log')).insert({
      user_id: user.id,
      action: 'user.login',
      entity_type: 'user',
      entity_id: user.id,
      created_at: new Date(),
    });

    return {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url,
        role: user.role,
        membership_tier: membership?.tier || 'free',
      },
      ...tokens,
    };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.jwt.refreshSecret) as AuthTokenPayload;

      const user = await db(t('users'))
        .where('id', payload.userId)
        .where('status', 'active')
        .first();

      if (!user) {
        throw AppError.unauthorized('User not found or inactive');
      }

      const tokens = this.generateTokens({
        userId: user.id,
        uuid: user.uuid,
        email: user.email,
        role: user.role,
      });

      return tokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }

  static generateTokens(payload: AuthTokenPayload) {
    const accessToken = jwt.sign(payload, env.jwt.accessSecret, {
      expiresIn: env.jwt.accessExpiry,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiry,
    } as jwt.SignOptions);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  static async getUserById(userId: number) {
    const user = await db(t('users'))
      .where('id', userId)
      .where('status', 'active')
      .first();

    if (!user) {
      throw AppError.notFound('User');
    }

    const profile = await db(t('profiles')).where('user_id', userId).first();
    const membership = await db(t('memberships'))
      .where('user_id', userId)
      .where('status', 'active')
      .first();
    const language = await db(t('language_preferences')).where('user_id', userId).first();

    return {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      email_verified: user.email_verified,
      role: user.role,
      profile: profile ? {
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        date_of_birth: profile.date_of_birth,
        phone: profile.phone,
        city: profile.city,
        region: profile.region,
        country: profile.country,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      } : null,
      membership: {
        tier: membership?.tier || 'free',
        status: membership?.status || 'active',
        expires_at: membership?.expires_at,
      },
      locale: language?.locale || 'de',
      created_at: user.created_at,
    };
  }
}