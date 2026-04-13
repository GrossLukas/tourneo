import {
  registerSchema,
  loginSchema,
  appleSignInSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../validators/auth';

// ─────────────────────────────────────────────────────────────
// registerSchema
// ─────────────────────────────────────────────────────────────
describe('registerSchema', () => {
  const validData = {
    email: 'lukas@turneo.de',
    password: 'SecurePass1',
    first_name: 'Lukas',
    last_name: 'Gross',
    date_of_birth: '1995-06-15',
    consent_terms: true,
    consent_privacy: true,
    consent_age: true,
    terms_version_id: 1,
    privacy_version_id: 1,
  };

  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should apply default values for optional fields', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toBe('DE');
      expect(result.data.locale).toBe('de');
      expect(result.data.consent_media).toBe(false);
    }
  });

  it('should accept registration with all optional fields', () => {
    const fullData = {
      ...validData,
      display_name: 'LukasG',
      city: 'Berlin',
      region: 'Berlin',
      country: 'AT',
      locale: 'en',
      consent_media: true,
    };
    const result = registerSchema.safeParse(fullData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe('LukasG');
      expect(result.data.city).toBe('Berlin');
      expect(result.data.country).toBe('AT');
    }
  });

  // Email validation
  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('should reject empty email', () => {
    const result = registerSchema.safeParse({ ...validData, email: '' });
    expect(result.success).toBe(false);
  });

  // Password validation
  it('should reject password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'Ab1' });
    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'lowercase1' });
    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'UPPERCASE1' });
    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'NoNumbers!' });
    expect(result.success).toBe(false);
  });

  it('should reject password longer than 128 characters', () => {
    const longPassword = 'Aa1' + 'x'.repeat(126);
    const result = registerSchema.safeParse({ ...validData, password: longPassword });
    expect(result.success).toBe(false);
  });

  // Name validation
  it('should reject empty first name', () => {
    const result = registerSchema.safeParse({ ...validData, first_name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject empty last name', () => {
    const result = registerSchema.safeParse({ ...validData, last_name: '' });
    expect(result.success).toBe(false);
  });

  // Date of birth validation
  it('should reject invalid date format', () => {
    const result = registerSchema.safeParse({ ...validData, date_of_birth: '15/06/1995' });
    expect(result.success).toBe(false);
  });

  it('should reject underage user (under 18)', () => {
    const today = new Date();
    const recentDate = `${today.getFullYear() - 10}-01-01`;
    const result = registerSchema.safeParse({ ...validData, date_of_birth: recentDate });
    expect(result.success).toBe(false);
  });

  it('should accept exactly 18 years old', () => {
    const today = new Date();
    const eighteenYearsAgo = `${today.getFullYear() - 18}-01-01`;
    const result = registerSchema.safeParse({ ...validData, date_of_birth: eighteenYearsAgo });
    expect(result.success).toBe(true);
  });

  // Consent validation
  it('should reject without terms consent', () => {
    const result = registerSchema.safeParse({ ...validData, consent_terms: false });
    expect(result.success).toBe(false);
  });

  it('should reject without privacy consent', () => {
    const result = registerSchema.safeParse({ ...validData, consent_privacy: false });
    expect(result.success).toBe(false);
  });

  it('should reject without age consent', () => {
    const result = registerSchema.safeParse({ ...validData, consent_age: false });
    expect(result.success).toBe(false);
  });

  // Country validation
  it('should reject country code not exactly 2 chars', () => {
    const result = registerSchema.safeParse({ ...validData, country: 'DEU' });
    expect(result.success).toBe(false);
  });

  // Version IDs
  it('should reject non-positive terms_version_id', () => {
    const result = registerSchema.safeParse({ ...validData, terms_version_id: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject non-positive privacy_version_id', () => {
    const result = registerSchema.safeParse({ ...validData, privacy_version_id: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// loginSchema
// ─────────────────────────────────────────────────────────────
describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@turneo.de',
      password: 'mypassword',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: 'test' });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing email', () => {
    const result = loginSchema.safeParse({ password: 'test' });
    expect(result.success).toBe(false);
  });

  it('should reject missing password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// appleSignInSchema
// ─────────────────────────────────────────────────────────────
describe('appleSignInSchema', () => {
  it('should accept valid Apple sign-in data', () => {
    const result = appleSignInSchema.safeParse({
      identity_token: 'eyJhbGciOiJSUzI1NiJ9.test',
      authorization_code: 'auth_code_123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept with optional name and email', () => {
    const result = appleSignInSchema.safeParse({
      identity_token: 'token',
      authorization_code: 'code',
      first_name: 'Lukas',
      last_name: 'Gross',
      email: 'lukas@apple.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty identity_token', () => {
    const result = appleSignInSchema.safeParse({
      identity_token: '',
      authorization_code: 'code',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty authorization_code', () => {
    const result = appleSignInSchema.safeParse({
      identity_token: 'token',
      authorization_code: '',
    });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// refreshTokenSchema
// ─────────────────────────────────────────────────────────────
describe('refreshTokenSchema', () => {
  it('should accept valid refresh token', () => {
    const result = refreshTokenSchema.safeParse({ refresh_token: 'some-jwt-token' });
    expect(result.success).toBe(true);
  });

  it('should reject empty refresh token', () => {
    const result = refreshTokenSchema.safeParse({ refresh_token: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing refresh token', () => {
    const result = refreshTokenSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// forgotPasswordSchema
// ─────────────────────────────────────────────────────────────
describe('forgotPasswordSchema', () => {
  it('should accept valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@turneo.de' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-email' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// resetPasswordSchema
// ─────────────────────────────────────────────────────────────
describe('resetPasswordSchema', () => {
  it('should accept valid reset data', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'reset-token-uuid',
      password: 'NewSecure1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject weak password', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'token',
      password: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty token', () => {
    const result = resetPasswordSchema.safeParse({
      token: '',
      password: 'NewSecure1',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase in reset', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'token',
      password: 'onlylower1',
    });
    expect(result.success).toBe(false);
  });
});