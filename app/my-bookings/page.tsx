'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';
import MyBookingsView from '@/components/MyBookingsView';
import { money, dateOnly } from '@/lib/format';
import { PaymentMethod } from '@/types';

export default function MyBookingsPage() {
  const { user, bookings, payBooking, cancelBooking, showToast } = useLodge();
  const rows = user
    ? bookings.filter((b) => b.customerUsername === user.username)
    : [];

  return (
    <MyBookingsView
      title="My Room Bookings"
      subtitle="Track and manage your stays."
      icon="🛏️"
      emptyText="No bookings yet. Browse rooms to book."
      newHref="/rooms"
      newLabel="+ New booking"
      noun="booking"
      rows={rows}
      getAmount={(b) => b.totalAmount}
      columns={[
        { label: 'Room', render: (b) => b.roomName },
        {
          label: 'Dates',
          render: (b) => `${dateOnly(b.checkIn)} → ${dateOnly(b.checkOut)}`,
        },
        { label: 'Total', render: (b) => money(b.totalAmount) },
      ]}
      onPay={(id: number, method: PaymentMethod) => {
        try {
          payBooking(id, method);
          showToast('Payment successful');
        } catch (e) {
          showToast((e as Error).message, true);
        }
      }}
      onCancel={(id: number) => {
        try {
          cancelBooking(id);
          showToast('Booking cancelled');
        } catch (e) {
          showToast((e as Error).message, true);
        }
      }}
    />
  );
}