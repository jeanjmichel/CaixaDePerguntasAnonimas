import { NextRequest, NextResponse } from 'next/server';
import { getContainer, ensureBootstrap } from '@/infrastructure/container';
import { extractAuthAdmin } from './authGuard';
import { checkMustChangePassword } from './mustChangePasswordGuard';

export interface AuthContext {
  adminId: string;
}

export function withAdminAuth(
  handler: (request: NextRequest, context: AuthContext, segmentData?: Record<string, unknown>) => Promise<NextResponse>,
) {
  return async (request: NextRequest, segmentData?: Record<string, unknown>): Promise<NextResponse> => {
    await ensureBootstrap();
    const { jwtService } = getContainer();

    const authResult = extractAuthAdmin(request, jwtService);
    if (!authResult) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const mustChangeResponse = checkMustChangePassword(authResult, request.nextUrl.pathname);
    if (mustChangeResponse) {
      return mustChangeResponse;
    }

    return handler(request, { adminId: authResult.adminId }, segmentData);
  };
}

export function withAdminAuthNoPasswordCheck(
  handler: (request: NextRequest, context: AuthContext, segmentData?: Record<string, unknown>) => Promise<NextResponse>,
) {
  return async (request: NextRequest, segmentData?: Record<string, unknown>): Promise<NextResponse> => {
    await ensureBootstrap();
    const { jwtService } = getContainer();

    const authResult = extractAuthAdmin(request, jwtService);
    if (!authResult) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    return handler(request, { adminId: authResult.adminId }, segmentData);
  };
}
