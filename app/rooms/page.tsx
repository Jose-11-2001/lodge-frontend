'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';
import Card from '@/components/Card';
import FilterBar from '@/components/FilterBar';
import Modal from '@/components/Modal';
import { Room } from '@/types';

const dayStr = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

function RoomBookingForm({ room, onClose }: { room: Room; onClose: () => void }) {
  const { createBooking, showToast } = useLodge();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(dayStr(0));
  const [checkOut, setCheckOut] = useState(dayStr(1));
  const [count, setCount] = useState(1);

  const nights = Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  const total = nights * room.pricePerNight * count;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (nights < 1) throw new Error('Check-out must be after check-in');
      createBooking({ roomId: room.id, checkIn, checkOut, roomCount: count });
      showToast('Booking created. Pay from My Bookings.');
      onClose();
      router.push('/my-bookings');
    } catch (err) {
      showToast((err as Error).message, true);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="field"><label>Check-in</label>
        <input type="date" min={dayStr(0)} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></div>
      <div className="field"><label>Check-out</label>
        <input type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></div>
      <div className="field"><label>Rooms (max {room.availableRooms})</label>
        <input type="number" min={1} max={room.availableRooms} value={count}
          onChange={(e) => setCount(Number(e.target.value))} /></div>
      <p className="text-sm text-[var(--muted)] m-0">
        {nights} night(s) · Total <b className="text-[var(--text)]">K {total.toFixed(2)}</b>
      </p>
      <div className="btn-row">
        <button className="btn btn-primary" type="submit">Confirm booking</button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

export default function RoomsPage() {
  const { rooms, user, showToast } = useLodge();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | boolean>('all');
  const [selected, setSelected] = useState<Room | null>(null);

  const shown = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'all' || r.availableRooms > 0));

  const book = (room: Room) => {
    if (!user) {
      showToast('Please log in to book a room', true);
      router.push('/login');
      return;
    }
    setSelected(room);
  };

  return (
    <div>
      <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Rooms</h2>
      <p className="mt-1 mb-6 text-sm text-[var(--muted)]">Browse freely. Log in only when you are ready to book.</p>

      <FilterBar
        searchValue={search} onSearchChange={setSearch}
        chips={[{ label: 'All', value: 'all' }, { label: 'Available', value: 'available' }]}
        activeChip={filter} onChipChange={setFilter}
      />

      {shown.length === 0 ? (
        <div className="empty"><div className="ico">🛏️</div>No rooms match your search.</div>
      ) : (
        <div className="grid gap-[22px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {shown.map((room) => (
            <Card key={room.id} item={{ itemType: 'rooms', ...room }}
              actionLabel="Book" disabled={room.availableRooms <= 0} onAction={() => book(room)} />
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Book ${selected.name}` : ''}>
        {selected && <RoomBookingForm room={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </div>
  );
}