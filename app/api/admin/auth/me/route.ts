import { NextRequest, NextResponse } from 'next/server';
import { getContainer, ensureBootstrap } from '@/infrastructure/container';
import { extractAuthAdmin } from '@/interface/guards/authGuard';
import { ApplicationError } from '@/application/errors/ApplicationError';

export async function GET(request: NextRequest) {
  await ensureBootstrap();
  const { jwtService, getCurrentAdmin } = getContainer();

  const authResult = extractAuthAdmin(request, jwtService);
  if (!authResult) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 },
    );
  }

  try {
    const admin = await getCurrentAdmin.execute(authResult.adminId);

    return NextResponse.json({ data: admin }, { status: 200 });
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
}
