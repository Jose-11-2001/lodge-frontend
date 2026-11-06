'use client';

import React from 'react';
import Link from 'next/link';
import { useLodge } from '@/context/LodgeContext';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { money } from '@/lib/format';

// Use the CSS variables we defined in globals.css
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--status-pending)',
  CONFIRMED: 'var(--status-confirmed)',
  CANCELLED: 'var(--status-cancelled)',
  COMPLETED: 'var(--status-completed)',
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

  if (initializing) {
    return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  }
  if (!admin) {
    return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;
  }

  const openFeedback = feedbackList.filter((f) => !f.resolved).length;

  // Stat cards with colors, no emojis
  const stats = [
    { n: rooms.length, l: 'Rooms', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { n: meals.length, l: 'Meals', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { n: halls.length, l: 'Halls', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { n: bookings.length, l: 'Room Bookings', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { n: hallBookings.length, l: 'Hall Bookings', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
    { n: mealOrders.length, l: 'Meal Orders', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
    { n: openFeedback, l: 'Open Feedback', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
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

  const card = 'bg-white border border-[var(--line)] rounded-2xl shadow-sm hover:shadow-md transition-shadow';

  const tiles = [
    { label: 'Manage Rooms', href: '/admin/rooms', color: 'text-blue-600', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )},
    { label: 'Manage Meals', href: '/admin/meals', color: 'text-orange-600', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    )},
    { label: 'Manage Halls', href: '/admin/halls', color: 'text-purple-600', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    )},
    { label: 'View Bookings', href: '/admin/bookings', color: 'text-emerald-600', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    )},
    { label: 'Review Feedback', href: '/admin/feedback', color: 'text-red-600', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )},
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight text-gray-900">Dashboard</h2>
      <p className="mt-1 mb-8 text-sm text-gray-500">Welcome back, {admin.username}. Here is everything at a glance.</p>

      {/* Colorful Stat Cards (No Emojis, clean minimalist circles) */}
      <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] mb-8">
        {stats.map((s) => (
          <div key={s.l} className={`${card} p-6 flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.bg} ${s.border} border`}>
               <div className={`w-3 h-3 rounded-full ${s.color.replace('text-', 'bg-')}`} />
            </div>
            <div>
              <div className={`font-fraunces font-bold text-[28px] leading-none ${s.color}`}>
                {s.n}
              </div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                {s.l}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-8">
        
        {/* Weekly Revenue Bar Chart */}
        <div className={`${card} p-7`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="m-0 font-fraunces font-bold text-lg text-gray-900">Weekly revenue</h3>
              <div className="text-xs text-gray-500 mt-1">Paid bookings and orders</div>
            </div>
            <div className="text-right">
              <div className="font-fraunces font-bold text-xl text-emerald-600">{money(weekTotal)}</div>
              <div className="text-[10px] uppercase text-gray-400 font-bold">Last 7 days</div>
            </div>
          </div>
          
          <div className="flex items-end gap-3 h-[160px] mt-4">
            {revenue.map((v, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {money(v)}
                </div>
                <div
                  className="w-full rounded-t-md bg-blue-500 transition-all duration-300 group-hover:bg-blue-600"
                  style={{
                    height: `${Math.max((v / maxRevenue) * 100, v > 0 ? 6 : 2)}%`,
                    opacity: v > 0 ? 1 : 0.15,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-3 border-t border-gray-100 pt-3">
            {days.map((d, i) => (
              <div key={i} className="flex-1 text-center text-[11px] font-medium text-gray-400 uppercase">
                {d.toLocaleDateString('en-GB', { weekday: 'short' })}
              </div>
            ))}
          </div>
        </div>

        {/* Colorful Donut Chart */}
        <div className={`${card} p-7`}>
          <h3 className="m-0 font-fraunces font-bold text-lg text-gray-900">Bookings by status</h3>
          <div className="text-xs text-gray-500 mt-1 mb-6">Rooms, halls and meals</div>
          
          <div className="flex items-center justify-between gap-8">
            {/* Donut */}
            <div
              className="w-[160px] h-[160px] rounded-full flex items-center justify-center shrink-0 relative shadow-inner"
              style={{ background: total ? `conic-gradient(${segments})` : '#f3f4f6' }}
            >
              <div className="w-[110px] h-[110px] rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
                <b className="font-fraunces text-[32px] leading-none text-gray-900">{total}</b>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col gap-3 flex-1">
              {counts.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {c.name.toLowerCase()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {total ? Math.round((c.count / total) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions (Clean SVG icons instead of emojis) */}
      <h3 className="m-0 font-fraunces font-bold text-lg text-gray-900 mb-4 mt-2">Quick Actions</h3>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex flex-col items-center justify-center gap-3 p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all hover:-translate-y-1"
          >
            <span className={`${t.color}`}>{t.icon}</span>
            <span className="text-sm font-semibold text-gray-700 text-center">{t.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}