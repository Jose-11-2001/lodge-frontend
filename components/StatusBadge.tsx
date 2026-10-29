import React from 'react';
import { BookingStatus } from '@/types';

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const cls = status === 'CONFIRMED' ? 'ok' : status === 'PENDING' ? 'warn' : status === 'COMPLETED' ? '' : 'bad';
  return <span className={`badge ${cls}`}>{status}</span>;
}