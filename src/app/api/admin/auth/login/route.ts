import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';
import { ApplicationError } from '@/application/errors/ApplicationError';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { login, jwtService } = getContainer();

    const result = await login.execute({
      username: body.username,
      password: body.password,
    });

    const cookieConfig = jwtService.getCookieConfig(result.token);

    const response = NextResponse.json(
      { data: { mustChangePassword: result.mustChangePassword, admin: result.admin } },
      { status: 200 },
    );

    response.cookies.set(cookieConfig.name, cookieConfig.value, cookieConfig.options);

    return response;
  } catch (error) {
    if (error instanceof ApplicationError) {
      const statusMap: Record<string, number> = {
        INVALID_CREDENTIALS: 401,
        INVALID_INPUT: 400,
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
