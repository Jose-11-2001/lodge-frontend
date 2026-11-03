/**
 * lib/auth.ts
 *
 * Single source of truth for the session-storage keys used by api.ts
 * (localStorage) and the route-guard hooks. Do NOT read sessionStorage
 * in guards; the API layer writes localStorage.
 */

export const TOKEN_KEY = 'lodge_token';
export const ROLE_KEY = 'lodge_role';
export const USER_KEY = 'lodge_username';

export function hasSavedSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(TOKEN_KEY);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}