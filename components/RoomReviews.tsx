'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';
import { getRoomReviews, maskName } from '@/lib/reviews';
import { dateOnly } from '@/lib/format';

export default function RoomReviews({ roomId, limit }: { roomId: number; limit?: number }) {
  const { feedbackList, bookings } = useLodge();
  const { reviews, count, avg } = getRoomReviews(feedbackList, bookings, roomId);
  const shown = limit ? reviews.slice(0, limit) : reviews;

  if (count === 0) {
    return <p className="m-0 text-sm text-[var(--muted)]">No reviews yet. Be the first to stay and share.</p>;
  }

  return (
    <div>
      <p className="m-0 mb-3 text-sm">
        <span className="stars">{'★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg))}</span>{' '}
        <b>{avg.toFixed(1)}</b> <span className="text-[var(--muted)]">· {count} review{count > 1 ? 's' : ''}</span>
      </p>
      <div className="flex flex-col gap-2.5">
        {shown.map((r) => (
          <div key={r.id} className="p-3 rounded-xl border border-[var(--line)] bg-[var(--card)]">
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
              <span className="stars" style={{ fontSize: 13 }}>{'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}</span>
              <span>{maskName(r.customerUsername)} · {dateOnly(r.createdAt)}</span>
            </div>
            <p className="m-0 mt-1.5 text-sm leading-relaxed">{r.comment}</p>
          </div>
        ))}
      </div>
      {limit && count > limit && (
        <p className="m-0 mt-2 text-xs text-[var(--muted)]">Showing {limit} of {count}. Tap the rating on the room card to see all.</p>
      )}
    </div>
  );
}