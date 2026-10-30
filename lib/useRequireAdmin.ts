'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';

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
    // no user yet: if a saved session exists it is still loading, so wait
    if (!sessionStorage.getItem('lodge_user')) {
      showToast('Please log in as admin', true);
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  return user && user.role === 'ADMIN' ? user : null;
}