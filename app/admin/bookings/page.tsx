'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLodge } from '@/context/LodgeContext';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import StatusBadge from '@/components/StatusBadge';
import { money, dateOnly, dateTime } from '@/lib/format';
import { BookingStatus, PaymentMethod } from '@/types';
import type { BookingStatusInput } from '@/lib/api';

type Tab = 'rooms' | 'halls' | 'meals';

interface Row {
  id: number;
  customer: string;
  item: string;
  when: string;
  total: number;
  status: BookingStatus;
  paid: boolean;
  method: PaymentMethod | null;
}

export default function AdminBookingsPage() {
  const admin = useRequireAdmin();
  const {
    initializing,
    bookings, hallBookings, mealOrders,
    updateBookingStatus, updateHallBookingStatus, updateMealOrderStatus, showToast,
  } = useLodge();
  const [tab, setTab] = useState<Tab>('rooms');

  if (initializing) return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  if (!admin) return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;

  const data: Record<Tab, {
    rows: Row[];
    update: (id: number, s: BookingStatusInput) => Promise<void>;
    icon: string;
  }> = {
    rooms: {
      icon: '🛏️',                          // ← uncommented
      update: updateBookingStatus,
      rows: bookings.map((b) => ({
        id: b.id,
        customer: b.customerUsername,
        item: `${b.roomName} × ${b.roomCount}`,
        when: `${dateOnly(b.checkIn)} → ${dateOnly(b.checkOut)}`,
        total: b.totalAmount,
        status: b.status,
        paid: b.paid,
        method: b.paymentMethod ?? null,
      })),
    },
    halls: {
      icon: '🏛️',                          // ← uncommented
      update: updateHallBookingStatus,
      rows: hallBookings.map((h) => ({
        id: h.id,
        customer: h.customerUsername,
        item: `${h.hallName} (${h.purpose}, ${h.attendees} people)`,
        when: `${dateTime(h.startTime)} → ${dateTime(h.endTime)}`,
        total: h.totalPrice,
        status: h.status,
        paid: h.paid,
        method: h.paymentMethod ?? null,
      })),
    },
    meals: {
      icon: '🍽️',                          // ← uncommented
      update: updateMealOrderStatus,
      rows: mealOrders.map((o) => ({
        id: o.id,
        customer: o.customerUsername,
        item: `${o.mealName} × ${o.quantity}`,
        when: dateTime(o.serveAt),
        total: o.totalPrice,
        status: o.status,
        paid: o.paid,
        method: o.paymentMethod ?? null,
      })),
    },
  };

  const current = data[tab];
  const list = [...current.rows].reverse();

  const change = async (
    id: number,
    status: BookingStatusInput,
    message: string
  ) => {
    try {
      await current.update(id, status);
      showToast(message);
    } catch (err) {
      showToast((err as Error).message, true);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'rooms', label: `Rooms (${bookings.length})` },
    { key: 'halls', label: `Halls (${hallBookings.length})` },
    { key: 'meals', label: `Meals (${mealOrders.length})` },
  ];

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Bookings</h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">Confirm, complete or cancel what customers book.</p>
        </div>
        <Link href="/admin/dashboard" className="btn btn-ghost no-underline">← Dashboard</Link>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full cursor-pointer border text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-[#111827] text-white border-transparent'
                : 'bg-white border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty"><div className="ico">{current.icon}</div>No orders here yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Customer</th><th>Item</th><th>When</th>
                <th>Total</th><th>Status</th><th>Payment</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.customer}</td>
                  <td>{r.item}</td>
                  <td>{r.when}</td>
                  <td>{money(r.total)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.paid ? `✅ ${r.method || ''}` : '—'}</td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {r.status === 'PENDING' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 14px' }}
                          onClick={() => change(r.id, 'CONFIRMED', 'Confirmed')}
                        >
                          Confirm
                        </button>
                      )}

                      {r.status === 'CONFIRMED' && (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '6px 14px' }}
                          onClick={() => change(r.id, 'COMPLETED', 'Marked as completed')}
                        >
                          Mark Complete
                        </button>
                      )}

                      {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 14px' }}
                          onClick={() => change(r.id, 'CANCELLED', 'Cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}