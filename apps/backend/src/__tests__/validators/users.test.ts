import {
  updateProfileSchema,
  updateLanguageSchema,
  grantConsentSchema,
  createTeamSchema,
  updateTeamSchema,
  inviteTeamMemberSchema,
  friendRequestSchema,
  createVenueSchema,
  createSupportTicketSchema,
  ticketReplySchema,
  notificationSettingsSchema,
} from '../../validators/users';

// ─────────────────────────────────────────────────────────────
// updateProfileSchema
// ─────────────────────────────────────────────────────────────
describe('updateProfileSchema', () => {
  it('should accept valid profile update', () => {
    const result = updateProfileSchema.safeParse({
      first_name: 'Lukas',
      last_name: 'Gross',
      city: 'Berlin',
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty update (no changes)', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept nullable fields', () => {
    const result = updateProfileSchema.safeParse({
      display_name: null,
      phone: null,
      bio: null,
    });
    expect(result.success).toBe(true);
  });

  it('should reject first_name that is empty string', () => {
    const result = updateProfileSchema.safeParse({ first_name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject country code that is not 2 chars', () => {
    const result = updateProfileSchema.safeParse({ country: 'DEU' });
    expect(result.success).toBe(false);
  });

  it('should reject bio longer than 1000 chars', () => {
    const result = updateProfileSchema.safeParse({ bio: 'A'.repeat(1001) });
    expect(result.success).toBe(false);
  });

  it('should accept bio at exactly 1000 chars', () => {
    const result = updateProfileSchema.safeParse({ bio: 'A'.repeat(1000) });
    expect(result.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// updateLanguageSchema
// ─────────────────────────────────────────────────────────────
describe('updateLanguageSchema', () => {
  it('should accept valid language update', () => {
    const result = updateLanguageSchema.safeParse({ locale: 'de' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.manual_override).toBe(true);
    }
  });

  it('should accept explicit manual_override false', () => {
    const result = updateLanguageSchema.safeParse({ locale: 'en', manual_override: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.manual_override).toBe(false);
    }
  });

  it('should reject locale longer than 10 chars', () => {
    const result = updateLanguageSchema.safeParse({ locale: 'a'.repeat(11) });
    expect(result.success).toBe(false);
  });

  it('should reject missing locale', () => {
    const result = updateLanguageSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// grantConsentSchema
// ─────────────────────────────────────────────────────────────
describe('grantConsentSchema', () => {
  const validConsent = {
    consent_type: 'terms' as const,
    legal_document_version_id: 1,
    granted: true,
  };

  it('should accept valid consent grant', () => {
    const result = grantConsentSchema.safeParse(validConsent);
    expect(result.success).toBe(true);
  });

  const validTypes = ['terms', 'privacy', 'age_verification', 'media_consent', 'tournament_terms', 'marketing'];
  validTypes.forEach((type) => {
    it(`should accept consent_type '${type}'`, () => {
      const result = grantConsentSchema.safeParse({ ...validConsent, consent_type: type });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid consent_type', () => {
    const result = grantConsentSchema.safeParse({ ...validConsent, consent_type: 'cookies' });
    expect(result.success).toBe(false);
  });

  it('should accept granted: false (revoke)', () => {
    const result = grantConsentSchema.safeParse({ ...validConsent, granted: false });
    expect(result.success).toBe(true);
  });

  it('should reject non-positive version id', () => {
    const result = grantConsentSchema.safeParse({ ...validConsent, legal_document_version_id: 0 });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// createTeamSchema
// ─────────────────────────────────────────────────────────────
describe('createTeamSchema', () => {
  it('should accept valid team creation', () => {
    const result = createTeamSchema.safeParse({ name: 'Team Berlin' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sport_category).toBe('padel');
      expect(result.data.max_members).toBe(4);
    }
  });

  it('should accept team with all fields', () => {
    const result = createTeamSchema.safeParse({
      name: 'Pro Squad',
      sport_category: 'fifa',
      max_members: 6,
    });
    expect(result.success).toBe(true);
  });

  it('should reject name shorter than 2 chars', () => {
    const result = createTeamSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject name longer than 100 chars', () => {
    const result = createTeamSchema.safeParse({ name: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('should reject max_members less than 2', () => {
    const result = createTeamSchema.safeParse({ name: 'Team', max_members: 1 });
    expect(result.success).toBe(false);
  });

  it('should reject max_members greater than 10', () => {
    const result = createTeamSchema.safeParse({ name: 'Team', max_members: 11 });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// updateTeamSchema
// ─────────────────────────────────────────────────────────────
describe('updateTeamSchema', () => {
  it('should accept partial team update', () => {
    const result = updateTeamSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('should accept empty update', () => {
    const result = updateTeamSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject invalid max_members', () => {
    const result = updateTeamSchema.safeParse({ max_members: 0 });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// inviteTeamMemberSchema / friendRequestSchema
// ─────────────────────────────────────────────────────────────
describe('inviteTeamMemberSchema', () => {
  it('should accept valid user_id', () => {
    const result = inviteTeamMemberSchema.safeParse({ user_id: 5 });
    expect(result.success).toBe(true);
  });

  it('should reject non-positive user_id', () => {
    const result = inviteTeamMemberSchema.safeParse({ user_id: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject missing user_id', () => {
    const result = inviteTeamMemberSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('friendRequestSchema', () => {
  it('should accept valid user_id', () => {
    const result = friendRequestSchema.safeParse({ user_id: 10 });
    expect(result.success).toBe(true);
  });

  it('should reject negative user_id', () => {
    const result = friendRequestSchema.safeParse({ user_id: -1 });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// createVenueSchema
// ─────────────────────────────────────────────────────────────
describe('createVenueSchema', () => {
  const validVenue = {
    name: 'Padel Club Berlin',
    address_street: 'Musterstraße 42',
    address_city: 'Berlin',
    address_zip: '10115',
  };

  it('should accept valid venue creation', () => {
    const result = createVenueSchema.safeParse(validVenue);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.address_country).toBe('DE');
      expect(result.data.is_indoor).toBe(false);
      expect(result.data.is_outdoor).toBe(false);
      expect(result.data.is_partner_venue).toBe(false);
    }
  });

  it('should accept venue with coordinates', () => {
    const result = createVenueSchema.safeParse({
      ...validVenue,
      latitude: 52.5200,
      longitude: 13.4050,
    });
    expect(result.success).toBe(true);
  });

  it('should accept venue with full details', () => {
    const result = createVenueSchema.safeParse({
      ...validVenue,
      description: 'Premier padel venue in Berlin',
      is_indoor: true,
      is_partner_venue: true,
      partner_website_url: 'https://padel-berlin.de',
      partner_booking_url: 'https://padel-berlin.de/book',
      phone: '+49 30 123456',
      email: 'info@padel-berlin.de',
      image_url: 'https://images.turneo.de/venues/berlin.jpg',
      operating_hours: { monday: '08:00-22:00', tuesday: '08:00-22:00' },
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const result = createVenueSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('should reject name shorter than 2 chars', () => {
    const result = createVenueSchema.safeParse({ ...validVenue, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject latitude out of range', () => {
    const result = createVenueSchema.safeParse({ ...validVenue, latitude: 91 });
    expect(result.success).toBe(false);
  });

  it('should reject longitude out of range', () => {
    const result = createVenueSchema.safeParse({ ...validVenue, longitude: 181 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid partner_website_url', () => {
    const result = createVenueSchema.safeParse({ ...validVenue, partner_website_url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = createVenueSchema.safeParse({ ...validVenue, email: 'not-email' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// createSupportTicketSchema
// ─────────────────────────────────────────────────────────────
describe('createSupportTicketSchema', () => {
  const validTicket = {
    category: 'general' as const,
    subject: 'Need help',
    message: 'I have a question about tournament registration.',
  };

  it('should accept valid support ticket', () => {
    const result = createSupportTicketSchema.safeParse(validTicket);
    expect(result.success).toBe(true);
  });

  it('should accept ticket with event_id', () => {
    const result = createSupportTicketSchema.safeParse({ ...validTicket, event_id: 5 });
    expect(result.success).toBe(true);
  });

  const validCategories = ['general', 'payment', 'refund', 'tournament', 'technical', 'account', 'other'];
  validCategories.forEach((cat) => {
    it(`should accept category '${cat}'`, () => {
      const result = createSupportTicketSchema.safeParse({ ...validTicket, category: cat });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid category', () => {
    const result = createSupportTicketSchema.safeParse({ ...validTicket, category: 'billing' });
    expect(result.success).toBe(false);
  });

  it('should reject subject shorter than 3 chars', () => {
    const result = createSupportTicketSchema.safeParse({ ...validTicket, subject: 'Hi' });
    expect(result.success).toBe(false);
  });

  it('should reject message shorter than 10 chars', () => {
    const result = createSupportTicketSchema.safeParse({ ...validTicket, message: 'Help' });
    expect(result.success).toBe(false);
  });

  it('should reject message longer than 5000 chars', () => {
    const result = createSupportTicketSchema.safeParse({ ...validTicket, message: 'A'.repeat(5001) });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// ticketReplySchema
// ─────────────────────────────────────────────────────────────
describe('ticketReplySchema', () => {
  it('should accept valid reply', () => {
    const result = ticketReplySchema.safeParse({ message: 'Thank you for the response.' });
    expect(result.success).toBe(true);
  });

  it('should reject empty message', () => {
    const result = ticketReplySchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });

  it('should reject message longer than 5000 chars', () => {
    const result = ticketReplySchema.safeParse({ message: 'A'.repeat(5001) });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// notificationSettingsSchema
// ─────────────────────────────────────────────────────────────
describe('notificationSettingsSchema', () => {
  it('should accept valid iOS push token', () => {
    const result = notificationSettingsSchema.safeParse({
      push_token: 'ExponentPushToken[abc123]',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platform).toBe('ios');
    }
  });

  it('should accept android platform', () => {
    const result = notificationSettingsSchema.safeParse({
      push_token: 'fcm_token_123',
      platform: 'android',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty push_token', () => {
    const result = notificationSettingsSchema.safeParse({ push_token: '' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid platform', () => {
    const result = notificationSettingsSchema.safeParse({
      push_token: 'token',
      platform: 'windows',
    });
    expect(result.success).toBe(false);
  });

  it('should reject push_token longer than 500 chars', () => {
    const result = notificationSettingsSchema.safeParse({ push_token: 'A'.repeat(501) });
    expect(result.success).toBe(false);
  });
});