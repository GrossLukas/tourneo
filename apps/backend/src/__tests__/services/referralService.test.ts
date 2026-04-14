// Mock DB layer before importing the service
const mockChain = () => {
  const chain: any = {
    where: jest.fn(() => chain),
    first: jest.fn(),
    insert: jest.fn(() => Promise.resolve([1])),
    update: jest.fn(() => Promise.resolve(1)),
  };
  return chain;
};

jest.mock('../../config/database', () => {
  const tables: Record<string, any> = {};
  const dbFn: any = jest.fn((tableName: string) => {
    if (!tables[tableName]) tables[tableName] = mockChain();
    return tables[tableName];
  });
  dbFn.__tables = tables;
  return {
    db: dbFn,
    t: (name: string) => `tourneo_${name}`,
  };
});

import { ReferralService } from '../../services/referralService';
import { db } from '../../config/database';

describe('ReferralService.findReferrerByCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db as any).__tables = {};
  });

  it('returns null for empty code', async () => {
    const result = await ReferralService.findReferrerByCode('');
    expect(result).toBeNull();
  });

  it('returns null for whitespace code', async () => {
    const result = await ReferralService.findReferrerByCode('   ');
    expect(result).toBeNull();
  });

  it('uppercases and trims the code before lookup', async () => {
    const usersChain: any = {
      where: jest.fn(() => usersChain),
      first: jest.fn(() => Promise.resolve({ id: 42 })),
    };
    (db as any).mockImplementation(() => usersChain);

    const result = await ReferralService.findReferrerByCode('  t1abc  ');

    expect(usersChain.where).toHaveBeenCalledWith('referral_code', 'T1ABC');
    expect(result).toBe(42);
  });

  it('returns null when no user matches', async () => {
    const usersChain: any = {
      where: jest.fn(() => usersChain),
      first: jest.fn(() => Promise.resolve(undefined)),
    };
    (db as any).mockImplementation(() => usersChain);

    const result = await ReferralService.findReferrerByCode('NOPE');
    expect(result).toBeNull();
  });
});

describe('ReferralService.recordReferral', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when code is invalid', async () => {
    const usersChain: any = {
      where: jest.fn(() => usersChain),
      first: jest.fn(() => Promise.resolve(undefined)),
    };
    const referralsChain: any = {
      where: jest.fn(() => referralsChain),
      first: jest.fn(),
      insert: jest.fn(() => Promise.resolve([1])),
    };
    (db as any).mockImplementation((table: string) =>
      table === 'tourneo_referrals' ? referralsChain : usersChain
    );

    await ReferralService.recordReferral(7, 'BAD');
    expect(referralsChain.insert).not.toHaveBeenCalled();
  });

  it('skips self-referrals', async () => {
    const usersChain: any = {
      where: jest.fn(() => usersChain),
      first: jest.fn(() => Promise.resolve({ id: 7 })),
    };
    const referralsChain: any = {
      where: jest.fn(() => referralsChain),
      first: jest.fn(),
      insert: jest.fn(() => Promise.resolve([1])),
    };
    (db as any).mockImplementation((table: string) =>
      table === 'tourneo_referrals' ? referralsChain : usersChain
    );

    await ReferralService.recordReferral(7, 'SELF');
    expect(referralsChain.insert).not.toHaveBeenCalled();
  });

  it('inserts a referral row when a valid referrer is found', async () => {
    const usersChain: any = {
      where: jest.fn(() => usersChain),
      first: jest.fn(() => Promise.resolve({ id: 100 })),
    };
    const referralsChain: any = {
      where: jest.fn(() => referralsChain),
      first: jest.fn(() => Promise.resolve(undefined)),
      insert: jest.fn(() => Promise.resolve([1])),
    };
    (db as any).mockImplementation((table: string) =>
      table === 'tourneo_referrals' ? referralsChain : usersChain
    );

    await ReferralService.recordReferral(200, 't1abc');

    expect(referralsChain.insert).toHaveBeenCalledTimes(1);
    const inserted = referralsChain.insert.mock.calls[0][0];
    expect(inserted.referrer_user_id).toBe(100);
    expect(inserted.referred_user_id).toBe(200);
    expect(inserted.referral_code).toBe('T1ABC');
    expect(inserted.reward_granted).toBe(false);
  });

  it('is idempotent — does not double-insert', async () => {
    const usersChain: any = {
      where: jest.fn(() => usersChain),
      first: jest.fn(() => Promise.resolve({ id: 100 })),
    };
    const referralsChain: any = {
      where: jest.fn(() => referralsChain),
      first: jest.fn(() => Promise.resolve({ id: 5 })), // already exists
      insert: jest.fn(() => Promise.resolve([1])),
    };
    (db as any).mockImplementation((table: string) =>
      table === 'tourneo_referrals' ? referralsChain : usersChain
    );

    await ReferralService.recordReferral(200, 'EXIST');
    expect(referralsChain.insert).not.toHaveBeenCalled();
  });
});
