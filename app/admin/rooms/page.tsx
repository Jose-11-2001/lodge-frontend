'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import CrudManager from '@/components/CrudManager';
import { money } from '@/lib/format';
import { Room } from '@/types';

export default function AdminRoomsPage() {
  const admin = useRequireAdmin();
  const { initializing, rooms, createRoom, updateRoom, deleteRoom, showToast } = useLodge();

  if (initializing) return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  if (!admin) return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;

  return (
    <CrudManager<Room>
      title="Manage Rooms"
      subtitle="Add rooms, set prices and upload photos."
      noun="Room"
      emptyText="No rooms yet."
      items={rooms}
      notify={showToast}
      fields={[
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'building', label: 'Building', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'pricePerNight', label: 'Price per night (K)', type: 'number' },
        { key: 'totalRooms', label: 'Number of rooms', type: 'number' },
        { key: 'amenities', label: 'Amenities (comma separated)', type: 'list', optional: true, placeholder: 'WiFi, AC, TV' },
        { key: 'primaryImage', label: 'Photo', type: 'image' },
      ]}
      columns={[
        { label: 'Building', render: (r) => r.building },
        { label: 'Price / night', render: (r) => money(r.pricePerNight) },
        {
          label: 'Available (tonight)',
          render: (r) => {
            const free = r.availableRooms;
            const total = r.totalRooms;
            const booked = total - free;
            const tone =
              free <= 0 ? 'bad' : free <= total * 0.3 ? 'warn' : 'ok';
            return (
              <span className={`badge ${tone}`}>
                {free} / {total}
                {booked > 0 ? ` · ${booked} booked` : ''}
              </span>
            );
          },
        },
        { label: 'Amenities', render: (r) => r.amenities.join(' · ') || '—' },
      ]}
      onCreate={async (v) => {
        try {
          const image = v.primaryImage instanceof File ? v.primaryImage : undefined;
          await createRoom(v as unknown as Omit<Room, 'id' | 'availableRooms'>, image);
          showToast('Room added');
        } catch (err) {
          showToast((err as Error).message, true);
          throw err;
        }
      }}
      onUpdate={async (room, v) => {
        try {
          const total = Number(v.totalRooms);
          const free = Math.max(0, room.availableRooms + (total - room.totalRooms));
          await updateRoom(room.id, { ...(v as Partial<Room>), availableRooms: free });
          showToast('Room updated');
        } catch (err) {
          showToast((err as Error).message, true);
          throw err;
        }
      }}
      onDelete={async (id) => {
        try {
          await deleteRoom(id);
          showToast('Room deleted');
        } catch (err) {
          showToast((err as Error).message, true);
          throw err;
        }
      }}
    />
  );
}