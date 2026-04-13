import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db, t } from '../config/database';

const membershipRouter = Router();

membershipRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const membership = await db(t('memberships'))
      .where('user_id', req.user!.userId)
      .where('status', 'active')
      .first();

    res.json({ success: true, data: membership || { tier: 'free', status: 'active' } });
  } catch (error) {
    next(error);
  }
});

membershipRouter.get('/tiers', async (_req, res) => {
  res.json({
    success: true,
    data: {
      tiers: [
        {
          id: 'free',
          name: 'Free',
          price_cents: 0,
          currency: 'EUR',
          period: 'month',
          features: [
            'public_tournaments',
            'court_discovery',
            'standard_notifications',
            'basic_profile',
            'team_features',
            'community_basics',
          ],
          discount_percent: 0,
          early_access_hours: 0,
          waitlist_priority: 'standard',
        },
        {
          id: 'plus',
          name: 'Turneo Plus',
          price_cents: 799,
          currency: 'EUR',
          period: 'month',
          apple_product_id: 'com.turneo.membership.plus.monthly',
          features: [
            'all_free_features',
            'tournament_discount_10',
            'early_access_24h',
            'higher_waitlist_priority',
            'earlier_notifications',
            'exclusive_plus_offers',
            'enhanced_profile',
          ],
          discount_percent: 10,
          early_access_hours: 24,
          waitlist_priority: 'high',
        },
        {
          id: 'club',
          name: 'Turneo Club',
          price_cents: 1499,
          currency: 'EUR',
          period: 'month',
          apple_product_id: 'com.turneo.membership.club.monthly',
          features: [
            'all_plus_features',
            'tournament_discount_20',
            'early_access_48h',
            'highest_waitlist_priority',
            'exclusive_club_tournaments',
            'high_prize_tournaments',
            'premium_statistics',
            'special_community_benefits',
          ],
          discount_percent: 20,
          early_access_hours: 48,
          waitlist_priority: 'highest',
        },
      ],
    },
  });
});

// Apple IAP verification endpoint
membershipRouter.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { receipt_data, product_id } = req.body;
    const now = new Date();

    // In production, verify receipt with Apple's App Store Server API
    // For now, create/update membership based on product_id
    let tier: 'plus' | 'club' = 'plus';
    let priceCents = 799;
    if (product_id?.includes('club')) {
      tier = 'club';
      priceCents = 1499;
    }

    const existing = await db(t('memberships'))
      .where('user_id', req.user!.userId)
      .where('status', 'active')
      .first();

    if (existing) {
      await db(t('memberships')).where('id', existing.id).update({
        tier,
        apple_subscription_id: receipt_data,
        price_cents: priceCents,
        updated_at: now,
      });
    } else {
      await db(t('memberships')).insert({
        user_id: req.user!.userId,
        tier,
        status: 'active',
        apple_subscription_id: receipt_data,
        started_at: now,
        price_cents: priceCents,
        currency: 'EUR',
        created_at: now,
        updated_at: now,
      });
    }

    await db(t('audit_log')).insert({
      user_id: req.user!.userId,
      action: 'membership.subscribed',
      entity_type: 'membership',
      new_values: JSON.stringify({ tier, product_id }),
      created_at: now,
    });

    res.json({ success: true, data: { tier, status: 'active' } });
  } catch (error) {
    next(error);
  }
});

membershipRouter.put('/cancel', authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    await db(t('memberships'))
      .where('user_id', req.user!.userId)
      .where('status', 'active')
      .whereNot('tier', 'free')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        updated_at: now,
      });

    // Create free membership
    await db(t('memberships')).insert({
      user_id: req.user!.userId,
      tier: 'free',
      status: 'active',
      started_at: now,
      created_at: now,
      updated_at: now,
    });

    res.json({ success: true, data: { tier: 'free', status: 'active' } });
  } catch (error) {
    next(error);
  }
});

export { membershipRouter };