export interface JwtPayload {
  adminId: string;
  mustChangePassword: boolean;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict';
  path: string;
  maxAge: number;
}

export interface CookieConfig {
  name: string;
  value: string;
  options: CookieOptions;
}

export interface IJwtService {
  sign(payload: JwtPayload): string;
  verify(token: string): JwtPayload | null;
  getCookieConfig(token: string): CookieConfig;
  getClearCookieConfig(): CookieConfig;
}
