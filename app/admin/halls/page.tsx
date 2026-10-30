'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';
import CrudManager from '@/components/CrudManager';
import { money } from '@/lib/format';
import { Hall } from '@/types';

export default function AdminHallsPage() {
  const { halls, createHall, updateHall, deleteHall } = useLodge();

  return (
    <CrudManager<Hall>
      title="Manage Halls"
      subtitle="Add conference halls, set prices and upload photos."
      icon="🏛️"
      noun="Hall"
      emptyText="No halls yet."
      items={halls}
      fields={[
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'building', label: 'Building', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'capacity', label: 'Capacity (people)', type: 'number' },
        { key: 'pricePerHour', label: 'Price per hour (K)', type: 'number' },
        { key: 'pricePerDay', label: 'Price per day (K)', type: 'number' },
        { key: 'primaryImage', label: 'Photo', type: 'image' },
      ]}
      columns={[
        { label: 'Building', render: (h) => h.building },
        { label: 'Capacity', render: (h) => `👥 ${h.capacity}` },
        { label: 'Per hour', render: (h) => money(h.pricePerHour) },
        { label: 'Per day', render: (h) => money(h.pricePerDay) },
        { label: 'Status', render: (h) => <span className={`badge ${h.available ? 'ok' : 'bad'}`}>{h.available ? 'Available' : 'Booked'}</span> },
      ]}
      onCreate={(v) => createHall(v as unknown as Omit<Hall, 'id' | 'available'>)}
      onUpdate={(hall, v) => updateHall(hall.id, v as Partial<Hall>)}
      onDelete={deleteHall}
    />
  );
}