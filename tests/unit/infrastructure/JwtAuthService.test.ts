import { JwtAuthService, AUTH_COOKIE_NAME } from '@/infrastructure/auth/JwtAuthService';

describe('JwtAuthService', () => {
  const secret = 'test-secret-key-for-testing-only';
  let service: JwtAuthService;

  beforeEach(() => {
    service = new JwtAuthService(secret, 8);
  });

  describe('sign', () => {
    it('should return a valid JWT token string', () => {
      const token = service.sign({ adminId: 'admin-1', mustChangePassword: false });

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verify', () => {
    it('should return payload for a valid token', () => {
      const token = service.sign({ adminId: 'admin-1', mustChangePassword: true });

      const payload = service.verify(token);

      expect(payload).not.toBeNull();
      expect(payload!.adminId).toBe('admin-1');
      expect(payload!.mustChangePassword).toBe(true);
    });

    it('should return null for an invalid token', () => {
      const payload = service.verify('invalid.token.here');

      expect(payload).toBeNull();
    });

    it('should return null for a token signed with a different secret', () => {
      const otherService = new JwtAuthService('different-secret', 8);
      const token = otherService.sign({ adminId: 'admin-1', mustChangePassword: false });

      const payload = service.verify(token);

      expect(payload).toBeNull();
    });

    it('should return null for an expired token', () => {
      const shortLivedService = new JwtAuthService(secret, 0);
      const token = shortLivedService.sign({ adminId: 'admin-1', mustChangePassword: false });

      const payload = shortLivedService.verify(token);

      expect(payload).toBeNull();
    });
  });

  describe('getCookieConfig', () => {
    it('should return correct httpOnly cookie configuration', () => {
      const config = service.getCookieConfig('my-token');

      expect(config.name).toBe(AUTH_COOKIE_NAME);
      expect(config.value).toBe('my-token');
      expect(config.options.httpOnly).toBe(true);
      expect(config.options.sameSite).toBe('strict');
      expect(config.options.path).toBe('/');
      expect(config.options.maxAge).toBe(8 * 3600);
    });
  });

  describe('getClearCookieConfig', () => {
    it('should return config that clears the cookie', () => {
      const config = service.getClearCookieConfig();

      expect(config.name).toBe(AUTH_COOKIE_NAME);
      expect(config.value).toBe('');
      expect(config.options.maxAge).toBe(0);
      expect(config.options.httpOnly).toBe(true);
    });
  });
});
