'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';
import { hasSavedSession } from '@/lib/auth';

export function useRequireAdmin() {
  const { user, showToast } = useLodge();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role !== 'ADMIN') {
        showToast('Admins only', true);
        router.push('/');
      }
      return;
    }
    // No user yet. Only redirect when there is truly no session.
    if (!hasSavedSession()) {
      showToast('Please log in as admin', true);
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  return user && user.role === 'ADMIN' ? user : null;
}