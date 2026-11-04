'use client';

import React, { useEffect, useState } from 'react';
import { useLodge } from '@/context/LodgeContext';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { API_BASE } from '@/lib/api';

export default function AdminSettingsPage() {
  const admin = useRequireAdmin();
  const { initializing, lodgeName, logoUrl, updateLodgeName, uploadLogo, showToast } = useLodge();

  const [nameInput, setNameInput] = useState(lodgeName);
  const [savingName, setSavingName] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  useEffect(() => {
    setNameInput(lodgeName);
  }, [lodgeName]);

  if (initializing) return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  if (!admin) return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;

  const logoSrc = logoUrl
    ? logoUrl.startsWith('http') ? logoUrl : `${API_BASE}${logoUrl}`
    : null;

  const onSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return showToast('Lodge name cannot be empty', true);
    setSavingName(true);
    try {
      await updateLodgeName(trimmed);
      showToast('Lodge name updated');
    } catch (err) {
      showToast((err as Error).message, true);
    } finally {
      setSavingName(false);
    }
  };

  const onUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      showToast('Logo must be under 2 MB', true);
      return;
    }
    setSavingLogo(true);
    try {
      await uploadLogo(f);
      showToast('Logo updated');
    } catch (err) {
      showToast((err as Error).message, true);
    } finally {
      setSavingLogo(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight mb-6">
        Site settings
      </h2>

      <div className="bg-white border border-[var(--line)] rounded-2xl p-6 mb-6 max-w-xl">
        <h3 className="m-0 mb-4 font-fraunces font-semibold text-lg">
          Lodge name
        </h3>
        <form onSubmit={onSaveName} className="flex gap-3 flex-wrap items-end">
          <div className="field flex-1 min-w-[220px] mb-0">
            <label>Name shown in the header</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={120}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={savingName || nameInput.trim() === lodgeName}
          >
            {savingName ? 'Saving…' : 'Save name'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-[var(--line)] rounded-2xl p-6 max-w-xl">
        <h3 className="m-0 mb-4 font-fraunces font-semibold text-lg">
          Logo
        </h3>

        <div className="flex items-center gap-4 mb-4">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Current logo"
              className="w-16 h-16 object-cover rounded-xl border border-[var(--line)]"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl border border-[var(--line)] bg-[#111827]" />
          )}
          <p className="m-0 text-sm text-[var(--muted)]">
            {logoSrc ? 'This is the current logo.' : 'No logo uploaded yet — using the default mark.'}
          </p>
        </div>

        <label className="btn btn-ghost cursor-pointer">
          {savingLogo ? 'Uploading…' : 'Choose image…'}
          <input
            type="file"
            accept="image/*"
            onChange={onUploadLogo}
            disabled={savingLogo}
            className="hidden"
          />
        </label>
        <p className="text-xs text-[var(--muted)] mt-3">
          PNG, JPG, or SVG. Square images look best. Max 2 MB.
        </p>
      </div>
    </div>
  );
}