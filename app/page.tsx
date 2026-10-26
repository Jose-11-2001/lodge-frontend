'use client';

import React from 'react';
import Link from 'next/link';
import { useLodge } from '@/context/LodgeContext';
import Card from '@/components/Card';

export default function HomePage() {
  const { rooms, meals, halls, user } = useLodge();

  const totalAvailableRooms = rooms.reduce((sum, r) => sum + r.availableRooms, 0);

  return (
    <div>
      {/* Hero Section */}
      <section className="rounded-[28px] px-14 py-16 relative overflow-hidden bg-[linear-gradient(135deg,rgba(110,168,255,0.14),rgba(167,139,250,0.10)_60%,rgba(34,211,168,0.10))] border border-[var(--line-2)] shadow-[var(--shadow-md)] mb-9 isolate">
        <div className="absolute w-[380px] h-[380px] bg-[radial-gradient(circle,#6ea8ffaa,transparent_70%)] -top-[120px] -right-[80px] rounded-full blur-[50px] pointer-events-none -z-10 animate-[floatY2_9s_ease-in-out_infinite]" />
        <div className="absolute w-[320px] h-[320px] bg-[radial-gradient(circle,#22d3a888,transparent_70%)] -bottom-[100px] -left-[60px] rounded-full blur-[50px] pointer-events-none -z-10 animate-[floatY2_11s_ease-in-out_infinite_reverse]" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(110,168,255,0.12)] border border-[rgba(110,168,255,0.35)] text-xs font-semibold text-[var(--accent)] mb-4.5">
          <span className="w-2 h-2 rounded-full bg-[#22d3a8] shadow-[0_0_10px_#22d3a8] animate-ping" />
          Live availability · {totalAvailableRooms} rooms open
        </div>

        <h2 className="m-0 mb-4 font-fraunces font-bold text-[clamp(32px,5vw,58px)] leading-[1.03] tracking-[-1px] max-w-[760px]">
          Stay, meet & dine <em className="italic bg-[image:var(--grad-1)] bg-[length:200%_100%] bg-clip-text text-transparent">beautifully</em>.
        </h2>

        <p className="text-[var(--muted)] text-base max-w-[560px] m-0 mb-6.5 leading-relaxed">
          Book premium rooms, conference halls and chef-made meals at one lodge — managed in a single dashboard. No paperwork. No calls. Just good stays.
        </p>

        <div className="flex gap-3 flex-wrap relative z-10">
          <Link
            href="/rooms"
            className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-[image:var(--grad-1)] text-[#06142b] no-underline shadow-[0_8px_24px_rgba(110,168,255,0.3)] hover:-translate-y-0.5 transition-all"
          >
            Browse rooms →
          </Link>
          <Link
            href={user ? '/my-bookings' : '/register'}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-[rgba(120,150,220,0.06)] text-[var(--text)] border border-[var(--line-2)] no-underline hover:bg-[rgba(120,150,220,0.14)] transition-all"
          >
            {user ? 'My bookings' : 'Create an account'}
          </Link>
        </div>

        <div className="flex gap-8 mt-9 flex-wrap relative z-10">
          <div className="flex flex-col">
            <b className="font-fraunces text-[26px] bg-[image:var(--grad-2)] bg-clip-text text-transparent">{rooms.length}+</b>
            <span className="text-xs text-[var(--muted)] tracking-[0.5px] uppercase font-bold">Room types</span>
          </div>
          <div className="flex flex-col">
            <b className="font-fraunces text-[26px] bg-[image:var(--grad-2)] bg-clip-text text-transparent">{halls.length}+</b>
            <span className="text-xs text-[var(--muted)] tracking-[0.5px] uppercase font-bold">Event halls</span>
          </div>
          <div className="flex flex-col">
            <b className="font-fraunces text-[26px] bg-[image:var(--grad-2)] bg-clip-text text-transparent">{meals.length}+</b>
            <span className="text-xs text-[var(--muted)] tracking-[0.5px] uppercase font-bold">Chef meals</span>
          </div>
          <div className="flex flex-col">
            <b className="font-fraunces text-[26px] bg-[image:var(--grad-2)] bg-clip-text text-transparent">24/7</b>
            <span className="text-xs text-[var(--muted)] tracking-[0.5px] uppercase font-bold">Reception</span>
          </div>
        </div>
      </section>

      {/* Rooms Section Preview */}
      <div className="mt-9">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Rooms</h2>
            <p className="m-0 mt-1 text-[var(--muted)] text-sm">Rest easy in our comfortable rooms.</p>
          </div>
          <Link href="/rooms" className="text-[var(--accent)] text-sm font-semibold no-underline hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-[22px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {rooms.slice(0, 3).map((room) => (
            <Card key={room.id} item={{ itemType: 'rooms', ...room }} actionLabel="Book" />
          ))}
        </div>
      </div>

      {/* Dining Section Preview */}
      <div className="mt-12">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Dining</h2>
            <p className="m-0 mt-1 text-[var(--muted)] text-sm">Freshly prepared meals daily.</p>
          </div>
          <Link href="/meals" className="text-[var(--accent)] text-sm font-semibold no-underline hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-[22px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {meals.slice(0, 3).map((meal) => (
            <Card key={meal.id} item={{ itemType: 'meals', ...meal }} actionLabel="View" />
          ))}
        </div>
      </div>

      {/* Event Halls Section Preview */}
      <div className="mt-12">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Meeting spaces</h2>
            <p className="m-0 mt-1 text-[var(--muted)] text-sm">For workshops, conferences & retreats.</p>
          </div>
          <Link href="/halls" className="text-[var(--accent)] text-sm font-semibold no-underline hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-[22px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {halls.slice(0, 3).map((hall) => (
            <Card key={hall.id} item={{ itemType: 'halls', ...hall }} actionLabel={hall.available ? 'Book' : 'Booked'} />
          ))}
        </div>
      </div>
    </div>
  );
}