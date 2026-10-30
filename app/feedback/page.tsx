'use client';

import React, { useState } from 'react';
import { useLodge } from '@/context/LodgeContext';
import { useRequireLogin } from '@/lib/useRequireLogin';
import { dateOnly } from '@/lib/format';

export default function FeedbackPage() {
  const user = useRequireLogin();
  const { bookings, feedbackList, createFeedback, showToast } = useLodge();
  const [bookingId, setBookingId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!user) return null;

  const myBookings = bookings.filter((b) => b.customerUsername === user.username);
  const myFeedback = feedbackList
    .filter((f) => f.customerUsername === user.username)
    .slice()
    .reverse();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!comment.trim()) throw new Error('Please write a short comment');
      createFeedback({ bookingId: bookingId ? Number(bookingId) : null, rating, comment: comment.trim() });
      showToast('Thanks for your feedback!');
      setBookingId('');
      setRating(5);
      setComment('');
    } catch (err) {
      showToast((err as Error).message, true);
    }
  };

  return (
    <div>
      <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Feedback</h2>
      <p className="mt-1 mb-6 text-sm text-[var(--muted)]">Tell us how we did. We read every message.</p>

      <form
        onSubmit={submit}
        className="max-w-[560px] bg-[var(--card)] border border-[var(--line-2)] rounded-[20px] p-7 shadow-[var(--shadow-md)] mb-8"
      >
        <div className="field">
          <label>Booking (optional)</label>
          <select value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
            <option value="">Not about a specific booking</option>
            {myBookings.map((b) => (
              <option key={b.id} value={b.id}>
                #{b.id} · {b.roomName} · {dateOnly(b.checkIn)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Rating</label>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                onClick={() => setRating(n)}
                className={`bg-transparent border-none cursor-pointer text-[30px] leading-none p-0.5 transition-transform hover:scale-110 ${
                  n <= rating ? 'text-[var(--gold)]' : 'text-[var(--line-2)]'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Comment</label>
          <textarea
            rows={4}
            placeholder="Tell us about your stay..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" type="submit">Submit feedback</button>
      </form>

      {myFeedback.length > 0 && (
        <>
          <h3 className="m-0 mb-4 font-fraunces text-[22px]">Your feedback</h3>
          <div className="grid gap-[18px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {myFeedback.map((f) => (
              <div
                key={f.id}
                className="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="stars">{'★'.repeat(f.rating) + '☆'.repeat(5 - f.rating)}</div>
                  <span className={`badge ${f.resolved ? 'ok' : 'warn'}`}>{f.resolved ? 'Resolved' : 'Open'}</span>
                </div>
                <p className="mt-2.5 mb-1 text-sm text-[var(--muted)] leading-relaxed">{f.comment || '—'}</p>
                <p className="m-0 text-xs text-[var(--muted)]">{dateOnly(f.createdAt)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}