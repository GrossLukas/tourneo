import { Router } from 'express';
import { db, t } from '../config/database';

const hallOfFameRouter = Router();

hallOfFameRouter.get('/', async (req, res, next) => {
  try {
    const { sport_category, page = 1, per_page = 20 } = req.query;

    let query = db(t('hall_of_fame'))
      .leftJoin(t('profiles'), `${t('hall_of_fame')}.user_id`, `${t('profiles')}.user_id`)
      .leftJoin(t('teams'), `${t('hall_of_fame')}.team_id`, `${t('teams')}.id`)
      .select(
        `${t('hall_of_fame')}.*`,
        `${t('profiles')}.first_name`,
        `${t('profiles')}.last_name`,
        `${t('profiles')}.display_name`,
        `${t('profiles')}.avatar_url`,
        `${t('teams')}.name as team_name`
      );

    if (sport_category) {
      query = query.where(`${t('hall_of_fame')}.sport_category`, sport_category as string);
    }

    const countQuery = query.clone();
    const [{ count: total }] = await countQuery.count('* as count');
    const offset = (Number(page) - 1) * Number(per_page);

    const entries = await query
      .orderBy('event_date', 'desc')
      .orderBy('place', 'asc')
      .limit(Number(per_page))
      .offset(offset);

    res.json({
      success: true,
      data: entries,
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

hallOfFameRouter.get('/event/:id', async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const entries = await db(t('hall_of_fame'))
      .where('event_id', eventId)
      .leftJoin(t('profiles'), `${t('hall_of_fame')}.user_id`, `${t('profiles')}.user_id`)
      .leftJoin(t('teams'), `${t('hall_of_fame')}.team_id`, `${t('teams')}.id`)
      .select(
        `${t('hall_of_fame')}.*`,
        `${t('profiles')}.first_name`,
        `${t('profiles')}.last_name`,
        `${t('profiles')}.display_name`,
        `${t('profiles')}.avatar_url`,
        `${t('teams')}.name as team_name`
      )
      .orderBy('place', 'asc');

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
});

export { hallOfFameRouter };