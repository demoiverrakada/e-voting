const { registerSchema, loginSchema, verifyOtpSchema } = require('../../validators/organizationValidator');
describe('organizationValidator', () => {
  describe('registerSchema', () => {
    test('accepts valid registration data', () => {
      const { error } = registerSchema.validate({ name: 'Test Org', slug: 'test-org', email: 'admin@test.com', password: 'securepass123' });
      expect(error).toBeUndefined();
    });
    test('rejects missing name', () => {
      const { error } = registerSchema.validate({ slug: 'test-org', email: 'admin@test.com', password: 'securepass123' });
      expect(error).toBeDefined();
    });
    test('rejects invalid email', () => {
      const { error } = registerSchema.validate({ name: 'Test Org', slug: 'test-org', email: 'not-an-email', password: 'securepass123' });
      expect(error).toBeDefined();
    });
    test('rejects password shorter than 8 characters', () => {
      const { error } = registerSchema.validate({ name: 'Test Org', slug: 'test-org', email: 'admin@test.com', password: 'short' });
      expect(error).toBeDefined();
    });
    test('rejects missing password', () => {
      const { error } = registerSchema.validate({ name: 'Test Org', slug: 'test-org', email: 'admin@test.com' });
      expect(error).toBeDefined();
    });
    test('rejects invalid slug', () => {
      const { error } = registerSchema.validate({ name: 'Test Org', slug: 'Invalid Slug!', email: 'admin@test.com', password: 'securepass123' });
      expect(error).toBeDefined();
    });
  });
  describe('loginSchema', () => {
    test('accepts valid login data', () => {
      const { error } = loginSchema.validate({ email: 'admin@test.com', password: 'securepass123' });
      expect(error).toBeUndefined();
    });
    test('rejects missing email', () => {
      const { error } = loginSchema.validate({ password: 'securepass123' });
      expect(error).toBeDefined();
    });
    test('rejects missing password', () => {
      const { error } = loginSchema.validate({ email: 'admin@test.com' });
      expect(error).toBeDefined();
    });
  });
  describe('verifyOtpSchema', () => {
    test('accepts valid 6-digit OTP', () => {
      const { error } = verifyOtpSchema.validate({ email: 'admin@test.com', otp: '123456' });
      expect(error).toBeUndefined();
    });
    test('rejects OTP shorter than 6 digits', () => {
      const { error } = verifyOtpSchema.validate({ email: 'admin@test.com', otp: '123' });
      expect(error).toBeDefined();
    });
    test('rejects non-numeric OTP', () => {
      const { error } = verifyOtpSchema.validate({ email: 'admin@test.com', otp: 'abcdef' });
      expect(error).toBeDefined();
    });
    test('rejects OTP longer than 6 digits', () => {
      const { error } = verifyOtpSchema.validate({ email: 'admin@test.com', otp: '1234567' });
      expect(error).toBeDefined();
    });
    test('rejects missing OTP', () => {
      const { error } = verifyOtpSchema.validate({ email: 'admin@test.com' });
      expect(error).toBeDefined();
    });
  });
});
