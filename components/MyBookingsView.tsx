'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PayModal from '@/components/PayModal';
import { useRequireLogin } from '@/lib/useRequireLogin';
import type { BookingStatus } from '@/lib/models';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

interface Row {
  id: number;
  status: BookingStatus;
  paid: boolean;
  paymentMethod?: string | null;
}

interface Column<T> {
  label: string;
  render: (row: T) => React.ReactNode;
}

interface Props<T extends Row> {
  title: string;
  subtitle: string;
  emptyText: string;
  newHref: string;
  newLabel: string;
  rows: T[];
  columns: Column<T>[];
  getAmount: (row: T) => number;
  onPay: (id: number) => Promise<void> | void;
  onCancel: (id: number) => Promise<void> | void;
  noun: string;
  /** e.g. "bookings" or "orders" — used to build the API path */
  resource: string;
}

export default function MyBookingsView<T extends Row>({
  title, subtitle, emptyText, newHref, newLabel,
  rows, columns, getAmount, onPay, onCancel, noun, resource,
}: Props<T>) {
  const user = useRequireLogin();
  const [payingId, setPayingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const paying = rows.find((r) => r.id === payingId) || null;
  const list = [...rows].reverse(); // newest first

  const cancelOnServer = async (id: number) => {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/api/${resource}/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Cancel failed (${res.status})`);
      await onCancel(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setBusyId(null);
    }
  };

  const payOnServer = async (id: number, method: string) => {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/api/${resource}/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ method }),
      });
      if (!res.ok) throw new Error(`Payment failed (${res.status})`);
      await onPay(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusyId(null);
      setPayingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">{title}</h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
        <Link href={newHref} className="btn btn-primary no-underline">{newLabel}</Link>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty">{emptyText}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                {columns.map((c) => <th key={c.label}>{c.label}</th>)}
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  {columns.map((c) => <td key={c.label}>{c.render(row)}</td>)}
                  <td><StatusBadge status={row.status} /></td>
                  <td>{row.paid ? (row.paymentMethod || 'Paid') : '—'}</td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {!row.paid && row.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 14px' }}
                          disabled={busyId === row.id}
                          onClick={() => setPayingId(row.id)}
                        >
                          Pay
                        </button>
                      )}
                      {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 14px' }}
                          disabled={busyId === row.id}
                          onClick={() => cancelOnServer(row.id)}
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

      <PayModal
        isOpen={!!paying}
        onClose={() => setPayingId(null)}
        title={paying ? `Pay for ${noun} #${paying.id}` : ''}
        amount={paying ? getAmount(paying) : 0}
        onPay={(method) => {
          if (payingId !== null) void payOnServer(payingId, method);
        }}
      />
    </div>
  );
}