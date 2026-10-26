'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';

export default function Header() {
  const { user, logout, theme, toggleTheme } = useLodge();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const getNavItems = () => {
    if (!user) {
      return [
        { label: 'Rooms', href: '/rooms' },
        { label: 'Meals', href: '/meals' },
        { label: 'Halls', href: '/halls' },
        { label: 'Login', href: '/login' },
        { label: 'Get started', href: '/register', primary: true },
      ];
    } else if (user.role === 'ADMIN') {
      return [
        { label: 'Dashboard', href: '/admin/dashboard' },
        { label: 'Rooms', href: '/admin/rooms' },
        { label: 'Meals', href: '/admin/meals' },
        { label: 'Halls', href: '/admin/halls' },
      ];
    } else {
      return [
        { label: 'Rooms', href: '/rooms' },
        { label: 'Meals', href: '/meals' },
        { label: 'Halls', href: '/halls' },
        { label: 'My Bookings', href: '/my-bookings' },
        { label: 'My Halls', href: '/my-hall-bookings' },
        { label: 'Feedback', href: '/feedback' },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      <header className="flex items-center justify-between px-7 py-3.5 bg-[rgba(10,15,30,0.55)] backdrop-blur-md border-b border-[var(--line)] sticky top-0 z-20 transition-colors">
        <Link className="flex items-center gap-2.5 cursor-pointer no-underline text-inherit" href="/">
          <div className="w-9 h-9 rounded-[11px] bg-[image:var(--grad-1)] flex items-center justify-center text-lg shadow-[var(--shadow-glow)] animate-bounce">
            🏨
          </div>
          <h1 className="m-0 font-fraunces font-bold text-[20px] tracking-[0.3px]">
            Lodge<em className="not-italic bg-[image:var(--grad-1)] bg-[length:200%_100%] bg-clip-text text-transparent">App</em>
            <span className="text-[10px] tracking-[1px] font-bold text-[var(--accent)] border border-[rgba(110,168,255,0.4)] px-2 py-0.5 rounded-full ml-2 bg-[rgba(110,168,255,0.08)]">
              PROTOTYPE
            </span>
          </h1>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            let btnClass = "px-4 py-2 rounded-full text-sm font-medium transition-all no-underline cursor-pointer ";
            if (item.primary) {
              btnClass += "bg-[image:var(--grad-2)] text-[#052018] font-semibold border-none shadow-[0_8px_24px_rgba(34,211,168,0.25)]";
            } else if (isActive) {
              btnClass += "text-[#06142b] bg-[image:var(--grad-1)] font-semibold shadow-[var(--shadow-glow)]";
            } else {
              btnClass += "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[rgba(120,150,220,0.08)]";
            }
            return (
              <Link key={item.href} href={item.href} className={btnClass}>
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={toggleTheme}
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center border border-[var(--line-2)] bg-[rgba(120,150,220,0.06)] text-base cursor-pointer hover:border-[var(--accent)] transition-all ml-1"
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {user && (
            <>
              <div className="inline-flex items-center gap-2 py-1 pl-3.5 pr-2 rounded-full border border-[var(--line-2)] bg-[rgba(120,150,220,0.06)] text-[13px] text-[var(--text)] ml-1">
                <div className="w-7 h-7 rounded-full bg-[image:var(--grad-1)] flex items-center justify-center text-xs font-bold text-[#06142b]">
                  {user.username[0].toUpperCase()}
                </div>
                <span>{user.username}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="px-4 py-2 rounded-full text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] bg-transparent border border-transparent cursor-pointer"
              >
                Logout
              </button>
            </>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden bg-transparent border-none text-[var(--text)] text-[22px] cursor-pointer p-1.5"
          onClick={() => setDrawerOpen(true)}
        >
          ☰
        </button>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-[rgba(2,6,20,0.6)] backdrop-blur-sm z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[min(320px,85vw)] bg-[var(--panel)] backdrop-blur-xl border-l border-[var(--line)] p-6 z-50 flex flex-col gap-2 transition-transform duration-300 md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full border border-[var(--line-2)] bg-transparent text-[var(--text)] cursor-pointer flex items-center justify-center"
          onClick={() => setDrawerOpen(false)}
        >
          ✕
        </button>
        <h3 className="m-0 mb-3.5 font-fraunces text-lg">Menu</h3>
        <div className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className="text-left bg-transparent border border-transparent text-[var(--text)] px-3.5 py-3 rounded-[10px] cursor-pointer text-sm font-medium no-underline hover:bg-[rgba(120,150,220,0.1)]"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => {
                logout();
                setDrawerOpen(false);
                router.push('/');
              }}
              className="text-left bg-transparent border border-transparent text-[var(--text)] px-3.5 py-3 rounded-[10px] cursor-pointer text-sm font-medium hover:bg-[rgba(120,150,220,0.1)]"
            >
              Logout
            </button>
          )}
          <button
            onClick={() => {
              toggleTheme();
              setDrawerOpen(false);
            }}
            className="text-left bg-transparent border border-transparent text-[var(--text)] px-3.5 py-3 rounded-[10px] cursor-pointer text-sm font-medium hover:bg-[rgba(120,150,220,0.1)]"
          >
            {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
          </button>
        </div>
      </aside>
    </>
  );
}