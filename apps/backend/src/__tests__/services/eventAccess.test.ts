jest.mock('../../config/database', () => ({ db: jest.fn(), t: (name: string) => `tourneo_${name}` }));

import { canOrganizeEvent, canViewEvent, inviteFromQuery, inviteTokenMatches } from '../../services/eventAccess';
import { createCommunityEventSchema } from '../../validators/communityEvents';

const player = { userId: 7, role: 'user' as const };
const admin = { userId: 1, role: 'admin' as const };
const friendsEvent = { created_by: 7, is_community: 1, access_type: 'private', status: 'registration_open', invite_token: 'tok-123' };

describe('canOrganizeEvent', () => {
  it('lets the creator run their tournament among friends', () => {
    expect(canOrganizeEvent(player, friendsEvent)).toBe(true);
  });

  it('does not let a player run someone else’s or an official tournament', () => {
    expect(canOrganizeEvent({ userId: 8, role: 'user' as const }, friendsEvent)).toBe(false);
    expect(canOrganizeEvent(player, { ...friendsEvent, is_community: 0 })).toBe(false);
    expect(canOrganizeEvent(undefined, friendsEvent)).toBe(false);
  });

  it('keeps admins in charge of everything', () => {
    expect(canOrganizeEvent(admin, { created_by: 99, is_community: 0 })).toBe(true);
  });
});

describe('canViewEvent', () => {
  const stranger = { userId: 9, role: 'user' as const };

  it('hides private tournaments from strangers without the invite', () => {
    expect(canViewEvent({ event: friendsEvent, viewer: stranger })).toBe(false);
    expect(canViewEvent({ event: friendsEvent, viewer: undefined, inviteToken: 'wrong' })).toBe(false);
  });

  it('shows them with the invite link, to participants and to the organiser', () => {
    expect(canViewEvent({ event: friendsEvent, viewer: undefined, inviteToken: 'tok-123' })).toBe(true);
    expect(canViewEvent({ event: friendsEvent, viewer: stranger, isParticipant: true })).toBe(true);
    expect(canViewEvent({ event: friendsEvent, viewer: player })).toBe(true);
  });

  it('keeps drafts for organisers only and public events open', () => {
    expect(canViewEvent({ event: { ...friendsEvent, status: 'draft' }, viewer: stranger, inviteToken: 'tok-123' })).toBe(false);
    expect(canViewEvent({ event: { access_type: 'public', status: 'published' }, viewer: undefined })).toBe(true);
  });
});

describe('invite tokens', () => {
  it('compares exactly and rejects empty or missing values', () => {
    expect(inviteTokenMatches('abc', 'abc')).toBe(true);
    expect(inviteTokenMatches('abc', 'abd')).toBe(false);
    expect(inviteTokenMatches('abc', 'ab')).toBe(false);
    expect(inviteTokenMatches(null, 'abc')).toBe(false);
    expect(inviteTokenMatches('abc', '')).toBe(false);
  });

  it('reads ?invite= and caps its length', () => {
    expect(inviteFromQuery({ invite: 'x'.repeat(100) })).toHaveLength(64);
    expect(inviteFromQuery({})).toBeUndefined();
    expect(inviteFromQuery({ invite: ['a'] })).toBeUndefined();
  });
});

describe('createCommunityEventSchema', () => {
  const base = {
    title: 'Padel mit Freunden',
    start_date: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    max_participants: 8,
  };

  it('accepts an OSM hall and rejects non-http websites', () => {
    const osm = { kind: 'osm', osm_id: 'osm:way/123', name: 'Padel Arena', latitude: 48.1, longitude: 11.5 };
    expect(createCommunityEventSchema.safeParse({ ...base, venue: osm }).success).toBe(true);
    expect(createCommunityEventSchema.safeParse({
      ...base,
      venue: { ...osm, website: 'javascript:alert(1)' },
    }).success).toBe(false);
  });

  it('rejects forged OSM ids and oversized tournaments', () => {
    expect(createCommunityEventSchema.safeParse({
      ...base,
      venue: { kind: 'osm', osm_id: 'tourneo:1', name: 'X', latitude: 1, longitude: 1 },
    }).success).toBe(false);
    expect(createCommunityEventSchema.safeParse({
      ...base,
      max_participants: 100,
      venue: { kind: 'place', name: 'Garten' },
    }).success).toBe(false);
  });
});
