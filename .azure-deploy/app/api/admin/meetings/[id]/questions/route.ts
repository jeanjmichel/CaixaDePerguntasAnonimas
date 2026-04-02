import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { withAdminAuth } from '@/interface/guards/withAdminAuth';
import { QuestionStatus } from '@/domain/enums/QuestionStatus';

async function resolveId(segmentData: unknown): Promise<string> {
  const seg = segmentData as { params: Promise<{ id: string }> };
  const params = await seg.params;
  return params.id;
}

const VALID_STATUSES = new Set(Object.values(QuestionStatus));

export const GET = withAdminAuth(async (
  request: NextRequest,
  _authContext,
  segmentData?,
) => {
  try {
    const meetingId = await resolveId(segmentData);
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'Submitted';

    if (!VALID_STATUSES.has(statusParam as QuestionStatus)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid question status' } },
        { status: 400 },
      );
    }

    const { listQuestionsByStatus } = getContainer();
    const data = await listQuestionsByStatus.execute(meetingId, statusParam as QuestionStatus);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
});
