'use client';

import React from 'react';
import { useLodge } from '@/context/LodgeContext';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import CrudManager from '@/components/CrudManager';
import { money } from '@/lib/format';
import { Meal } from '@/types';

export default function AdminMealsPage() {
  const admin = useRequireAdmin();
  const { initializing, meals, createMeal, updateMeal, deleteMeal, showToast } = useLodge();

  if (initializing) return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  if (!admin) return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;

  return (
    <CrudManager<Meal>
      title="Manage Meals"
      subtitle="Add dishes, set prices and upload photos."
      //icon="🍽️"
      noun="Meal"
      emptyText="No meals yet."
      items={meals}
      notify={showToast}
      fields={[
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'mealType', label: 'Meal type', type: 'select', options: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'price', label: 'Price (K)', type: 'number' },
        { key: 'primaryImage', label: 'Photo', type: 'image' },
      ]}
      columns={[
        { label: 'Type', render: (m) => <span className="badge">{m.mealType}</span> },
        { label: 'Price', render: (m) => money(m.price) },
        { label: 'Description', render: (m) => m.description },
      ]}
      onCreate={async (v) => {
        try {
          await createMeal(v as unknown as Omit<Meal, 'id'>);
          showToast('Meal added');
        } catch (err) {
          showToast((err as Error).message, true);
          throw err;
        }
      }}
      onUpdate={async (meal, v) => {
        try {
          await updateMeal(meal.id, v as Partial<Meal>);
          showToast('Meal updated');
        } catch (err) {
          showToast((err as Error).message, true);
          throw err;
        }
      }}
      onDelete={async (id) => {
        try {
          await deleteMeal(id);
          showToast('Meal deleted');
        } catch (err) {
          showToast((err as Error).message, true);
          throw err;
        }
      }}
    />
  );
}