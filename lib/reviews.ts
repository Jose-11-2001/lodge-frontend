import type { Booking, Feedback } from '@/types';

export function getRoomReviews(
  feedback: Feedback[],
  bookings: Booking[],
  roomId: number
) {
  const reviews = feedback.filter((f) => {
    if (f.bookingId == null) return false;          // backend may not send it
    if (!(f.comment ?? '').trim()) return false;    // skip empty comments
    const booking = bookings.find((b) => b.id === f.bookingId);
    return booking?.roomId === roomId;
  });

  const count = reviews.length;
  const avg = count
    ? reviews.reduce((sum, f) => sum + f.rating, 0) / count
    : 0;

  return { reviews: [...reviews].reverse(), count, avg };
}

export const maskName = (name: string) =>
  name ? name.charAt(0).toUpperCase() + '***' : '***';