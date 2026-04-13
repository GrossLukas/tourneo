import { Router } from 'express';
import { CommunityController } from '../controllers/communityController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createTeamSchema, inviteTeamMemberSchema, friendRequestSchema } from '../validators/users';

const teamRouter = Router();
teamRouter.get('/', authenticate, CommunityController.listUserTeams);
teamRouter.post('/', authenticate, validateBody(createTeamSchema), CommunityController.createTeam);
teamRouter.get('/:id', authenticate, CommunityController.getTeam);
teamRouter.post('/:id/members', authenticate, validateBody(inviteTeamMemberSchema), CommunityController.inviteTeamMember);
teamRouter.post('/:id/members/accept', authenticate, CommunityController.acceptTeamInvite);

const friendRouter = Router();
friendRouter.get('/', authenticate, CommunityController.listFriends);
friendRouter.get('/requests', authenticate, CommunityController.listFriendRequests);
friendRouter.post('/request', authenticate, validateBody(friendRequestSchema), CommunityController.sendFriendRequest);
friendRouter.put('/:id/accept', authenticate, CommunityController.acceptFriendRequest);

export const communityRouter = { teamRouter, friendRouter };