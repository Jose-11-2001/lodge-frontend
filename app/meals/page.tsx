'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';
import Card from '@/components/Card';
import FilterBar from '@/components/FilterBar';
import Modal from '@/components/Modal';
import { Meal } from '@/types';

const localDT = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function MealOrderForm({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const { createMealOrder, showToast } = useLodge();
  const router = useRouter();

  const start0 = new Date();
  start0.setMinutes(0, 0, 0);
  const [quantity, setQuantity] = useState(1);
  const [serveAt, setServeAt] = useState(
    localDT(new Date(start0.getTime() + 3600000))
  );
  const [submitting, setSubmitting] = useState(false);

  const total = meal.price * quantity;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (quantity < 1) throw new Error('Quantity must be at least 1');
      setSubmitting(true);
      await createMealOrder({
        mealId: meal.id,
        quantity,
        serveAt: new Date(serveAt).toISOString(),
      });
      showToast('Meal ordered. See it in My Meals.');
      onClose();
      router.push('/my-meals');
    } catch (err) {
      showToast((err as Error).message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <p className="m-0 mb-4 text-sm text-[var(--muted)]">
        {meal.name} · {meal.description || '—'}
      </p>

      <div className="field">
        <label>Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          required
        />
      </div>

      <div className="field">
        <label>Serve at</label>
        <input
          type="datetime-local"
          min={localDT(new Date())}
          value={serveAt}
          onChange={(e) => setServeAt(e.target.value)}
          required
        />
      </div>

      <p className="text-sm text-[var(--muted)] m-0">
        Total <b className="text-[var(--text)]">K {total.toFixed(2)}</b>
      </p>

      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Placing…' : 'Confirm order'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function MealsPage() {
  const { meals, user, showToast } = useLodge();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | boolean>('all');
  const [selected, setSelected] = useState<Meal | null>(null);

  const shown = meals.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const order = (meal: Meal) => {
    if (!user) {
      showToast('Please log in to order', true);
      router.push('/login');
      return;
    }
    setSelected(meal);
  };

  return (
    <div>
      <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Dining</h2>
      <p className="mt-1 mb-6 text-sm text-[var(--muted)]">
        Freshly prepared meals daily.
      </p>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        chips={[{ label: 'All', value: 'all' }]}
        activeChip={filter}
        onChipChange={setFilter}
      />

      {shown.length === 0 ? (
        <div className="empty">
          <div className="ico"></div>
          No meals match your search.
        </div>
      ) : (
        <div className="grid gap-[22px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {shown.map((meal) => (
            <Card
              key={meal.id}
              item={{ itemType: 'meals', ...meal }}
              actionLabel="Order"
              onAction={() => order(meal)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.name}` : ''}
      >
        {selected && <MealOrderForm meal={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </div>
  );
}