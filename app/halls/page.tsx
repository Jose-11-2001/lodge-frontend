'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';
import Card from '@/components/Card';
import FilterBar from '@/components/FilterBar';
import Modal from '@/components/Modal';
import { Hall } from '@/types';

const localDT = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function HallBookingForm({ hall, onClose }: { hall: Hall; onClose: () => void }) {
  const { createHallBooking, showToast } = useLodge();
  const router = useRouter();
  const start0 = new Date(); start0.setMinutes(0, 0, 0);
  const [startTime, setStartTime] = useState(localDT(new Date(start0.getTime() + 3600000)));
  const [endTime, setEndTime] = useState(localDT(new Date(start0.getTime() + 7200000)));
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(10);
  const [mode, setMode] = useState<'HOURLY' | 'DAILY'>('HOURLY');

  const hours = Math.max(1, (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000);
  const total = mode === 'DAILY' ? hall.pricePerDay : hall.pricePerHour * hours;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (new Date(endTime) <= new Date(startTime)) throw new Error('End time must be after start time');
      if (attendees > hall.capacity) throw new Error(`This hall holds up to ${hall.capacity} people`);
      createHallBooking({ hallId: hall.id, startTime, endTime, purpose, attendees, billingMode: mode });
      showToast('Hall booked. Pay from My Halls.');
      onClose();
      router.push('/my-hall-bookings');
    } catch (err) {
      showToast((err as Error).message, true);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="field"><label>Start</label>
        <input type="datetime-local" min={localDT(new Date())} value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
      <div className="field"><label>End</label>
        <input type="datetime-local" min={startTime} value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
      <div className="field"><label>Purpose</label>
        <input placeholder="e.g. workshop" value={purpose} onChange={(e) => setPurpose(e.target.value)} required /></div>
      <div className="field"><label>Attendees (max {hall.capacity})</label>
        <input type="number" min={1} max={hall.capacity} value={attendees} onChange={(e) => setAttendees(Number(e.target.value))} /></div>
      <div className="field"><label>Billing</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as 'HOURLY' | 'DAILY')}>
          <option value="HOURLY">Hourly</option>
          <option value="DAILY">Daily</option>
        </select></div>
      <p className="text-sm text-[var(--muted)] m-0">
        Total <b className="text-[var(--text)]">K {total.toFixed(2)}</b>
      </p>
      <div className="btn-row">
        <button className="btn btn-primary" type="submit">Confirm booking</button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

export default function HallsPage() {
  const { halls, user, showToast } = useLodge();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | boolean>('all');
  const [selected, setSelected] = useState<Hall | null>(null);

  const shown = halls.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || h.available));

  const book = (hall: Hall) => {
    if (!user) {
      showToast('Please log in to book a hall', true);
      router.push('/login');
      return;
    }
    setSelected(hall);
  };

  return (
    <div>
      <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Meeting spaces</h2>
      <p className="mt-1 mb-6 text-sm text-[var(--muted)]">For workshops, conferences and retreats.</p>

      <FilterBar
        searchValue={search} onSearchChange={setSearch}
        chips={[{ label: 'All', value: 'all' }, { label: 'Available', value: 'available' }]}
        activeChip={filter} onChipChange={setFilter}
      />

      {shown.length === 0 ? (
        <div className="empty"><div className="ico">🏛️</div>No halls match your search.</div>
      ) : (
        <div className="grid gap-[22px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {shown.map((hall) => (
            <Card key={hall.id} item={{ itemType: 'halls', ...hall }}
              actionLabel={hall.available ? 'Book' : 'Booked'} disabled={!hall.available} onAction={() => book(hall)} />
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Book ${selected.name}` : ''}>
        {selected && <HallBookingForm hall={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </div>
  );
}