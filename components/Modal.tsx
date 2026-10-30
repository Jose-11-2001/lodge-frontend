'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(2,6,20,0.7)] backdrop-blur-md flex items-center justify-center p-5 z-50 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-[var(--bg)] border border-[var(--line-2)] rounded-[20px] p-6 max-w-[560px] w-full max-h-[90vh] overflow-y-auto shadow-[var(--shadow-md)] animate-pop"
      >
        <h3 className="m-0 mb-[18px] font-fraunces font-bold text-[22px] tracking-wide">{title}</h3>
        {children}
      </div>
    </div>
  );
}