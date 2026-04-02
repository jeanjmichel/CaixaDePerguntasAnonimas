import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { withAdminAuth } from '@/interface/guards/withAdminAuth';

export const GET = withAdminAuth(async () => {
  try {
    const { listMeetings } = getContainer();
    const data = await listMeetings.execute();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { createMeeting } = getContainer();

    const data = await createMeeting.execute({
      title: body.title,
      scheduledAt: body.scheduledAt,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ApplicationError) {
      const statusMap: Record<string, number> = {
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
});
