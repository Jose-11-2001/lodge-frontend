'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { money } from '@/lib/format';

interface PayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  amount: number;
  onPay: (method: string) => void;
}

export default function PayModal({ isOpen, onClose, title, amount, onPay }: PayModalProps) {
  const [method, setMethod] = useState('PAYCHANGU');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onPay(method);
        }}
      >
        <p className="m-0 text-sm text-[var(--muted)]">
          Amount due: <b className="text-[var(--text)]">{money(amount)}</b>
        </p>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Payment method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="PAYCHANGU">PayChangu</option>
            <option value="CARD">Card</option>
            <option value="CASH">Cash</option>
          </select>
        </div>
        <div className="btn-row">
          <button className="btn btn-gold" type="submit">💳 Pay now</button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}