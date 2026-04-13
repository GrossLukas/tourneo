import { Router } from 'express';
import { authenticate, adminOnly, superadminOnly } from '../middleware/auth';
import { PaymentController } from '../controllers/paymentController';
import { db, t } from '../config/database';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, adminOnly);

// Business Dashboard Stats
router.get('/stats/overview', PaymentController.getAdminStats);

router.get('/stats/events', async (_req, res, next) => {
  try {
    const [counts] = await db(t('events'))
      .select(
        db.raw(`SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft`),
        db.raw(`SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published`),
        db.raw(`SUM(CASE WHEN status = 'registration_open' THEN 1 ELSE 0 END) as registration_open`),
        db.raw(`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress`),
        db.raw(`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed`),
        db.raw(`SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled`),
        db.raw('COUNT(*) as total')
      );

    res.json({ success: true, data: counts });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/revenue', async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    let dateFilter = new Date();
    if (period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
    else if (period === '90d') dateFilter.setDate(dateFilter.getDate() - 90);
    else dateFilter.setFullYear(dateFilter.getFullYear() - 1);

    const revenue = await db(t('payments'))
      .where('status', 'succeeded')
      .where('paid_at', '>=', dateFilter)
      .select(
        db.raw('DATE(paid_at) as date'),
        db.raw('SUM(net_amount_cents) as revenue'),
        db.raw('COUNT(*) as transactions')
      )
      .groupByRaw('DATE(paid_at)')
      .orderBy('date', 'asc');

    res.json({ success: true, data: revenue });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/members', async (_req, res, next) => {
  try {
    const members = await db(t('memberships'))
      .where('status', 'active')
      .select('tier')
      .count('* as count')
      .groupBy('tier');

    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
});

// User Management (superadmin only)
router.get('/users', superadminOnly, async (req, res, next) => {
  try {
    const { page = 1, per_page = 20, search, role, status } = req.query;
    let query = db(t('users'))
      .leftJoin(t('profiles'), `${t('users')}.id`, `${t('profiles')}.user_id`)
      .leftJoin(t('memberships'), function () {
        this.on(`${t('users')}.id`, '=', `${t('memberships')}.user_id`)
          .andOn(`${t('memberships')}.status`, '=', db.raw("'active'"));
      })
      .select(
        `${t('users')}.id`,
        `${t('users')}.uuid`,
        `${t('users')}.email`,
        `${t('users')}.role`,
        `${t('users')}.status`,
        `${t('users')}.created_at`,
        `${t('profiles')}.first_name`,
        `${t('profiles')}.last_name`,
        `${t('profiles')}.city`,
        `${t('memberships')}.tier as membership_tier`
      );

    if (search) {
      query = query.where(function () {
        this.where(`${t('users')}.email`, 'LIKE', `%${search}%`)
          .orWhere(`${t('profiles')}.first_name`, 'LIKE', `%${search}%`)
          .orWhere(`${t('profiles')}.last_name`, 'LIKE', `%${search}%`);
      });
    }
    if (role) query = query.where(`${t('users')}.role`, role as string);
    if (status) query = query.where(`${t('users')}.status`, status as string);

    const countQuery = query.clone();
    const [{ count: total }] = await countQuery.count('* as count');
    const offset = (Number(page) - 1) * Number(per_page);

    const users = await query
      .orderBy(`${t('users')}.created_at`, 'desc')
      .limit(Number(per_page))
      .offset(offset);

    res.json({
      success: true,
      data: users,
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
});

router.put('/users/:id/role', superadminOnly, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;
    await db(t('users')).where('id', userId).update({ role, updated_at: new Date() });
    res.json({ success: true, data: { message: 'Role updated' } });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id/status', superadminOnly, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body;
    await db(t('users')).where('id', userId).update({ status, updated_at: new Date() });
    res.json({ success: true, data: { message: 'Status updated' } });
  } catch (error) {
    next(error);
  }
});

export { router as adminRouter };