'use client';

import React from 'react';
import Link from 'next/link';
import { useLodge } from '@/context/LodgeContext';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { money } from '@/lib/format';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#111827',
  CONFIRMED: '#111827',
  CANCELLED: '#111827',
  COMPLETED: '#111827',
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function AdminDashboardPage() {
  const admin = useRequireAdmin();
  const {
    initializing,
    rooms,
    meals,
    halls,
    bookings,
    hallBookings,
    mealOrders,
    feedbackList,
  } = useLodge();

  // Loading gate — provider hasn't hydrated from localStorage yet
  if (initializing) {
    return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  }
  // Auth gate — provider hydrated, but no admin session
  if (!admin) {
    return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;
  }

  const openFeedback = feedbackList.filter((f) => !f.resolved).length;
  const stats = [
    { n: rooms.length, l: 'Rooms' },
    { n: meals.length, l: 'Meals' },
    { n: halls.length, l: 'Halls' },
    { n: bookings.length, l: 'Room bookings' },
    { n: hallBookings.length, l: 'Hall bookings' },
    { n: mealOrders.length, l: 'Meal orders' },
    { n: openFeedback, l: 'Open feedback' },
  ];

  const paid = [
    ...bookings.filter((b) => b.paid).map((b) => ({ at: b.createdAt, amount: b.totalAmount })),
    ...hallBookings.filter((h) => h.paid).map((h) => ({ at: h.createdAt, amount: h.totalPrice })),
    ...mealOrders.filter((o) => o.paid).map((o) => ({ at: o.createdAt, amount: o.totalPrice })),
  ];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const revenue = days.map((d) => {
    const key = dayKey(d);
    return paid.filter((p) => dayKey(new Date(p.at)) === key).reduce((s, p) => s + p.amount, 0);
  });
  const maxRevenue = Math.max(...revenue, 1);
  const weekTotal = revenue.reduce((a, b) => a + b, 0);

  const allStatuses = [...bookings, ...hallBookings, ...mealOrders].map((x) => x.status);
  const total = allStatuses.length;
  const counts = Object.keys(STATUS_COLORS).map((s) => ({
    name: s,
    color: STATUS_COLORS[s],
    count: allStatuses.filter((x) => x === s).length,
  }));
  let acc = 0;
  const segments = counts
    .filter((c) => c.count > 0)
    .map((c) => {
      const from = acc;
      acc += (c.count / total) * 100;
      return `${c.color} ${from.toFixed(2)}% ${acc.toFixed(2)}%`;
    })
    .join(', ');

  const card =
    'bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow-sm)]';

  const tiles = [
    { label: ' Rooms', href: '/admin/rooms' },
    { label: ' Meals', href: '/admin/meals' },
    { label: ' Halls', href: '/admin/halls' },
    { label: ' Bookings', href: '/admin/bookings' },
    { label: '💬 Feedback', href: '/admin/feedback' },
  ];

  return (
    <div>
      <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Dashboard</h2>
      <p className="mt-1 mb-6 text-sm text-[var(--muted)]">Everything at a glance.</p>

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(170px,1fr))] mb-7">
        {stats.map((s) => (
          <div
            key={s.l}
            className={`${card} p-5 transition-all hover:-translate-y-[3px] hover:border-[var(--line-2)]`}
          >
            <div className="font-fraunces font-bold text-[34px] leading-none text-[var(--text)]">
              {s.n}
            </div>
            <div className="mt-2 text-xs font-bold uppercase tracking-[0.5px] text-[var(--muted)]">
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-[22px] grid-cols-1 md:grid-cols-2 mb-7">
        <div className={`${card} p-6`}>
          <h3 className="m-0 mb-1 font-fraunces font-bold text-lg">Weekly revenue</h3>
          <div className="text-xs text-[var(--muted)] mb-5">
            Paid bookings and orders · {money(weekTotal)} in the last 7 days
          </div>
          <div className="flex items-end gap-2.5 h-[140px]">
            {revenue.map((v, i) => (
              <div
                key={i}
                className="flex-1 h-full flex items-end"
                title={`${days[i].toLocaleDateString('en-GB', { weekday: 'short' })} · ${money(v)}`}
              >
                <div
                  className="w-full rounded-t-lg bg-[#111827] transition-all"
                  style={{
                    height: `${Math.max((v / maxRevenue) * 100, v > 0 ? 6 : 2)}%`,
                    opacity: v > 0 ? 1 : 0.15,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2.5 mt-2">
            {days.map((d, i) => (
              <div key={i} className="flex-1 text-center text-[11px] text-[var(--muted)]">
                {d.toLocaleDateString('en-GB', { weekday: 'short' })}
              </div>
            ))}
          </div>
        </div>

        <div className={`${card} p-6`}>
          <h3 className="m-0 mb-1 font-fraunces font-bold text-lg">Bookings by status</h3>
          <div className="text-xs text-[var(--muted)] mb-5">
            Rooms, halls and meals · {total} total
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div
              className="w-[140px] h-[140px] rounded-full grid place-items-center shrink-0"
              style={{
                background: total
                  ? `conic-gradient(${segments})`
                  : 'var(--line-2)',
              }}
            >
              <div className="w-[90px] h-[90px] rounded-full bg-[var(--bg)] flex flex-col items-center justify-center">
                <b className="font-fraunces text-[26px] leading-none">{total}</b>
                <span className="text-[11px] text-[var(--muted)]">Total</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              {counts.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-[4px] bg-[#111827]" />
                  {c.name.charAt(0) + c.name.slice(1).toLowerCase()} ·{' '}
                  {total ? Math.round((c.count / total) * 100) : 0}%
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="btn btn-ghost no-underline">
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}