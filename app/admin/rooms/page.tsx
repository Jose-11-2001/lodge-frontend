'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';
import CrudManager from '@/components/CrudManager';
import { money } from '@/lib/format';
import { Room } from '@/types';

export default function AdminRoomsPage() {
  const { rooms, createRoom, updateRoom, deleteRoom, showToast } = useLodge();

  return (
    <CrudManager<Room>
      title="Manage Rooms"
      subtitle="Add rooms, set prices and upload photos."
      icon="🏨"
      noun="Room"
      emptyText="No rooms yet."
      items={rooms}
      notify={showToast}                                  {/* FIXED */}
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
        { label: 'Rooms free', render: (r) => `${r.availableRooms} / ${r.totalRooms}` },
        { label: 'Amenities', render: (r) => r.amenities.join(' · ') || '—' },
      ]}
      onCreate={(v) => {
        createRoom(v as unknown as Omit<Room, 'id' | 'availableRooms'>);
      }}
      onUpdate={(room, v) => {
        const total = Number(v.totalRooms);
        const free = Math.max(0, room.availableRooms + (total - room.totalRooms));
        updateRoom(room.id, { ...(v as Partial<Room>), availableRooms: free });
      }}
      onDelete={deleteRoom}
    />
  );
}