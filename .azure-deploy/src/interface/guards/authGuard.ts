import { NextRequest } from 'next/server';
import { IJwtService, JwtPayload } from '@/domain/ports/IJwtService';
import { AUTH_COOKIE_NAME } from '@/infrastructure/auth/JwtAuthService';

export function extractAuthAdmin(
  request: NextRequest,
  jwtService: IJwtService,
): JwtPayload | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return jwtService.verify(token);
}
