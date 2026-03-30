import { NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';

export async function GET() {
  try {
    const { getOpenMeeting } = getContainer();
    const meeting = await getOpenMeeting.execute();
    return NextResponse.json({ data: meeting });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
}
