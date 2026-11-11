'use client';

import React, { useEffect, useState } from 'react';
import type { Room, Meal, Hall } from '@/lib/models';
import { imageUrl } from '@/lib/api';

type CardItem =
  | ({ itemType: 'rooms' } & Room)
  | ({ itemType: 'meals' } & Meal)
  | ({ itemType: 'halls' } & Hall);

interface CardProps {
  item: CardItem;
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
  rating?: { avg: number; count: number };
  onRatingClick?: () => void;
}

export default function Card({
  item,
  onAction,
  actionLabel,
  disabled,
  rating,
  onRatingClick,
}: CardProps) {
  const img = imageUrl(item.primaryImage);
  const [zoomOpen, setZoomOpen] = useState(false);

  const tag =
    item.itemType === 'rooms'
      ? 'ROOM'
      : item.itemType === 'meals'
      ? item.mealType ?? 'MEAL'
      : 'HALL';

  const formatMoney = (val: number) => `K ${val.toFixed(2)}`;

  
  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoomOpen]);

  return (
    <>
      <div className="bg-[var(--card)] backdrop-blur-md border border-[var(--line)] rounded-[var(--radius)] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--line-2)] hover:shadow-[var(--shadow-md)] shadow-[var(--shadow-sm)]">
        {/* Thumbnail — clickable to open zoom */}
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={`View photo of ${item.name}`}
          className="h-[180px] relative overflow-hidden bg-cover bg-center transition-transform duration-500 hover:scale-105 cursor-zoom-in border-none p-0 text-left w-full"
          style={{ backgroundImage: `url('${img}')` }}
        >
          <span className="absolute top-3 left-3 z-10 text-[10.5px] font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-[rgba(0,0,0,0.6)] text-white backdrop-blur-md border border-[rgba(255,255,255,0.15)]">
            {tag}
          </span>

          {item.itemType === 'rooms' && (
            <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(0,0,0,0.6)] text-white text-xs font-semibold backdrop-blur-md">
              <span
                className={`w-[7px] h-[7px] rounded-full ${
                  item.availableRooms > 0
                    ? 'bg-[#22d3a8] shadow-[0_0_8px_#22d3a8] animate-pulse'
                    : 'bg-[#ff6b7e]'
                }`}
              />
              <span>
                {item.availableRooms > 0
                  ? `${item.availableRooms} left`
                  : 'Sold out'}
              </span>
            </div>
          )}

          {item.itemType === 'halls' && (
            <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(0,0,0,0.6)] text-white text-xs font-semibold backdrop-blur-md">
              <span
                className={`w-[7px] h-[7px] rounded-full ${
                  item.available === false
                    ? 'bg-[#ff6b7e]'
                    : 'bg-[#22d3a8] shadow-[0_0_8px_#22d3a8] animate-pulse'
                }`}
              />
              <span>{item.available === false ? 'Booked' : 'Available'}</span>
            </div>
          )}

          {/* Small zoom hint on hover */}
          <span className="absolute bottom-3 right-3 z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[rgba(0,0,0,0.6)] text-white backdrop-blur-md border border-[rgba(255,255,255,0.15)] opacity-0 group-hover:opacity-100 transition-opacity">
            Zoom
          </span>
        </button>

        {/* Body */}
        <div className="p-5 flex flex-col gap-2.5 flex-1">
          <h3 className="m-0 text-lg font-bold tracking-tight">{item.name}</h3>
          <p className="text-[var(--muted)] text-[13.5px] leading-relaxed m-0 line-clamp-2">
            {item.description || '—'}
          </p>

          {rating && (
            <button
              type="button"
              onClick={onRatingClick}
              className="self-start bg-transparent border-none p-0 text-[13px] cursor-pointer text-[var(--muted)] hover:text-[var(--text)]"
            >
              {rating.count > 0 ? (
                <>
                  <span className="stars" style={{ fontSize: 13 }}>
                    ★
                  </span>{' '}
                  <b className="text-[var(--text)]">{rating.avg.toFixed(1)}</b>{' '}
                  · {rating.count} review{rating.count > 1 ? 's' : ''}
                </>
              ) : (
                'No reviews yet'
              )}
            </button>
          )}

          <div className="flex gap-1.5 flex-wrap text-xs text-[var(--muted)]">
            {item.itemType === 'rooms' && (
              <>
                {item.building && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[rgba(120,150,220,0.1)] border border-[var(--line)]">
                    {item.building}
                  </span>
                )}
                {item.amenities?.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[rgba(120,150,220,0.1)] border border-[var(--line)]">
                    {item.amenities.slice(0, 3).join(' · ')}
                  </span>
                )}
              </>
            )}
            {item.itemType === 'meals' && (
              <span className="px-2.5 py-0.5 rounded-full bg-[rgba(120,150,220,0.1)] border border-[var(--line)]">
                {item.mealType ?? 'Meal'}
              </span>
            )}
            {item.itemType === 'halls' && (
              <>
                <span className="px-2.5 py-0.5 rounded-full bg-[rgba(120,150,220,0.1)] border border-[var(--line)]">
                  {item.capacity} seats
                </span>
                {item.building && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[rgba(120,150,220,0.1)] border border-[var(--line)]">
                    {item.building}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-2.5 mt-auto pt-2.5">
            <div className="font-fraunces font-bold text-[22px] bg-[image:var(--grad-2)] bg-clip-text text-transparent">
              {item.itemType === 'rooms' && formatMoney(item.pricePerNight)}
              {item.itemType === 'meals' && formatMoney(item.price)}
              {item.itemType === 'halls' && formatMoney(item.pricePerHour)}
              <small className="font-sans text-xs font-medium text-[var(--muted)] ml-0.5">
                {item.itemType === 'rooms'
                  ? '/ night'
                  : item.itemType === 'meals'
                  ? 'each'
                  : '/ hour'}
              </small>
            </div>

            {onAction && (
              <button
                onClick={onAction}
                disabled={disabled}
                className="px-4 py-2 rounded-xl font-semibold text-sm border-none bg-[image:var(--grad-1)] text-[#06142b] shadow-[0_8px_24px_rgba(110,168,255,0.3)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
              >
                {actionLabel || (item.itemType === 'meals' ? 'View' : 'Book')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Zoom lightbox ─────────────────────────────── */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo of ${item.name}`}
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomOpen(false);
            }}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl font-bold grid place-items-center border border-white/20 backdrop-blur-md cursor-pointer"
          >
            ×
          </button>

          <img
            src={img}
            alt={item.name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[90vh] rounded-xl object-contain shadow-2xl border border-white/10 cursor-default"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-white text-sm font-semibold backdrop-blur-md border border-white/10">
            {item.name}
          </div>
        </div>
      )}
    </>
  );
}