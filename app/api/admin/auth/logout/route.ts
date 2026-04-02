import { NextRequest, NextResponse } from 'next/server';
import { getContainer, ensureBootstrap } from '@/infrastructure/container';
import { extractAuthAdmin } from '@/interface/guards/authGuard';

export async function POST(request: NextRequest) {
  await ensureBootstrap();
  const { jwtService } = getContainer();

  const authResult = extractAuthAdmin(request, jwtService);
  if (!authResult) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 },
    );
  }

  const cookieConfig = jwtService.getClearCookieConfig();

  const response = NextResponse.json(
    { data: { message: 'Logged out successfully' } },
    { status: 200 },
  );

  response.cookies.set(cookieConfig.name, cookieConfig.value, cookieConfig.options);

  return response;
}
