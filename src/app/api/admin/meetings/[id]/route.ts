import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { withAdminAuth } from '@/interface/guards/withAdminAuth';
import { meetingToDTO } from '@/application/use-cases/meetings/meetingMapper';

async function resolveId(segmentData: unknown): Promise<string> {
  const seg = segmentData as { params: Promise<{ id: string }> };
  const params = await seg.params;
  return params.id;
}

export const GET = withAdminAuth(async (
  _request: NextRequest,
  _authContext,
  segmentData?,
) => {
  try {
    const id = await resolveId(segmentData);
    const { meetingRepository } = getContainer();
    const meeting = await meetingRepository.findById(id);

    if (!meeting) {
      return NextResponse.json(
        { error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: meetingToDTO(meeting) });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
});

export const PUT = withAdminAuth(async (
  request: NextRequest,
  _authContext,
  segmentData?,
) => {
  try {
    const id = await resolveId(segmentData);
    const body = await request.json();
    const { updateMeeting } = getContainer();

    const data = await updateMeeting.execute(id, {
      title: body.title,
      scheduledAt: body.scheduledAt,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ApplicationError) {
      const statusMap: Record<string, number> = {
        INVALID_INPUT: 400,
        MEETING_NOT_FOUND: 404,
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
