'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-[rgba(2,6,20,0.7)] backdrop-blur-md flex items-center justify-center p-5 z-50 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[linear-gradient(180deg,#141d33,#0f1830)] border border-[var(--line-2)] rounded-[20px] p-6 max-w-[560px] w-full max-h-[90vh] overflow-y-auto shadow-[var(--shadow-md)] animate-pop">
        <h3 className="m-0 mb-4.5 font-fraunces font-bold text-[22px] tracking-wide">{title}</h3>
        {children}
      </div>
    </div>
  );
}