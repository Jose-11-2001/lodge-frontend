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
  const [quantity, setQuantity] = useState(1);
  const [serveAt, setServeAt] = useState(localDT(new Date(Date.now() + 3600000)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (quantity < 1) throw new Error('Quantity must be at least 1');
      createMealOrder({ mealId: meal.id, quantity, serveAt });
      showToast('Meal ordered. See it in My Meals.');
      onClose();
      router.push('/my-meals');
    } catch (err) {
      showToast((err as Error).message, true);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="field"><label>Quantity</label>
        <input type="number" min={1} max={50} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></div>
      <div className="field"><label>Serve at</label>
        <input type="datetime-local" min={localDT(new Date())} value={serveAt} onChange={(e) => setServeAt(e.target.value)} /></div>
      <p className="text-sm text-[var(--muted)] m-0">
        Total <b className="text-[var(--text)]">K {(meal.price * quantity).toFixed(2)}</b>
      </p>
      <div className="btn-row">
        <button className="btn btn-primary" type="submit">Place order</button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

export default function MealsPage() {
  const { meals, user, showToast } = useLodge();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | boolean>('all');
  const [selected, setSelected] = useState<Meal | null>(null);

  const shown = meals.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) && (type === 'all' || m.mealType === type));

  const order = (meal: Meal) => {
    if (!user) {
      showToast('Please log in to order a meal', true);
      router.push('/login');
      return;
    }
    setSelected(meal);
  };

  return (
    <div>
      <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Dining</h2>
      <p className="mt-1 mb-6 text-sm text-[var(--muted)]">Freshly prepared meals. Log in only when you want to order.</p>

      <FilterBar
        searchValue={search} onSearchChange={setSearch}
        chips={[
          { label: 'All', value: 'all' }, { label: 'Breakfast', value: 'BREAKFAST' },
          { label: 'Lunch', value: 'LUNCH' }, { label: 'Dinner', value: 'DINNER' },
          { label: 'Snack', value: 'SNACK' },
        ]}
        activeChip={type} onChipChange={setType}
      />

      {shown.length === 0 ? (
        <div className="empty"><div className="ico">🍽️</div>No meals match your search.</div>
      ) : (
        <div className="grid gap-[22px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {shown.map((meal) => (
            <Card key={meal.id} item={{ itemType: 'meals', ...meal }} actionLabel="Order" onAction={() => order(meal)} />
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Order ${selected.name}` : ''}>
        {selected && <MealOrderForm meal={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </div>
  );
}