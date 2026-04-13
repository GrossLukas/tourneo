import {
  createEventSchema,
  updateEventSchema,
  eventFiltersSchema,
} from '../../validators/events';

// ─────────────────────────────────────────────────────────────
// createEventSchema
// ─────────────────────────────────────────────────────────────
describe('createEventSchema', () => {
  const validEvent = {
    title: 'Padel Open Berlin 2025',
    description: 'The biggest Padel tournament in Berlin',
    sport_category: 'padel' as const,
    event_type: 'tournament' as const,
    venue_id: 1,
    start_date: '2025-08-15T09:00:00.000Z',
    end_date: '2025-08-15T18:00:00.000Z',
    registration_opens_at: '2025-07-01T00:00:00.000Z',
    registration_closes_at: '2025-08-14T23:59:00.000Z',
    format: 'doubles' as const,
    elimination_type: 'single_elimination' as const,
    max_participants: 32,
    entry_fee_cents: 3500,
    level: 'open' as const,
  };

  it('should accept valid event data', () => {
    const result = createEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it('should apply default values', () => {
    const result = createEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('EUR');
      expect(result.data.total_prize_pool_cents).toBe(0);
      expect(result.data.has_third_place_match).toBe(true);
      expect(result.data.access_type).toBe('public');
      expect(result.data.has_food_drinks).toBe(false);
      expect(result.data.has_streaming).toBe(false);
    }
  });

  it('should accept event with prize distribution', () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      total_prize_pool_cents: 100000,
      prize_distribution: [
        { place: 1, amount_cents: 50000, label: '1st Place' },
        { place: 2, amount_cents: 30000, label: '2nd Place' },
        { place: 3, amount_cents: 20000, label: '3rd Place' },
      ],
    });
    expect(result.success).toBe(true);
  });

  // Title validation
  it('should reject title shorter than 3 characters', () => {
    const result = createEventSchema.safeParse({ ...validEvent, title: 'AB' });
    expect(result.success).toBe(false);
  });

  it('should reject title longer than 255 characters', () => {
    const result = createEventSchema.safeParse({ ...validEvent, title: 'A'.repeat(256) });
    expect(result.success).toBe(false);
  });

  // Venue validation
  it('should reject non-positive venue_id', () => {
    const result = createEventSchema.safeParse({ ...validEvent, venue_id: 0 });
    expect(result.success).toBe(false);
  });

  // Max participants validation
  it('should reject fewer than 4 participants', () => {
    const result = createEventSchema.safeParse({ ...validEvent, max_participants: 2 });
    expect(result.success).toBe(false);
  });

  it('should reject more than 128 participants', () => {
    const result = createEventSchema.safeParse({ ...validEvent, max_participants: 256 });
    expect(result.success).toBe(false);
  });

  it('should accept 4 participants (minimum)', () => {
    const result = createEventSchema.safeParse({ ...validEvent, max_participants: 4 });
    expect(result.success).toBe(true);
  });

  it('should accept 128 participants (maximum)', () => {
    const result = createEventSchema.safeParse({ ...validEvent, max_participants: 128 });
    expect(result.success).toBe(true);
  });

  // Entry fee validation
  it('should reject negative entry fee', () => {
    const result = createEventSchema.safeParse({ ...validEvent, entry_fee_cents: -100 });
    expect(result.success).toBe(false);
  });

  it('should accept zero entry fee (free event)', () => {
    const result = createEventSchema.safeParse({ ...validEvent, entry_fee_cents: 0 });
    expect(result.success).toBe(true);
  });

  // Date validation
  it('should reject end date before start date', () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      start_date: '2025-08-15T18:00:00.000Z',
      end_date: '2025-08-15T09:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('should reject registration close after start date', () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      registration_closes_at: '2025-08-16T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('should reject registration opens after registration closes', () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      registration_opens_at: '2025-08-15T00:00:00.000Z',
      registration_closes_at: '2025-08-14T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  // Enum validations
  it('should reject invalid sport_category', () => {
    const result = createEventSchema.safeParse({ ...validEvent, sport_category: 'tennis' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid event_type', () => {
    const result = createEventSchema.safeParse({ ...validEvent, event_type: 'league' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid format', () => {
    const result = createEventSchema.safeParse({ ...validEvent, format: 'triples' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid level', () => {
    const result = createEventSchema.safeParse({ ...validEvent, level: 'pro' });
    expect(result.success).toBe(false);
  });

  // Invalid datetime strings
  it('should reject invalid datetime format', () => {
    const result = createEventSchema.safeParse({ ...validEvent, start_date: '2025-08-15' });
    expect(result.success).toBe(false);
  });

  // Currency validation
  it('should reject currency not exactly 3 chars', () => {
    const result = createEventSchema.safeParse({ ...validEvent, currency: 'EURO' });
    expect(result.success).toBe(false);
  });

  // Banner URL
  it('should reject invalid banner URL', () => {
    const result = createEventSchema.safeParse({ ...validEvent, banner_image_url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('should accept valid banner URL', () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      banner_image_url: 'https://images.turneo.de/events/banner.jpg',
    });
    expect(result.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// updateEventSchema
// ─────────────────────────────────────────────────────────────
describe('updateEventSchema', () => {
  it('should accept partial updates', () => {
    const result = updateEventSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object (no changes)', () => {
    const result = updateEventSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept status update', () => {
    const result = updateEventSchema.safeParse({ status: 'published' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = updateEventSchema.safeParse({ status: 'invalid_status' });
    expect(result.success).toBe(false);
  });

  it('should accept multiple field updates', () => {
    const result = updateEventSchema.safeParse({
      title: 'New Title',
      max_participants: 64,
      status: 'registration_open',
    });
    expect(result.success).toBe(true);
  });

  it('should still validate field constraints in partial update', () => {
    const result = updateEventSchema.safeParse({ title: 'AB' }); // too short
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// eventFiltersSchema
// ─────────────────────────────────────────────────────────────
describe('eventFiltersSchema', () => {
  it('should accept empty filters (all defaults)', () => {
    const result = eventFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.per_page).toBe(20);
      expect(result.data.sort_by).toBe('date');
      expect(result.data.sort_order).toBe('asc');
    }
  });

  it('should accept valid filters', () => {
    const result = eventFiltersSchema.safeParse({
      sport_category: 'padel',
      city: 'Berlin',
      level: 'intermediate',
      page: '2',
      per_page: '10',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sport_category).toBe('padel');
      expect(result.data.city).toBe('Berlin');
      expect(result.data.page).toBe(2);
      expect(result.data.per_page).toBe(10);
    }
  });

  it('should coerce string numbers to actual numbers', () => {
    const result = eventFiltersSchema.safeParse({ page: '3', per_page: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.per_page).toBe(25);
    }
  });

  it('should coerce boolean strings', () => {
    // z.coerce.boolean() uses Boolean() coercion: Boolean("false") === true
    // Only empty string, 0, null, undefined, NaN coerce to false
    const result = eventFiltersSchema.safeParse({ is_indoor: 'true', has_availability: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_indoor).toBe(true);
      expect(result.data.has_availability).toBe(false);
    }
  });

  it('should reject per_page exceeding 50', () => {
    const result = eventFiltersSchema.safeParse({ per_page: '100' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sort_by', () => {
    const result = eventFiltersSchema.safeParse({ sort_by: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sort_order', () => {
    const result = eventFiltersSchema.safeParse({ sort_order: 'random' });
    expect(result.success).toBe(false);
  });

  it('should accept fee range filters', () => {
    const result = eventFiltersSchema.safeParse({ min_fee: '0', max_fee: '5000' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.min_fee).toBe(0);
      expect(result.data.max_fee).toBe(5000);
    }
  });
});