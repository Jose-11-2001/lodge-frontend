'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';

export default function Toast() {
  const { toastMessage } = useLodge();

  if (!toastMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 bg-[var(--card)] backdrop-blur-md border px-5 py-3.5 rounded-[14px] z-[60] text-sm text-[var(--text)] shadow-[var(--shadow-md)] flex items-center gap-2.5 max-w-[380px] animate-pop ${
        toastMessage.err ? 'border-[rgba(255,107,126,0.5)]' : 'border-[var(--line-2)]'
      }`}
    >
      <div
        className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
          toastMessage.err
            ? 'bg-[linear-gradient(135deg,#ff6b7e,#ff9a6a)] text-[#2b0a0f]'
            : 'bg-[image:var(--grad-2)] text-[#052018]'
        }`}
      >
        {toastMessage.err ? '!' : '✓'}
      </div>
      <span>{toastMessage.msg}</span>
    </div>
  );
}