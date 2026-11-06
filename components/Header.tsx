'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth, authApi, API_BASE } from '@/lib/api';
import { useLodge } from '@/context/LodgeContext';

interface NavItem {
  label: string;
  href: string;
  primary?: boolean;
}

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { lodgeName, logoUrl } = useLodge();

  const role = auth.role();
  const username = auth.username();

  const logoSrc = logoUrl
    ? (logoUrl.startsWith('http') ? logoUrl : `${API_BASE}${logoUrl}`)
    : null;

  const getNavItems = (): NavItem[] => {
    if (!auth.isLoggedIn()) {
      return [
        { label: 'Rooms', href: '/rooms' },
        { label: 'Meals', href: '/meals' },
        { label: 'Halls', href: '/halls' },
        { label: 'Login', href: '/login' },
        { label: 'Get started', href: '/register', primary: true },
      ];
    }
    if (role === 'ADMIN') {
      return [
        { label: 'Dashboard', href: '/admin/dashboard' },
        { label: 'Rooms', href: '/admin/rooms' },
        { label: 'Meals', href: '/admin/meals' },
        { label: 'Halls', href: '/admin/halls' },
        { label: 'Bookings', href: '/admin/bookings' },
        { label: 'Feedback', href: '/admin/feedback' },
        { label: 'Notifications', href: '/notifications' },   {/* ← ADDED */}
        { label: 'Settings', href: '/admin/settings' },
      ];
    }
    return [
      { label: 'Rooms', href: '/rooms' },
      { label: 'Meals', href: '/meals' },
      { label: 'Halls', href: '/halls' },
      { label: 'My Bookings', href: '/my-bookings' },
      { label: 'My Halls', href: '/my-hall-bookings' },
      { label: 'Notifications', href: '/notifications' },
    ];
  };

  const navItems = getNavItems();
  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    authApi.logout();
    setDrawerOpen(false);
    router.push('/');
  };

  const drawerBtn =
    'text-left bg-transparent border border-transparent text-[var(--text)] px-3.5 py-3 rounded-[10px] cursor-pointer text-sm font-medium no-underline hover:bg-[rgba(120,150,220,0.1)]';

  return (
    <>
      <header className="flex flex-row items-center justify-between gap-4 px-4 sm:px-7 py-3.5 bg-[var(--panel)] backdrop-blur-md border-b border-[var(--line)] sticky top-0 z-20">
        <Link
          className="flex items-center gap-2.5 shrink-0 cursor-pointer no-underline text-inherit"
          href="/"
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={`${lodgeName} logo`}
              className="w-9 h-9 rounded-[11px] object-cover border border-[var(--line)]"
            />
          ) : (
            <div className="w-9 h-9 rounded-[11px] bg-[#111827] flex items-center justify-center text-[19px]" />
          )}
          <h1 className="m-0 flex items-center font-fraunces font-bold text-[20px] tracking-[0.3px] whitespace-nowrap">
            {lodgeName}
          </h1>
        </Link>

        <nav className="hidden min-[821px]:flex flex-row flex-wrap items-center justify-end gap-1.5">
          {navItems.map((item) => {
            let cls =
              'px-4 py-[9px] rounded-full text-sm font-medium transition-all no-underline cursor-pointer whitespace-nowrap ';
            if (item.primary) {
              cls += 'bg-[#111827] text-white font-semibold';
            } else if (isActive(item.href)) {
              cls += 'text-white bg-[#111827] font-semibold';
            } else {
              cls += 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[#f4f4f5]';
            }
            return (
              <Link key={item.href} href={item.href} className={cls}>
                {item.label}
              </Link>
            );
          })}

          {auth.isLoggedIn() && (
            <>
              <div className="inline-flex items-center gap-2 py-[5px] pl-1 lg:pl-3.5 pr-[5px] rounded-full border border-[var(--line-2)] bg-white text-[13px] text-[var(--text)] ml-1">
                <span className="hidden lg:inline">{username}</span>
                <div className="w-7 h-7 rounded-full bg-[#111827] flex items-center justify-center text-xs font-bold text-white">
                  {username?.[0]?.toUpperCase() ?? '?'}
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

        <button
          className="min-[821px]:hidden bg-transparent border-none text-[var(--text)] text-[22px] cursor-pointer p-1.5"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          Menu
        </button>
      </header>

      {drawerOpen && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-40 min-[821px]:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[min(320px,85vw)] bg-[var(--bg)] border-l border-[var(--line)] p-6 z-50 flex flex-col gap-2 overflow-y-auto transition-transform duration-300 min-[821px]:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full border border-[var(--line-2)] bg-transparent text-[var(--text)] cursor-pointer flex items-center justify-center text-xs"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        >
          Close
        </button>
        <h3 className="m-0 mb-1 font-fraunces text-lg">Menu</h3>
        {auth.isLoggedIn() && (
          <p className="m-0 mb-2.5 text-xs text-[var(--muted)]">
            Signed in as {username}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={`${drawerBtn} ${
                isActive(item.href) ? 'bg-[#f4f4f5] font-semibold' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
          {auth.isLoggedIn() && (
            <button onClick={handleLogout} className={drawerBtn}>
              Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
}