'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';
import MyBookingsView from '@/components/MyBookingsView';
import { money, dateTime } from '@/lib/format';
import { PaymentMethod } from '@/types';

export default function MyMealsPage() {
  const { user, mealOrders, payMealOrder, cancelMealOrder, showToast } =
    useLodge();
  const rows = user
    ? mealOrders.filter((o) => o.customerUsername === user.username)
    : [];

  return (
    <MyBookingsView
      title="My Meal Orders"
      subtitle="Meals you have ordered."
      icon="🍽️"
      emptyText="No meal orders yet. Browse meals to order."
      newHref="/meals"
      newLabel="+ New order"
      noun="order"
      rows={rows}
      getAmount={(o) => o.totalPrice}
      columns={[
        { label: 'Meal', render: (o) => `${o.mealName} × ${o.quantity}` },
        { label: 'Serve at', render: (o) => dateTime(o.serveAt) },
        { label: 'Total', render: (o) => money(o.totalPrice) },
      ]}
      onPay={(id: number, method: PaymentMethod) => {
        try {
          payMealOrder(id, method);
          showToast('Payment successful');
        } catch (e) {
          showToast((e as Error).message, true);
        }
      }}
      onCancel={(id: number) => {
        try {
          cancelMealOrder(id);
          showToast('Order cancelled');
        } catch (e) {
          showToast((e as Error).message, true);
        }
      }}
    />
  );
}