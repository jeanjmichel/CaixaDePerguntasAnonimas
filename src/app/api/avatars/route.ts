import { NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/container';

export async function GET() {
  try {
    const { listAvatars } = getContainer();
    const avatars = listAvatars.execute();
    return NextResponse.json({ data: avatars });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 },
    );
  }
}
