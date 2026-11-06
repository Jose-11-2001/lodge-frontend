'use client';

import React from 'react';
import Link from 'next/link';
import { useLodge } from '@/context/LodgeContext';
import { useRequireLogin } from '@/lib/useRequireLogin';
import StatusBadge from '@/components/StatusBadge';
import { money, dateTime } from '@/lib/format';

export default function MyMealsPage() {
  const user = useRequireLogin();
  const { initializing, mealOrders, cancelMealOrder, showToast } = useLodge();

  if (initializing) return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  if (!user) return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;

  const mine = mealOrders.filter((o) => o.customerUsername === user.username);
  const list = [...mine].reverse();

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">My Meal Orders</h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">
            {mine.length} order{mine.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link href="/meals" className="btn btn-ghost no-underline">Browse meals →</Link>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <div className="ico"></div>
          No meal orders yet.
          <Link href="/meals" className="btn btn-primary no-underline mt-2">
            Order a meal
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Meal</th><th>Qty</th><th>Serve at</th>
                <th>Total</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.mealName}</td>
                  <td>{o.quantity}</td>
                  <td>{dateTime(o.serveAt)}</td>
                  <td>{money(o.totalPrice)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    {o.status !== 'CANCELLED' && o.status !== 'COMPLETED' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 14px' }}
                        onClick={async () => {
                          try {
                            await cancelMealOrder(o.id);
                            showToast('Order cancelled');
                          } catch (e) {
                            showToast((e as Error).message, true);
                          }
                        }}
                      >
                        Cancel
                      </button>
                    )}
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