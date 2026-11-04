'use client';

import React from 'react';
import Link from 'next/link';
import { useLodge } from '@/context/LodgeContext';
import { useRequireLogin } from '@/lib/useRequireLogin';

export default function NotificationsPage() {
  const user = useRequireLogin();
  const { initializing } = useLodge();

  if (initializing) return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  if (!user) return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">
            Notifications
          </h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">
            Updates about your bookings.
          </p>
        </div>
        <Link href="/" className="btn btn-ghost no-underline">← Home</Link>
      </div>

      <div className="empty">
        <div className="ico">🔔</div>
        Notifications aren&apos;t backed by the API yet — nothing to show.
      </div>
    </div>
  );
}