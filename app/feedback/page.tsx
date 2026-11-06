'use client';

import React from 'react';
import Link from 'next/link';
import { useLodge } from '@/context/LodgeContext';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { dateOnly } from '@/lib/format';

export default function AdminFeedbackPage() {
  const admin = useRequireAdmin();
  const { initializing, feedbackList, resolveFeedback, showToast, refresh } = useLodge();

  if (initializing) return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  if (!admin) return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;

  const list = [...feedbackList].reverse();
  const open = feedbackList.filter((f) => !f.resolved).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Feedback</h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">
            {open} open · {feedbackList.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refresh()} className="btn btn-ghost">
            Refresh
          </button>
          <Link href="/admin/dashboard" className="btn btn-ghost no-underline">← Dashboard</Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty"><div className="ico">💬</div>No feedback yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Customer</th><th>Rating</th>
                <th>Comment</th><th>Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td>#{f.id}</td>
                  <td>{f.customerUsername}</td>
                  <td><span className="stars">{'★'.repeat(f.rating) + '☆'.repeat(5 - f.rating)}</span></td>
                  <td style={{ maxWidth: 320 }}>{f.comment || '—'}</td>
                  <td>{dateOnly(f.createdAt)}</td>
                  <td><span className={`badge ${f.resolved ? 'ok' : 'warn'}`}>{f.resolved ? 'Resolved' : 'Open'}</span></td>
                  <td>
                    {!f.resolved && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 14px' }}
                        onClick={async () => {
                          try {
                            await resolveFeedback(f.id);
                            showToast('Marked as resolved');
                          } catch (err) {
                            showToast((err as Error).message, true);
                          }
                        }}
                      >
                        Resolve
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