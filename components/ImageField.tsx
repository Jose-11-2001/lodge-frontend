'use client';

import React, { useState } from 'react';
import { imageUrl } from '@/lib/api';

const resize = (file: File): Promise<Blob> =>
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
        canvas
          .getContext('2d')!
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error('Could not encode image')),
          'image/jpeg',
          0.8
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

interface Props {
  /** current value (either a URL returned by the backend, or empty) */
  value: string;
  /** called with the chosen File so the parent can upload it */
  onChange: (file: File | null) => void;
  onError?: (msg: string) => void;
}

export default function ImageField({ value, onChange, onError }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (!file.type.startsWith('image/'))
        throw new Error('Please choose an image file');
      if (file.size > 8 * 1024 * 1024)
        throw new Error('Image is too large (max 8MB)');
      const blob = await resize(file);
      const resized = new File([blob], file.name, { type: 'image/jpeg' });
      setPreview(URL.createObjectURL(resized));
      onChange(resized);
    } catch (err) {
      onError?.((err as Error).message);
    }
  };

  const shown = preview ?? (value ? imageUrl(value) : null);

  return (
    <div>
      {shown ? (
        <div
          className="h-[160px] rounded-xl bg-cover bg-center border border-[var(--line-2)] mb-2.5"
          style={{ backgroundImage: `url('${shown}')` }}
        />
      ) : (
        <div className="h-[100px] rounded-xl border border-dashed border-[var(--line-2)] mb-2.5 grid place-items-center text-sm text-[var(--muted)]">
          No photo yet
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <label
          className="btn btn-ghost cursor-pointer"
          style={{ padding: '8px 14px' }}
        >
          {shown ? 'Change photo' : 'Upload photo'}
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
        </label>
        {shown && (
          <button
            type="button"
            className="btn btn-danger"
            style={{ padding: '8px 14px' }}
            onClick={() => {
              setPreview(null);
              onChange(null);
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}