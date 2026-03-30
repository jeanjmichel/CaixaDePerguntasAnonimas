'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminResponseDTO } from '@/application/dtos/AdminResponseDTO';
import { apiFetch } from '@/interface/hooks/useApi';

interface UseAuthResult {
  admin: AdminResponseDTO | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export function useAuth(options?: { skipPasswordCheck?: boolean }): UseAuthResult {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const result = await apiFetch<AdminResponseDTO>('/api/admin/auth/me');

      if (result.error) {
        if (result.error.code === 'UNAUTHORIZED') {
          router.replace('/admin/login');
          return;
        }
        if (result.error.code === 'PASSWORD_CHANGE_REQUIRED' && !options?.skipPasswordCheck) {
          router.replace('/admin/change-password');
          return;
        }
      }

      if (result.data) {
        if (result.data.mustChangePassword && !options?.skipPasswordCheck) {
          router.replace('/admin/change-password');
          return;
        }
        setAdmin(result.data);
      }

      setLoading(false);
    }

    check();
  }, [router, options?.skipPasswordCheck]);

  const logout = useCallback(async () => {
    await apiFetch('/api/admin/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  }, [router]);

  return { admin, loading, logout };
}
