'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import ImageField from '@/components/ImageField';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { imageUrl } from '@/lib/api';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'list' | 'image';
  options?: string[];
  placeholder?: string;
  optional?: boolean;
}

export interface ColumnDef<T> {
  label: string;
  render: (item: T) => React.ReactNode;
}

interface Props<T extends { id: number; name: string; primaryImage?: string }> {
  title: string;
  subtitle: string;
  icon?: string;
  noun: string;
  emptyText: string;
  items: T[];
  fields: FieldDef[];
  columns: ColumnDef<T>[];
  onCreate: (values: Record<string, unknown>) => Promise<void> | void;
  onUpdate: (item: T, values: Record<string, unknown>) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
  notify: (msg: string, err?: boolean) => void;
}

// Form state can hold strings (normal fields) or a File (image field, new upload)
type FormValues = Record<string, string | File | undefined>;

export default function CrudManager<
  T extends { id: number; name: string; primaryImage?: string }
>({
  title,
  subtitle,
  icon,
  noun,
  emptyText,
  items,
  fields,
  columns,
  onCreate,
  onUpdate,
  onDelete,
  notify,
}: Props<T>) {
  const admin = useRequireAdmin();
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [form, setForm] = useState<FormValues>({});
  const [busy, setBusy] = useState(false);

  if (!admin) return null;

  const open = (item?: T) => {
    const next: FormValues = {};
    fields.forEach((f) => {
      if (f.type === 'image') {
        // For image fields: store the existing URL string (or '' if none).
        // A new File will replace this when the user picks one.
        const existing = item
          ? (item as unknown as Record<string, unknown>)[f.key]
          : undefined;
        next[f.key] = typeof existing === 'string' ? existing : '';
        return;
      }
      const raw = item
        ? (item as unknown as Record<string, unknown>)[f.key]
        : undefined;
      if (Array.isArray(raw)) next[f.key] = raw.join(', ');
      else if (raw !== undefined && raw !== null) next[f.key] = String(raw);
      else next[f.key] = f.type === 'select' ? f.options?.[0] ?? '' : '';
    });
    setForm(next);
    setEditing(item ?? 'new');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const values: Record<string, unknown> = {};
      fields.forEach((f) => {
        const rawValue = form[f.key];

        // ── image field: keep the File object if one was chosen ──
        if (f.type === 'image') {
          if (rawValue instanceof File) {
            values[f.key] = rawValue;                 // new upload → File
          } else if (typeof rawValue === 'string' && rawValue.trim()) {
            values[f.key] = rawValue.trim();          // existing URL (unchanged)
          } else if (!f.optional) {
            throw new Error(`${f.label} is required`);
          } else {
            values[f.key] = undefined;
          }
          return;
        }

        const raw =
          typeof rawValue === 'string' ? rawValue.trim() : '';

        if (!raw && !f.optional)
          throw new Error(`${f.label} is required`);

        if (f.type === 'number') {
          const n = Number(raw);
          if (Number.isNaN(n) || n < 0)
            throw new Error(`${f.label} must be a valid number`);
          values[f.key] = n;
        } else if (f.type === 'list') {
          values[f.key] = raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          values[f.key] = raw;
        }
      });

      if (editing === 'new') {
        await onCreate(values);
        notify(`${noun} added`);
      } else if (editing) {
        await onUpdate(editing, values);
        notify(`${noun} updated`);
      }
      setEditing(null);
    } catch (err) {
      notify((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: T) => {
    if (window.confirm(`Delete "${item.name}"? This cannot be undone.`)) {
      try {
        await onDelete(item.id);
        notify(`${noun} deleted`);
      } catch (err) {
        notify((err as Error).message, true);
      }
    }
  };

  // Build the value passed into ImageField. If the form slot holds a File,
  // build a fresh blob URL for preview (revoked on unmount by the browser).
  const imageFieldValue = (v: string | File | undefined): string => {
    if (v instanceof File) return URL.createObjectURL(v);
    if (typeof v === 'string') return v;
    return '';
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">
            {icon ? `${icon} ` : ''}
            {title}
          </h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Link href="/admin/dashboard" className="btn btn-ghost no-underline">
            &larr; Dashboard
          </Link>
          <button className="btn btn-primary" onClick={() => open()}>
            + New {noun}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">{emptyText}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{noun}</th>
                {columns.map((c, i) => (
                  <th key={`${c.label}-${i}`}>{c.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-12 rounded-lg bg-cover bg-center border border-[var(--line)] shrink-0"
                        style={{
                          backgroundImage: `url('${imageUrl(item.primaryImage)}')`,
                        }}
                      />
                      <b>{item.name}</b>
                    </div>
                  </td>
                  {columns.map((c, i) => (
                    <td key={`${c.label}-${i}`}>{c.render(item)}</td>
                  ))}
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '6px 14px' }}
                        onClick={() => open(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 14px' }}
                        onClick={() => remove(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={editing !== null}
        onClose={() => !busy && setEditing(null)}
        title={editing === 'new' ? `New ${noun}` : `Edit ${noun}`}
      >
        <form onSubmit={submit}>
          {fields.map((f) => {
            const id = `field-${f.key}`;
            return (
              <div className="field" key={f.key}>
                <label htmlFor={id}>
                  {f.label}
                  {f.optional ? ' (optional)' : ''}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={id}
                    rows={3}
                    value={
                      typeof form[f.key] === 'string'
                        ? (form[f.key] as string)
                        : ''
                    }
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  />
                ) : f.type === 'select' ? (
                  <select
                    id={id}
                    value={
                      typeof form[f.key] === 'string'
                        ? (form[f.key] as string)
                        : ''
                    }
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  >
                    {(f.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'image' ? (
                  <ImageField
                    value={imageFieldValue(form[f.key])}
                    onChange={(file) => {
                      // ImageField calls onChange(File) for a new pick, or
                      // onChange(null) if the user removes the existing image.
                      setForm({
                        ...form,
                        [f.key]: file ?? '',   // null → '' (no image)
                      });
                    }}
                    onError={(msg) => notify(msg, true)}
                  />
                ) : (
                  <input
                    id={id}
                    type={f.type === 'number' ? 'number' : 'text'}
                    min={f.type === 'number' ? 0 : undefined}
                    step={f.type === 'number' ? 'any' : undefined}
                    value={
                      typeof form[f.key] === 'string'
                        ? (form[f.key] as string)
                        : ''
                    }
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  />
                )}
              </div>
            );
          })}
          <div className="btn-row">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}