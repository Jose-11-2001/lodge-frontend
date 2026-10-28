import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LodgeProvider } from '@/context/LodgeContext';
import Header from '@/components/Header';
import Toast from '@/components/Toast';

export const metadata: Metadata = {
  title: 'LodgeApp — Stay. Meet. Dine.',
  description: 'Book rooms, conference halls, and chef-made meals in a single dashboard.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Runs before the page paints, so light-mode users don't see a dark flash on load.
const themeScript = `
  try {
    var t = localStorage.getItem('lodge_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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