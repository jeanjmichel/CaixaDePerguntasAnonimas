import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { withAdminAuth } from '@/interface/guards/withAdminAuth';

async function resolveId(segmentData: unknown): Promise<string> {
  const seg = segmentData as { params: Promise<{ id: string }> };
  const params = await seg.params;
  return params.id;
}

export const POST = withAdminAuth(async (
  _request: NextRequest,
  _authContext,
  segmentData?,
) => {
  try {
    const id = await resolveId(segmentData);
    const { closeMeetingForSubmissions } = getContainer();

    const data = await closeMeetingForSubmissions.execute(id);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ApplicationError) {
      const statusMap: Record<string, number> = {
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
