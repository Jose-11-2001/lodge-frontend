'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';

export function useRequireLogin() {
  const { user, showToast } = useLodge();
  const router = useRouter();

  useEffect(() => {
    // the saved session is checked too, so refreshing the page doesn't log you out
    if (!user && !sessionStorage.getItem('lodge_user')) {
      showToast('Please log in first', true);
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  return user;
}