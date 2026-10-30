'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';
import MyBookingsView from '@/components/MyBookingsView';
import { money, dateTime } from '@/lib/format';
import { PaymentMethod } from '@/types';

export default function MyHallBookingsPage() {
  const { user, hallBookings, payHallBooking, cancelHallBooking, showToast } =
    useLodge();
  const rows = user
    ? hallBookings.filter((h) => h.customerUsername === user.username)
    : [];

  return (
    <MyBookingsView
      title="My Hall Bookings"
      subtitle="Your meetings, workshops and events."
      icon="🏛️"
      emptyText="No hall bookings yet. Browse halls to book."
      newHref="/halls"
      newLabel="+ New booking"
      noun="booking"
      rows={rows}
      getAmount={(h) => h.totalPrice}
      columns={[
        { label: 'Hall', render: (h) => h.hallName },
        {
          label: 'When',
          render: (h) => `${dateTime(h.startTime)} → ${dateTime(h.endTime)}`,
        },
        {
          label: 'Purpose',
          render: (h) => `${h.purpose} (${h.attendees})`,
        },
        { label: 'Total', render: (h) => money(h.totalPrice) },
      ]}
      onPay={(id: number, method: PaymentMethod) => {
        try {
          payHallBooking(id, method);
          showToast('Payment successful');
        } catch (e) {
          showToast((e as Error).message, true);
        }
      }}
      onCancel={(id: number) => {
        try {
          cancelHallBooking(id);
          showToast('Booking cancelled');
        } catch (e) {
          showToast((e as Error).message, true);
        }
      }}
    />
  );
}