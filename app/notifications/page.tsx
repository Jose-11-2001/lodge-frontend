'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLodge } from '@/context/LodgeContext';
import { useRequireLogin } from '@/lib/useRequireLogin';
import { notificationsApi, NotificationDto } from '@/lib/api';

export default function NotificationsPage() {
  const user = useRequireLogin();
  const { initializing } = useLodge();
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    notificationsApi.list(0, 50)
      .then((page) => setItems(page.content))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  if (initializing) return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  if (!user) return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;

  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">
            Notifications
          </h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">
            {unread} unread · {items.length} total
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="btn btn-ghost">
              Mark all read
            </button>
          )}
          <Link href="/" className="btn btn-ghost no-underline">← Home</Link>
        </div>
      </div>

      {loading && <div className="text-[var(--muted)] text-sm">Loading…</div>}

      {error && (
        <div className="empty text-[#ff6b7e]">
          <div className="ico">⚠️</div>
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty">
          <div className="ico">🔔</div>
          No notifications yet. Bookings and payments will appear here.
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`card p-4 border rounded-xl flex items-start gap-3 ${
                n.read
                  ? 'bg-white border-[var(--line)]'
                  : 'bg-[#f0f9ff] border-blue-200'
              }`}
            >
              <div className="text-2xl">
                {n.type.includes('PAYMENT') ? '💳'
                  : n.type.includes('BOOKING') ? '📅'
                  : '🔔'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[var(--text)]">{n.title}</div>
                <div className="text-sm text-[var(--muted)] mt-1">{n.message}</div>
                <div className="text-xs text-[var(--muted)] mt-2">
                  {new Date(n.createdAt).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}