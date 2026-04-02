import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { withAdminAuth, AuthContext } from '@/interface/guards/withAdminAuth';

async function resolveId(segmentData: unknown): Promise<string> {
  const seg = segmentData as { params: Promise<{ id: string }> };
  const params = await seg.params;
  return params.id;
}

export const POST = withAdminAuth(async (
  request: NextRequest,
  authContext: AuthContext,
  segmentData?,
) => {
  try {
    const id = await resolveId(segmentData);
    const body = await request.json();
    const { resetAdminPassword } = getContainer();

    await resetAdminPassword.execute(id, authContext.adminId, body.newPassword);

    return NextResponse.json({ data: { message: 'Password reset successfully' } });
  } catch (error) {
    if (error instanceof ApplicationError) {
      const statusMap: Record<string, number> = {
        ADMIN_NOT_FOUND: 404,
        CANNOT_MODIFY_SELF: 403,
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
