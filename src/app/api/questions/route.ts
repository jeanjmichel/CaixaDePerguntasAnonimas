import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { hashIp } from '@/infrastructure/security/hashIp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const ipHash = hashIp(ip);

    const { submitQuestion } = getContainer();

    const result = await submitQuestion.execute(
      {
        meetingId: body.meetingId,
        text: body.text,
        avatarId: body.avatarId,
      },
      ipHash,
    );

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ApplicationError) {
      const statusMap: Record<string, number> = {
        INVALID_INPUT: 400,
        MEETING_NOT_FOUND: 404,
        MEETING_CLOSED: 409,
        RATE_LIMITED: 429,
      };

      const status = statusMap[error.code] || 400;

      const headers: Record<string, string> = {};
      if (error.code === 'RATE_LIMITED') {
        const retryAfterMs = (error as ApplicationError & { retryAfterMs?: number }).retryAfterMs;
        if (retryAfterMs) {
          headers['Retry-After'] = String(Math.ceil(retryAfterMs / 1000));
        }
      }

      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status, headers },
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
}
