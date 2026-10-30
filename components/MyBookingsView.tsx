'use client';

import React from 'react';
import Link from 'next/link';
import { BookingStatus } from '@/types';
import { PaymentMethod } from '@/types';
import { money } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';

const PAYMENT_METHODS: PaymentMethod[] = [
  'CARD',
  'MOBILE_MONEY',
  'BANK_TRANSFER',
  'CASH',
];

interface Row {
  id: number;
  status: BookingStatus;
  paid: boolean;
  paymentMethod?: string | null;
}

interface Props<T extends Row> {
  title: string;
  subtitle: string;
  icon?: string;
  emptyText: string;
  newHref: string;
  newLabel: string;
  noun: string;
  rows: T[];
  getAmount: (row: T) => number;
  columns: { label: string; render: (row: T) => React.ReactNode }[];
  onPay: (id: number, method: PaymentMethod) => void;
  onCancel: (id: number) => void;
}

export default function MyBookingsView<T extends Row>({
  title,
  subtitle,
  icon,
  emptyText,
  newHref,
  newLabel,
  noun,
  rows,
  getAmount,
  columns,
  onPay,
  onCancel,
}: Props<T>) {
  const [paying, setPaying] = React.useState<T | null>(null);
  const [method, setMethod] = React.useState<PaymentMethod>('CARD');

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">
            {icon ? `${icon} ` : ''}
            {title}
          </h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Link href="/" className="btn btn-ghost no-underline">
            &larr; Home
          </Link>
          <Link href={newHref} className="btn btn-primary no-underline">
            {newLabel}
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <div className="ico">{icon ?? '📋'}</div>
          {emptyText}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                {columns.map((c, i) => (
                  <th key={`${c.label}-${i}`}>{c.label}</th>
                ))}
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  {columns.map((c, i) => (
                    <td key={`${c.label}-${i}`}>{c.render(r)}</td>
                  ))}
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.paid ? `✅ ${r.paymentMethod ?? ''}` : '—'}</td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {!r.paid && r.status === 'PENDING' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 14px' }}
                          onClick={() => {
                            setPaying(r);
                            setMethod('CARD');
                          }}
                        >
                          Pay
                        </button>
                      )}
                      {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 14px' }}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Cancel this ${noun}? This cannot be undone.`
                              )
                            ) {
                              onCancel(r.id);
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                      <span className="text-xs text-[var(--muted)] self-center">
                        {money(getAmount(r))}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paying && (
        <div
          className="fixed inset-0 bg-[rgba(2,6,20,0.7)] backdrop-blur-md flex items-center justify-center p-5 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPaying(null);
          }}
        >
          <div className="bg-[var(--bg)] border border-[var(--line-2)] rounded-[20px] p-6 max-w-[420px] w-full">
            <h3 className="m-0 mb-4 font-fraunces font-bold text-[22px]">
              Pay for {noun} #{paying.id}
            </h3>
            <div className="field">
              <label htmlFor="pay-method">Payment method</label>
              <select
                id="pay-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-[var(--muted)] m-0 mb-4">
              Total{' '}
              <b className="text-[var(--text)]">{money(getAmount(paying))}</b>
            </p>
            <div className="btn-row">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  onPay(paying.id, method);
                  setPaying(null);
                }}
              >
                Confirm payment
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setPaying(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}