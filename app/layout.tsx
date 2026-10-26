import type { Metadata } from 'next';
import './globals.css';
import { LodgeProvider } from '@/context/LodgeContext';
import Header from '@/components/Header';
import Toast from '@/components/Toast';

export const metadata: Metadata = {
  title: 'LodgeApp — Stay. Meet. Dine.',
  description: 'Book rooms, conference halls, and chef-made meals in a single dashboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LodgeProvider>
          <div className="aurora" />
          <Header />
          <main className="max-w-[1240px] mx-auto px-6 pt-8 pb-20 animate-fadeIn">
            {children}
          </main>
          <Toast />
        </LodgeProvider>
      </body>
    </html>
  );
}
