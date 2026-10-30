'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import PayModal from '@/components/PayModal';
import { useRequireLogin } from '@/lib/useRequireLogin';
import type { BookingStatus } from '@/lib/models';

interface Row {
  id: number;
  status: BookingStatus;
  paid: boolean;
  paymentMethod?: string | null;
}

interface Column<T> {
  label: string;
  render: (row: T) => React.ReactNode;
}

interface Props<T extends Row> {
  title: string;
  subtitle: string;
  emptyText: string;
  newHref: string;
  newLabel: string;
  rows: T[];
  columns: Column<T>[];
  getAmount: (row: T) => number;
  onPay: (id: number) => Promise<void> | void;
  onCancel: (id: number) => Promise<void> | void;
  noun: string;
}
