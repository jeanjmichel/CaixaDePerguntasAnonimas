import jwt from 'jsonwebtoken';
import { IJwtService, JwtPayload, CookieConfig } from '@/domain/ports/IJwtService';

export const AUTH_COOKIE_NAME = 'auth_token';

export class JwtAuthService implements IJwtService {
  private readonly secret: string;
  private readonly expirationHours: number;

  constructor(secret: string, expirationHours: number) {
    this.secret = secret;
    this.expirationHours = expirationHours;
  }

  sign(payload: JwtPayload): string {
    return jwt.sign(
      { adminId: payload.adminId, mustChangePassword: payload.mustChangePassword },
      this.secret,
      { expiresIn: `${this.expirationHours}h` },
    );
  }

  verify(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
      if (typeof decoded.adminId !== 'string' || typeof decoded.mustChangePassword !== 'boolean') {
        return null;
      }
      return {
        adminId: decoded.adminId,
        mustChangePassword: decoded.mustChangePassword,
      };
    } catch {
      return null;
    }
  }

  getCookieConfig(token: string): CookieConfig {
    return {
      name: AUTH_COOKIE_NAME,
      value: token,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: this.expirationHours * 3600,
      },
    };
  }

  getClearCookieConfig(): CookieConfig {
    return {
      name: AUTH_COOKIE_NAME,
      value: '',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      },
    };
  }
}
