'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PayModal from '@/components/PayModal';
import { useRequireLogin } from '@/lib/useRequireLogin';
import { BookingStatus } from '@/types';

interface Row {
  id: number;
  status: BookingStatus;
  paid: boolean;
  paymentMethod: string | null;
}

interface Column<T> {
  label: string;
  render: (row: T) => React.ReactNode;
}

interface Props<T extends Row> {
  title: string;
  subtitle: string;
  icon: string;
  emptyText: string;
  newHref: string;
  newLabel: string;
  rows: T[];
  columns: Column<T>[];
  getAmount: (row: T) => number;
  onPay: (id: number, method: string) => void;
  onCancel: (id: number) => void;
  noun: string; // e.g. "booking" or "order"
}

export default function MyBookingsView<T extends Row>({
  title, subtitle, icon, emptyText, newHref, newLabel,
  rows, columns, getAmount, onPay, onCancel, noun,
}: Props<T>) {
  const user = useRequireLogin();
  const [payingId, setPayingId] = useState<number | null>(null);

  if (!user) return null;

  const paying = rows.find((r) => r.id === payingId) || null;
  const list = [...rows].reverse(); // newest first

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">{title}</h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
        <Link href={newHref} className="btn btn-primary no-underline">{newLabel}</Link>
      </div>

      {list.length === 0 ? (
        <div className="empty"><div className="ico">{icon}</div>{emptyText}</div>
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
                  <td>{row.paid ? `✅ ${row.paymentMethod || ''}` : '—'}</td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {!row.paid && row.status !== 'CANCELLED' && (
                        <button className="btn btn-primary" style={{ padding: '6px 14px' }} onClick={() => setPayingId(row.id)}>Pay</button>
                      )}
                      {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
                        <button className="btn btn-danger" style={{ padding: '6px 14px' }} onClick={() => onCancel(row.id)}>Cancel</button>
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
          if (payingId !== null) onPay(payingId, method);
          setPayingId(null);
        }}
      />
    </div>
  );
}