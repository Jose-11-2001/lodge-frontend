import { Booking, Feedback } from '@/types';

export function getRoomReviews(feedback: Feedback[], bookings: Booking[], roomId: number) {
  const reviews = feedback.filter(
    (f) =>
      f.bookingId != null &&
      (f.comment ?? '').trim() !== '' &&          // FIXED: comment may be undefined
      bookings.find((b) => b.id === f.bookingId)?.roomId === roomId
  );
  const count = reviews.length;
  const avg = count ? reviews.reduce((sum, f) => sum + f.rating, 0) / count : 0;
  return { reviews: [...reviews].reverse(), count, avg };
}

export const maskName = (name: string) => name.charAt(0).toUpperCase() + '***';