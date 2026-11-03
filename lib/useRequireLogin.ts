'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';
import { hasSavedSession } from '@/lib/auth';

export function useRequireLogin() {
  const { user, showToast } = useLodge();
  const router = useRouter();

  useEffect(() => {
    // The API layer stores the token in localStorage (see api.ts / lib/auth.ts).
    // If a token exists, the context is still hydrating — wait, don't redirect.
    if (!user && !hasSavedSession()) {
      showToast('Please log in first', true);
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  return user;
}