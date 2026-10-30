'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';

const resize = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a valid image'));
      img.onload = () => {
        const scale = Math.min(1, 900 / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

export default function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { showToast } = useLodge();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
      if (file.size > 8 * 1024 * 1024) throw new Error('Image is too large (max 8MB)');
      onChange(await resize(file));
    } catch (err) {
      showToast((err as Error).message, true);
    }
  };

  return (
    <div>
      {value ? (
        <div
          className="h-[160px] rounded-xl bg-cover bg-center border border-[var(--line-2)] mb-2.5"
          style={{ backgroundImage: `url('${value}')` }}
        />
      ) : (
        <div className="h-[100px] rounded-xl border border-dashed border-[var(--line-2)] mb-2.5 grid place-items-center text-sm text-[var(--muted)]">
          No photo yet
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <label className="btn btn-ghost cursor-pointer" style={{ padding: '8px 14px' }}>
          📷 {value ? 'Change photo' : 'Upload photo'}
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
        {value && (
          <button type="button" className="btn btn-danger" style={{ padding: '8px 14px' }} onClick={() => onChange('')}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}