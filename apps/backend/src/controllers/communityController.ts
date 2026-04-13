import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class CommunityController {
  // === TEAMS ===
  static async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const teamUuid = uuidv4();

      const [teamId] = await db.transaction(async (trx) => {
        const [id] = await trx(t('teams')).insert({
          uuid: teamUuid,
          name: req.body.name,
          captain_user_id: req.user!.userId,
          sport_category: req.body.sport_category || 'padel',
          max_members: req.body.max_members || 4,
          status: 'active',
          created_at: now,
          updated_at: now,
        });

        await trx(t('team_members')).insert({
          team_id: id,
          user_id: req.user!.userId,
          role: 'captain',
          joined_at: now,
          status: 'active',
        });

        return [id];
      });

      const team = await db(t('teams')).where('id', teamId).first();
      res.status(201).json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  }

  static async listUserTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const teams = await db(t('team_members'))
        .where(`${t('team_members')}.user_id`, req.user!.userId)
        .where(`${t('team_members')}.status`, 'active')
        .leftJoin(t('teams'), `${t('team_members')}.team_id`, `${t('teams')}.id`)
        .select(
          `${t('teams')}.*`,
          `${t('team_members')}.role as member_role`
        );

      // Get member counts
      for (const team of teams) {
        const [{ count }] = await db(t('team_members'))
          .where('team_id', team.id)
          .where('status', 'active')
          .count('* as count');
        (team as any).member_count = Number(count);
      }

      res.json({ success: true, data: teams });
    } catch (error) {
      next(error);
    }
  }

  static async getTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = parseInt(req.params.id, 10);
      const team = await db(t('teams')).where('id', teamId).first();
      if (!team) throw AppError.notFound('Team');

      const members = await db(t('team_members'))
        .where('team_id', teamId)
        .whereIn('status', ['active', 'invited'])
        .leftJoin(t('profiles'), `${t('team_members')}.user_id`, `${t('profiles')}.user_id`)
        .select(
          `${t('team_members')}.*`,
          `${t('profiles')}.first_name`,
          `${t('profiles')}.last_name`,
          `${t('profiles')}.display_name`,
          `${t('profiles')}.avatar_url`
        );

      res.json({ success: true, data: { ...team, members } });
    } catch (error) {
      next(error);
    }
  }

  static async inviteTeamMember(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = parseInt(req.params.id, 10);
      const { user_id } = req.body;

      const team = await db(t('teams')).where('id', teamId).first();
      if (!team) throw AppError.notFound('Team');
      if (team.captain_user_id !== req.user!.userId) {
        throw AppError.forbidden('Only the team captain can invite members');
      }

      const existing = await db(t('team_members'))
        .where('team_id', teamId)
        .where('user_id', user_id)
        .whereIn('status', ['active', 'invited'])
        .first();

      if (existing) throw AppError.conflict('User is already a member or has been invited');

      const [{ count: memberCount }] = await db(t('team_members'))
        .where('team_id', teamId)
        .where('status', 'active')
        .count('* as count');

      if (Number(memberCount) >= team.max_members) {
        throw AppError.badRequest('Team is full');
      }

      await db(t('team_members')).insert({
        team_id: teamId,
        user_id,
        role: 'member',
        joined_at: new Date(),
        status: 'invited',
      });

      // Notify invited user
      await db(t('notifications')).insert({
        user_id,
        type: 'general',
        title: 'Team-Einladung',
        body: `Du wurdest eingeladen, dem Team "${team.name}" beizutreten.`,
        data: JSON.stringify({ team_id: teamId }),
        created_at: new Date(),
      });

      res.status(201).json({ success: true, data: { message: 'Invitation sent' } });
    } catch (error) {
      next(error);
    }
  }

  static async acceptTeamInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = parseInt(req.params.id, 10);
      const membership = await db(t('team_members'))
        .where('team_id', teamId)
        .where('user_id', req.user!.userId)
        .where('status', 'invited')
        .first();

      if (!membership) throw AppError.notFound('Team invitation');

      await db(t('team_members')).where('id', membership.id).update({
        status: 'active',
        joined_at: new Date(),
      });

      res.json({ success: true, data: { message: 'Joined team successfully' } });
    } catch (error) {
      next(error);
    }
  }

  // === FRIENDS ===
  static async sendFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = req.body;
      if (user_id === req.user!.userId) {
        throw AppError.badRequest('Cannot send friend request to yourself');
      }

      const existing = await db(t('friendships'))
        .where(function () {
          this.where('requester_id', req.user!.userId).where('addressee_id', user_id);
        })
        .orWhere(function () {
          this.where('requester_id', user_id).where('addressee_id', req.user!.userId);
        })
        .first();

      if (existing) {
        if (existing.status === 'blocked') throw AppError.badRequest('Cannot send request');
        if (existing.status === 'accepted') throw AppError.conflict('Already friends');
        if (existing.status === 'pending') throw AppError.conflict('Friend request already pending');
      }

      await db(t('friendships')).insert({
        requester_id: req.user!.userId,
        addressee_id: user_id,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await db(t('notifications')).insert({
        user_id,
        type: 'general',
        title: 'Neue Freundschaftsanfrage',
        body: 'Du hast eine neue Freundschaftsanfrage erhalten.',
        data: JSON.stringify({ requester_id: req.user!.userId }),
        created_at: new Date(),
      });

      res.status(201).json({ success: true, data: { message: 'Friend request sent' } });
    } catch (error) {
      next(error);
    }
  }

  static async acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const friendshipId = parseInt(req.params.id, 10);
      const friendship = await db(t('friendships'))
        .where('id', friendshipId)
        .where('addressee_id', req.user!.userId)
        .where('status', 'pending')
        .first();

      if (!friendship) throw AppError.notFound('Friend request');

      await db(t('friendships')).where('id', friendshipId).update({
        status: 'accepted',
        updated_at: new Date(),
      });

      res.json({ success: true, data: { message: 'Friend request accepted' } });
    } catch (error) {
      next(error);
    }
  }

  static async listFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const friends = await db(t('friendships'))
        .where(function () {
          this.where('requester_id', userId).orWhere('addressee_id', userId);
        })
        .where('status', 'accepted')
        .leftJoin(t('profiles'), function () {
          this.on(function () {
            this.on(`${t('friendships')}.requester_id`, '=', `${t('profiles')}.user_id`)
              .andOn(db.raw(`${t('friendships')}.requester_id != ?`, [userId]));
          }).orOn(function () {
            this.on(`${t('friendships')}.addressee_id`, '=', `${t('profiles')}.user_id`)
              .andOn(db.raw(`${t('friendships')}.addressee_id != ?`, [userId]));
          });
        })
        .select(
          `${t('friendships')}.id as friendship_id`,
          `${t('friendships')}.created_at as friends_since`,
          `${t('profiles')}.user_id`,
          `${t('profiles')}.first_name`,
          `${t('profiles')}.last_name`,
          `${t('profiles')}.display_name`,
          `${t('profiles')}.avatar_url`,
          `${t('profiles')}.city`
        );

      res.json({ success: true, data: friends });
    } catch (error) {
      next(error);
    }
  }

  static async listFriendRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await db(t('friendships'))
        .where('addressee_id', req.user!.userId)
        .where('status', 'pending')
        .leftJoin(t('profiles'), `${t('friendships')}.requester_id`, `${t('profiles')}.user_id`)
        .select(
          `${t('friendships')}.id as friendship_id`,
          `${t('friendships')}.created_at`,
          `${t('profiles')}.user_id`,
          `${t('profiles')}.first_name`,
          `${t('profiles')}.last_name`,
          `${t('profiles')}.display_name`,
          `${t('profiles')}.avatar_url`
        );

      res.json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }
}