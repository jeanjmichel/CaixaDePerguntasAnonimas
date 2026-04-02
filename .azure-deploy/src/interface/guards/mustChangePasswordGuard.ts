import { NextResponse } from 'next/server';

const EXEMPT_PATHS = [
  '/api/admin/auth/change-password',
  '/api/admin/auth/me',
  '/api/admin/auth/logout',
];

export function checkMustChangePassword(
  authResult: { mustChangePassword: boolean },
  requestPath: string,
): NextResponse | null {
  if (!authResult.mustChangePassword) {
    return null;
  }

  const isExempt = EXEMPT_PATHS.some((path) => requestPath.endsWith(path));
  if (isExempt) {
    return null;
  }

  return NextResponse.json(
    { error: { code: 'PASSWORD_CHANGE_REQUIRED', message: 'Password change required' } },
    { status: 403 },
  );
}
