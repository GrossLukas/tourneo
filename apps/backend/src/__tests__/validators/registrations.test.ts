import {
  createRegistrationSchema,
  cancelRegistrationSchema,
  checkinSchema,
  updateRegistrationStatusSchema,
  setSeedSchema,
} from '../../validators/registrations';

// ─────────────────────────────────────────────────────────────
// createRegistrationSchema
// ─────────────────────────────────────────────────────────────
describe('createRegistrationSchema', () => {
  const validSolo = {
    event_id: 1,
    registration_type: 'solo' as const,
    consent_tournament_terms: true as const,
    consent_age_verified: true as const,
  };

  const validDuo = {
    ...validSolo,
    registration_type: 'duo' as const,
    partner_user_id: 2,
  };

  const validTeam = {
    ...validSolo,
    registration_type: 'team' as const,
    team_id: 5,
  };

  it('should accept valid solo registration', () => {
    const result = createRegistrationSchema.safeParse(validSolo);
    expect(result.success).toBe(true);
  });

  it('should accept valid duo registration with partner', () => {
    const result = createRegistrationSchema.safeParse(validDuo);
    expect(result.success).toBe(true);
  });

  it('should accept valid team registration with team_id', () => {
    const result = createRegistrationSchema.safeParse(validTeam);
    expect(result.success).toBe(true);
  });

  it('should apply default consent_media as false', () => {
    const result = createRegistrationSchema.safeParse(validSolo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.consent_media).toBe(false);
    }
  });

  it('should accept explicit consent_media true', () => {
    const result = createRegistrationSchema.safeParse({ ...validSolo, consent_media: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.consent_media).toBe(true);
    }
  });

  // Event ID validation
  it('should reject non-positive event_id', () => {
    const result = createRegistrationSchema.safeParse({ ...validSolo, event_id: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject negative event_id', () => {
    const result = createRegistrationSchema.safeParse({ ...validSolo, event_id: -1 });
    expect(result.success).toBe(false);
  });

  // Registration type validation
  it('should reject invalid registration_type', () => {
    const result = createRegistrationSchema.safeParse({
      ...validSolo,
      registration_type: 'triple',
    });
    expect(result.success).toBe(false);
  });

  // Duo requires partner
  it('should reject duo registration without partner_user_id', () => {
    const result = createRegistrationSchema.safeParse({
      ...validSolo,
      registration_type: 'duo',
    });
    expect(result.success).toBe(false);
  });

  // Team requires team_id
  it('should reject team registration without team_id', () => {
    const result = createRegistrationSchema.safeParse({
      ...validSolo,
      registration_type: 'team',
    });
    expect(result.success).toBe(false);
  });

  // Solo doesn't need partner or team
  it('should accept solo without partner or team', () => {
    const result = createRegistrationSchema.safeParse(validSolo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partner_user_id).toBeUndefined();
      expect(result.data.team_id).toBeUndefined();
    }
  });

  // Consent validation
  it('should reject without tournament terms consent', () => {
    const result = createRegistrationSchema.safeParse({
      ...validSolo,
      consent_tournament_terms: false,
    });
    expect(result.success).toBe(false);
  });

  it('should reject without age verification consent', () => {
    const result = createRegistrationSchema.safeParse({
      ...validSolo,
      consent_age_verified: false,
    });
    expect(result.success).toBe(false);
  });

  // Missing required fields
  it('should reject empty object', () => {
    const result = createRegistrationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject missing event_id', () => {
    const { event_id, ...rest } = validSolo;
    const result = createRegistrationSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// cancelRegistrationSchema
// ─────────────────────────────────────────────────────────────
describe('cancelRegistrationSchema', () => {
  it('should accept cancellation with reason', () => {
    const result = cancelRegistrationSchema.safeParse({ reason: 'Schedule conflict' });
    expect(result.success).toBe(true);
  });

  it('should accept cancellation without reason', () => {
    const result = cancelRegistrationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept empty reason', () => {
    const result = cancelRegistrationSchema.safeParse({ reason: '' });
    expect(result.success).toBe(true);
  });

  it('should reject reason longer than 500 characters', () => {
    const result = cancelRegistrationSchema.safeParse({ reason: 'A'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('should accept reason at max 500 characters', () => {
    const result = cancelRegistrationSchema.safeParse({ reason: 'A'.repeat(500) });
    expect(result.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// checkinSchema
// ─────────────────────────────────────────────────────────────
describe('checkinSchema', () => {
  it('should accept check-in with coordinates', () => {
    const result = checkinSchema.safeParse({ latitude: 52.5200, longitude: 13.4050 });
    expect(result.success).toBe(true);
  });

  it('should accept check-in without coordinates', () => {
    const result = checkinSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept check-in with only latitude', () => {
    const result = checkinSchema.safeParse({ latitude: 52.5200 });
    expect(result.success).toBe(true);
  });

  it('should accept check-in with only longitude', () => {
    const result = checkinSchema.safeParse({ longitude: 13.4050 });
    expect(result.success).toBe(true);
  });

  it('should reject non-numeric latitude', () => {
    const result = checkinSchema.safeParse({ latitude: 'berlin' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// updateRegistrationStatusSchema
// ─────────────────────────────────────────────────────────────
describe('updateRegistrationStatusSchema', () => {
  const validStatuses = [
    'pending_payment',
    'confirmed',
    'waitlisted',
    'cancelled',
    'refunded',
    'no_show',
  ];

  validStatuses.forEach((status) => {
    it(`should accept status '${status}'`, () => {
      const result = updateRegistrationStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid status', () => {
    const result = updateRegistrationStatusSchema.safeParse({ status: 'approved' });
    expect(result.success).toBe(false);
  });

  it('should reject missing status', () => {
    const result = updateRegistrationStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject empty status', () => {
    const result = updateRegistrationStatusSchema.safeParse({ status: '' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// setSeedSchema
// ─────────────────────────────────────────────────────────────
describe('setSeedSchema', () => {
  it('should accept valid seed number', () => {
    const result = setSeedSchema.safeParse({ seed_number: 1 });
    expect(result.success).toBe(true);
  });

  it('should accept high seed number', () => {
    const result = setSeedSchema.safeParse({ seed_number: 128 });
    expect(result.success).toBe(true);
  });

  it('should reject zero seed number', () => {
    const result = setSeedSchema.safeParse({ seed_number: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject negative seed number', () => {
    const result = setSeedSchema.safeParse({ seed_number: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer seed number', () => {
    const result = setSeedSchema.safeParse({ seed_number: 1.5 });
    expect(result.success).toBe(false);
  });

  it('should reject missing seed_number', () => {
    const result = setSeedSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});