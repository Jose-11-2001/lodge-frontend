'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';

interface NavItem {
  label: string;
  href: string;
  primary?: boolean;
}

export default function Header() {
  const { user, logout, theme, toggleTheme } = useLodge();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const getNavItems = (): NavItem[] => {
    if (!user) {
      return [
        { label: 'Rooms', href: '/rooms' },
        { label: 'Meals', href: '/meals' },
        { label: 'Halls', href: '/halls' },
        { label: 'Login', href: '/login' },
        { label: 'Get started', href: '/register', primary: true },
      ];
    }
    if (user.role === 'ADMIN') {
      return [
        { label: 'Dashboard', href: '/admin/dashboard' },
        { label: 'Rooms', href: '/admin/rooms' },
        { label: 'Meals', href: '/admin/meals' },
        { label: 'Halls', href: '/admin/halls' },
      ];
    }
    return [
      { label: 'Rooms', href: '/rooms' },
      { label: 'Meals', href: '/meals' },
      { label: 'Halls', href: '/halls' },
      { label: 'My Bookings', href: '/my-bookings' },
      { label: 'My Halls', href: '/my-hall-bookings' },
      { label: 'My Meals', href: '/my-meals' },
      { label: 'Feedback', href: '/feedback' },
    ];
  };

  const navItems = getNavItems();
  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    router.push('/');
  };

  const drawerBtn =
    'text-left bg-transparent border border-transparent text-[var(--text)] px-3.5 py-3 rounded-[10px] cursor-pointer text-sm font-medium no-underline hover:bg-[rgba(120,150,220,0.1)]';

  return (
    <>
      <header className="flex flex-row items-center justify-between gap-4 px-4 sm:px-7 py-3.5 bg-[var(--panel)] backdrop-blur-md border-b border-[var(--line)] sticky top-0 z-20 transition-colors">
        <Link className="flex items-center gap-2.5 shrink-0 cursor-pointer no-underline text-inherit" href="/">
          <div className="w-9 h-9 rounded-[11px] bg-[image:var(--grad-1)] flex items-center justify-center text-[19px] shadow-[var(--shadow-glow)] animate-[floatY_3.4s_ease-in-out_infinite]">
            🏨
          </div>
          <h1 className="m-0 flex items-center font-fraunces font-bold text-[20px] tracking-[0.3px] whitespace-nowrap">
            Lodge
            <em className="not-italic bg-[image:var(--grad-1)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[gradientShift_6s_ease_infinite]">
              App
            </em>
            <span className="hidden sm:inline-block font-sans text-[10px] tracking-[1px] font-bold text-[var(--accent)] border border-[rgba(110,168,255,0.4)] px-2 py-[3px] rounded-full ml-3 bg-[rgba(110,168,255,0.08)]">
              PROTOTYPE
            </span>
          </h1>
        </Link>

        {/* Desktop nav: same row as the logo, visible from 821px up */}
        <nav className="hidden min-[821px]:flex flex-row flex-wrap items-center justify-end gap-1.5">
          {navItems.map((item) => {
            let cls = 'px-4 py-[9px] rounded-full text-sm font-medium transition-all no-underline cursor-pointer whitespace-nowrap ';
            if (item.primary) {
              cls += 'bg-[image:var(--grad-2)] text-[#052018] font-semibold shadow-[0_8px_24px_rgba(34,211,168,0.25)]';
            } else if (isActive(item.href)) {
              cls += 'text-[#06142b] bg-[image:var(--grad-1)] font-semibold shadow-[var(--shadow-glow)]';
            } else {
              cls += 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[rgba(120,150,220,0.08)]';
            }
            return (
              <Link key={item.href} href={item.href} className={cls}>
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={toggleTheme}
            className="w-[38px] h-[38px] shrink-0 rounded-full flex items-center justify-center border border-[var(--line-2)] bg-[rgba(120,150,220,0.06)] text-[15px] cursor-pointer hover:border-[var(--accent)] transition-all"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {user && (
            <>
              <div className="inline-flex items-center gap-2 py-[5px] pl-1 lg:pl-3.5 pr-[5px] rounded-full border border-[var(--line-2)] bg-[rgba(120,150,220,0.06)] text-[13px] text-[var(--text)] ml-1">
                <span className="hidden lg:inline">{user.username}</span>
                <div className="w-7 h-7 rounded-full bg-[image:var(--grad-1)] flex items-center justify-center text-xs font-bold text-[#06142b]">
                  {user.username[0].toUpperCase()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-[9px] rounded-full text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] bg-transparent border border-transparent cursor-pointer whitespace-nowrap"
              >
                Logout
              </button>
            </>
          )}
        </nav>

        {/* Mobile hamburger: only up to 820px */}
        <button
          className="min-[821px]:hidden bg-transparent border-none text-[var(--text)] text-[22px] cursor-pointer p-1.5"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-[rgba(2,6,20,0.6)] backdrop-blur-sm z-40 min-[821px]:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[min(320px,85vw)] bg-[var(--bg)] border-l border-[var(--line)] p-6 z-50 flex flex-col gap-2 overflow-y-auto transition-transform duration-300 min-[821px]:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full border border-[var(--line-2)] bg-transparent text-[var(--text)] cursor-pointer flex items-center justify-center"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>
        <h3 className="m-0 mb-1 font-fraunces text-lg">Menu</h3>
        {user && <p className="m-0 mb-2.5 text-xs text-[var(--muted)]">Signed in as {user.username}</p>}
        <div className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={`${drawerBtn} ${isActive(item.href) ? 'bg-[rgba(120,150,220,0.14)] font-semibold' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => {
              toggleTheme();
              setDrawerOpen(false);
            }}
            className={drawerBtn}
          >
            {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
          </button>
          {user && (
            <button onClick={handleLogout} className={drawerBtn}>
              Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
}