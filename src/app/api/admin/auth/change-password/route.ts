import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';
import { extractAuthAdmin } from '@/interface/guards/authGuard';
import { ApplicationError } from '@/application/errors/ApplicationError';

export async function POST(request: NextRequest) {
  const { jwtService, changeOwnPassword } = getContainer();

  const authResult = extractAuthAdmin(request, jwtService);
  if (!authResult) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    await changeOwnPassword.execute(authResult.adminId, {
      oldPassword: body.oldPassword,
      newPassword: body.newPassword,
    });

    const newToken = jwtService.sign({
      adminId: authResult.adminId,
      mustChangePassword: false,
    });
    const cookieConfig = jwtService.getCookieConfig(newToken);

    const response = NextResponse.json(
      { data: { message: 'Password changed successfully' } },
      { status: 200 },
    );

    response.cookies.set(cookieConfig.name, cookieConfig.value, cookieConfig.options);

    return response;
  } catch (error) {
    if (error instanceof ApplicationError) {
      const statusMap: Record<string, number> = {
        INVALID_INPUT: 400,
        INVALID_CURRENT_PASSWORD: 400,
        ADMIN_NOT_FOUND: 404,
      };

      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: statusMap[error.code] || 400 },
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
}
