describe('validateEnv', () => {
  const ORIGINAL_ENV = { ...process.env };
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('is a no-op outside of production', () => {
    process.env.NODE_ENV = 'development';
    const { validateEnv } = require('../../config/environment');
    expect(() => validateEnv()).not.toThrow();
  });

  it('throws when JWT secrets are missing in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx';
    process.env.APP_URL = 'https://app';
    process.env.ADMIN_URL = 'https://admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.JWT_ACCESS_SECRET = '';
    process.env.JWT_REFRESH_SECRET = '';
    const { validateEnv } = require('../../config/environment');
    expect(() => validateEnv()).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('throws when JWT secrets still match the dev fallback in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'dev-access-secret-change-me';
    process.env.JWT_REFRESH_SECRET = 'dev-refresh-secret-change-me';
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx';
    process.env.APP_URL = 'https://app';
    process.env.ADMIN_URL = 'https://admin';
    process.env.DB_PASSWORD = 'secret';
    const { validateEnv } = require('../../config/environment');
    expect(() => validateEnv()).toThrow(/development fallback/);
  });

  it('throws when access and refresh secrets are identical', () => {
    process.env.NODE_ENV = 'production';
    const same = 'a'.repeat(40);
    process.env.JWT_ACCESS_SECRET = same;
    process.env.JWT_REFRESH_SECRET = same;
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx';
    process.env.APP_URL = 'https://app';
    process.env.ADMIN_URL = 'https://admin';
    process.env.DB_PASSWORD = 'secret';
    const { validateEnv } = require('../../config/environment');
    expect(() => validateEnv()).toThrow(/must differ/);
  });

  it('rejects short JWT secrets in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'short';
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(40);
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx';
    process.env.APP_URL = 'https://app';
    process.env.ADMIN_URL = 'https://admin';
    process.env.DB_PASSWORD = 'secret';
    const { validateEnv } = require('../../config/environment');
    expect(() => validateEnv()).toThrow(/32 characters/);
  });

  it('passes with a fully-populated production environment', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(40);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(40);
    process.env.STRIPE_SECRET_KEY = 'sk_live_xxx';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx';
    process.env.APP_URL = 'https://app.tourneo.de';
    process.env.ADMIN_URL = 'https://admin.tourneo.de';
    process.env.DB_PASSWORD = 'strong-password';
    const { validateEnv } = require('../../config/environment');
    expect(() => validateEnv()).not.toThrow();
  });
});
