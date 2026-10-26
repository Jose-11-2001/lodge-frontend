'use client';

import React from 'react';

interface ChipOption {
  label: string;
  value: string | boolean;
}

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  chips?: ChipOption[];
  activeChip?: string | boolean;
  onChipChange?: (val: any) => void;
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  chips,
  activeChip,
  onChipChange,
}: FilterBarProps) {
  return (
    <div className="flex gap-2.5 flex-wrap p-3.5 bg-[var(--panel)] border border-[var(--line)] rounded-2xl mb-5.5 backdrop-blur-md">
      {onSearchChange !== undefined && (
        <input
          type="text"
          placeholder="🔍 Search by name..."
          value={searchValue || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl border border-[var(--line-2)] bg-[rgba(10,15,30,0.55)] text-[var(--text)] text-sm outline-none focus:border-[var(--accent)]"
        />
      )}

      {chips && onChipChange && (
        <div className="flex gap-1.5 flex-wrap">
          {chips.map((chip, idx) => {
            const isActive = activeChip === chip.value;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChipChange(chip.value)}
                className={`px-3.5 py-2 rounded-full cursor-pointer border text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[image:var(--grad-1)] text-[#06142b] border-transparent shadow-[var(--shadow-glow)]'
                    : 'bg-[rgba(120,150,220,0.06)] border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-2)] hover:text-[var(--text)]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}