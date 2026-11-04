/**
 * api.ts — client for Lodge App backend
 * Base URL: https://lodge-app-2plf.onrender.com
 *
 * Works in plain JS too — just compile TS or use this file directly.
 */

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

export const API_BASE = isLocal
  ? 'http://localhost:8080'
  : 'https://lodge-app-2plf.onrender.com';

const TOKEN_KEY = 'lodge_token';
const ROLE_KEY = 'lodge_role';
const USER_KEY = 'lodge_username';

// ─────────────────────────────────────────────────────────────
// Types (mirror your /v3/api-docs schemas)
// ─────────────────────────────────────────────────────────────

/**
 * Statuses the UI may READ from the backend.
 * 'COMPLETED' is allowed here purely for display/filtering — it is NOT
 * returned by the current backend, and MUST NOT be sent back (see below).
 */
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

/**
 * Statuses the backend's `status` enum actually accepts
 * (per /v3/api-docs → PATCH /api/admin/{bookings,hall-bookings}/{id}/status
 *  and the `status` query param on GET list endpoints).
 * Use this type for anything that will be sent to the API.
 */
export type BookingStatusInput = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type PaymentMethod = 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH';
export type HallBillingMode = 'HOURLY' | 'DAILY';
export type Role = 'ADMIN' | 'CUSTOMER';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface AuthResponse {
  token: string;
  role: Role;
  username: string;
}

export interface RoomDto {
  id: number;
  name: string;
  building?: string;
  description?: string;
  pricePerNight: number;
  totalRooms: number;
  availableRooms: number;
  primaryImage?: string;
  images?: string[];
  amenities: string[];
}

export interface RoomRequest {
  name: string;
  building?: string;
  description?: string;
  pricePerNight: number;
  totalRooms: number;
  amenities?: string[];
}

export interface MealDto {
  id: number;
  name: string;
  mealType?: MealType;
  description?: string;
  price: number;
  primaryImage?: string;
  images?: string[];
}

export interface MealRequest {
  name: string;
  mealType?: MealType;
  description?: string;
  price: number;
}

export interface HallDto {
  id: number;
  name: string;
  building?: string;
  description?: string;
  capacity: number;
  pricePerHour: number;
  pricePerDay?: number;
  available?: boolean;
  primaryImage?: string;
  images?: string[];
}

export interface HallRequest {
  name: string;
  building?: string;
  description?: string;
  capacity: number;
  pricePerHour: number;
  pricePerDay?: number;
}

export interface BookingResponse {
  id: number;
  roomId: number;
  roomName: string;
  customerUsername: string;
  checkIn: string;
  checkOut: string;
  roomCount: number;
  status: BookingStatus;
  createdAt: string;
  paid: boolean;
  totalAmount: number;
  paymentReference?: string;
  paymentMethod?: PaymentMethod;
}

export interface BookingRequest {
  roomId: number;
  checkIn: string;
  checkOut: string;
  roomCount?: number;
}

export interface HallBookingResponse {
  id: number;
  hallId: number;
  hallName: string;
  customerUsername: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  paid: boolean;
  paymentReference?: string;
  paymentMethod?: PaymentMethod;
}

export interface HallBookingRequest {
  hallId: number;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
  billingMode?: HallBillingMode;
}

export interface PaymentInitiationResponse {
  checkoutUrl: string;
  txRef: string;
}

export interface FeedbackDto {
  id: number;
  customerUsername: string;
  bookingId?: number | null;
  rating: number;
  comment?: string;
  resolved: boolean;
  createdAt: string;
}

export interface FeedbackRequest {
  bookingId?: number;
  rating: number;
  comment?: string;
}

export interface NotificationDto {
  id: number;
  type: string;
  title: string;
  message: string;
  referenceId?: number;
  read: boolean;
  createdAt: string;
}

export interface AvailabilityDto {
  roomId: number;
  totalRooms: number;
  availableRooms: number;
}

export interface HallAvailabilityDto {
  hallId: number;
  available: boolean;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ─────────────────────────────────────────────────────────────
// Token management (SSR-safe)
// ─────────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined';

export const auth = {
  save(a: AuthResponse) {
    if (!isBrowser) return;
    localStorage.setItem(TOKEN_KEY, a.token);
    localStorage.setItem(ROLE_KEY, a.role);
    localStorage.setItem(USER_KEY, a.username);
  },
  token(): string | null {
    if (!isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  role(): Role | null {
    if (!isBrowser) return null;
    return localStorage.getItem(ROLE_KEY) as Role | null;
  },
  username(): string | null {
    if (!isBrowser) return null;
    return localStorage.getItem(USER_KEY);
  },
  isAdmin(): boolean {
    return this.role() === 'ADMIN';
  },
  isLoggedIn(): boolean {
    return !!this.token();
  },
  logout() {
    if (!isBrowser) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// ─────────────────────────────────────────────────────────────
// Low-level fetch wrapper
// ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  _authRequired = false
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };

  if (init.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = auth.token();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 || res.status === 403) {
    auth.logout();
    // App Router: the login page is /login, NOT /login.html.
    // The old .html path 404'd and looked like a routing bug.
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = `/login?next=${encodeURIComponent(
        window.location.pathname
      )}`;
    }
    throw new ApiError(res.status, 'Not authorized', null);
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    const msg =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error?: string }).error)
        : `Request failed with ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return (await res.text()) as unknown as T;
}

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

export const authApi = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const a = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    auth.save(a);
    return a;
  },

  async register(
    username: string,
    password: string,
    email?: string
  ): Promise<AuthResponse> {
    const a = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
    auth.save(a);
    return a;
  },

  logout: auth.logout,
};

// ─────────────────────────────────────────────────────────────
// Public browsing (no login required)
// ─────────────────────────────────────────────────────────────

export const publicApi = {
  async rooms(params?: {
    checkIn?: string;
    checkOut?: string;
    amenity?: string[];
  }): Promise<RoomDto[]> {
    const q = new URLSearchParams();
    if (params?.checkIn) q.set('checkIn', params.checkIn);
    if (params?.checkOut) q.set('checkOut', params.checkOut);
    params?.amenity?.forEach((a) => q.append('amenity', a));
    const qs = q.toString();
    return request<RoomDto[]>(`/api/public/rooms${qs ? '?' + qs : ''}`);
  },

  async roomAvailability(
    id: number,
    checkIn: string,
    checkOut: string
  ): Promise<AvailabilityDto> {
    const q = new URLSearchParams({ checkIn, checkOut });
    return request<AvailabilityDto>(
      `/api/public/rooms/${id}/availability?${q}`
    );
  },

  async meals(): Promise<MealDto[]> {
    return request<MealDto[]>('/api/public/meals');
  },

  async halls(params?: { start?: string; end?: string }): Promise<HallDto[]> {
    const q = new URLSearchParams();
    if (params?.start) q.set('start', params.start);
    if (params?.end) q.set('end', params.end);
    const qs = q.toString();
    return request<HallDto[]>(`/api/public/halls${qs ? '?' + qs : ''}`);
  },

  async hallAvailability(
    id: number,
    start: string,
    end: string
  ): Promise<HallAvailabilityDto> {
    const q = new URLSearchParams({ start, end });
    return request<HallAvailabilityDto>(
      `/api/public/halls/${id}/availability?${q}`
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Customer bookings (login required)
// ─────────────────────────────────────────────────────────────

export const bookingsApi = {
  create(req: BookingRequest): Promise<BookingResponse> {
    return request<BookingResponse>(
      '/api/bookings',
      { method: 'POST', body: JSON.stringify(req) },
      true
    );
  },

  mine(): Promise<BookingResponse[]> {
    return request<BookingResponse[]>('/api/bookings/my', {}, true);
  },

  cancel(id: number): Promise<void> {
    return request<void>(`/api/bookings/${id}`, { method: 'DELETE' }, true);
  },

  async initiatePayment(id: number): Promise<PaymentInitiationResponse> {
    const resp = await request<PaymentInitiationResponse>(
      `/api/bookings/${id}/initiate-payment`,
      { method: 'POST' },
      true
    );
    if (typeof window !== 'undefined' && resp.checkoutUrl) {
      window.location.href = resp.checkoutUrl;
    }
    return resp;
  },

  verifyPayment(id: number): Promise<BookingResponse> {
    return request<BookingResponse>(
      `/api/bookings/${id}/verify-payment`,
      { method: 'POST' },
      true
    );
  },

  async downloadReceipt(id: number): Promise<void> {
    const token = auth.token();
    const res = await fetch(`${API_BASE}/api/bookings/${id}/receipt`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, 'Receipt failed', null);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-room-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ─────────────────────────────────────────────────────────────
// Customer hall bookings (login required)
// ─────────────────────────────────────────────────────────────

export const hallBookingsApi = {
  create(req: HallBookingRequest): Promise<HallBookingResponse> {
    return request<HallBookingResponse>(
      '/api/hall-bookings',
      { method: 'POST', body: JSON.stringify(req) },
      true
    );
  },

  mine(): Promise<HallBookingResponse[]> {
    return request<HallBookingResponse[]>('/api/hall-bookings/my', {}, true);
  },

  cancel(id: number): Promise<void> {
    return request<void>(
      `/api/hall-bookings/${id}`,
      { method: 'DELETE' },
      true
    );
  },

  async initiatePayment(id: number): Promise<PaymentInitiationResponse> {
    const resp = await request<PaymentInitiationResponse>(
      `/api/hall-bookings/${id}/initiate-payment`,
      { method: 'POST' },
      true
    );
    if (typeof window !== 'undefined' && resp.checkoutUrl) {
      window.location.href = resp.checkoutUrl;
    }
    return resp;
  },

  verifyPayment(id: number): Promise<HallBookingResponse> {
    return request<HallBookingResponse>(
      `/api/hall-bookings/${id}/verify-payment`,
      { method: 'POST' },
      true
    );
  },

  async downloadReceipt(id: number): Promise<void> {
    const token = auth.token();
    const res = await fetch(`${API_BASE}/api/hall-bookings/${id}/receipt`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, 'Receipt failed', null);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-hall-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ─────────────────────────────────────────────────────────────
// Feedback (login required)
// ─────────────────────────────────────────────────────────────

export const feedbackApi = {
  submit(req: FeedbackRequest): Promise<FeedbackDto> {
    return request<FeedbackDto>(
      '/api/feedback',
      { method: 'POST', body: JSON.stringify(req) },
      true
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Notifications (login required)
// ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  list(page = 0, size = 20): Promise<Page<NotificationDto>> {
    return request<Page<NotificationDto>>(
      `/api/notifications?page=${page}&size=${size}`,
      {},
      true
    );
  },

  async unreadCount(): Promise<number> {
    return request<number>('/api/notifications/unread-count', {}, true);
  },

  markRead(id: number): Promise<void> {
    return request<void>(
      `/api/notifications/${id}/read`,
      { method: 'PATCH' },
      true
    );
  },

  markAllRead(): Promise<void> {
    return request<void>(
      '/api/notifications/read-all',
      { method: 'PATCH' },
      true
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Admin (ADMIN role required)
// ─────────────────────────────────────────────────────────────

export const adminApi = {
  // Rooms
  createRoom(req: RoomRequest): Promise<RoomDto> {
    return request<RoomDto>(
      '/api/admin/rooms',
      { method: 'POST', body: JSON.stringify(req) },
      true
    );
  },
  updateRoom(id: number, req: RoomRequest): Promise<RoomDto> {
    return request<RoomDto>(
      `/api/admin/rooms/${id}`,
      { method: 'PUT', body: JSON.stringify(req) },
      true
    );
  },
  deleteRoom(id: number): Promise<void> {
    return request<void>(`/api/admin/rooms/${id}`, { method: 'DELETE' }, true);
  },
  deleteRoomImage(roomId: number, imageId: number): Promise<void> {
    return request<void>(
      `/api/admin/rooms/${roomId}/images/${imageId}`,
      { method: 'DELETE' },
      true
    );
  },

  // Meals
  createMeal(req: MealRequest): Promise<MealDto> {
    return request<MealDto>(
      '/api/admin/meals',
      { method: 'POST', body: JSON.stringify(req) },
      true
    );
  },
  updateMeal(id: number, req: MealRequest): Promise<MealDto> {
    return request<MealDto>(
      `/api/admin/meals/${id}`,
      { method: 'PUT', body: JSON.stringify(req) },
      true
    );
  },
  deleteMeal(id: number): Promise<void> {
    return request<void>(`/api/admin/meals/${id}`, { method: 'DELETE' }, true);
  },
  deleteMealImage(mealId: number, imageId: number): Promise<void> {
    return request<void>(
      `/api/admin/meals/${mealId}/images/${imageId}`,
      { method: 'DELETE' },
      true
    );
  },

  // Halls
  createHall(req: HallRequest): Promise<HallDto> {
    return request<HallDto>(
      '/api/admin/halls',
      { method: 'POST', body: JSON.stringify(req) },
      true
    );
  },
  updateHall(id: number, req: HallRequest): Promise<HallDto> {
    return request<HallDto>(
      `/api/admin/halls/${id}`,
      { method: 'PUT', body: JSON.stringify(req) },
      true
    );
  },
  deleteHall(id: number): Promise<void> {
    return request<void>(`/api/admin/halls/${id}`, { method: 'DELETE' }, true);
  },
  deleteHallImage(hallId: number, imageId: number): Promise<void> {
    return request<void>(
      `/api/admin/halls/${hallId}/images/${imageId}`,
      { method: 'DELETE' },
      true
    );
  },

  // Uploads
  uploadRoomImage(
    roomId: number,
    file: File,
    primary = false
  ): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ url: string }>(
      `/api/admin/upload/room/${roomId}?primary=${primary}`,
      { method: 'POST', body: fd },
      true
    );
  },
  uploadMealImage(mealId: number, file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ url: string }>(
      `/api/admin/upload/meal/${mealId}`,
      { method: 'POST', body: fd },
      true
    );
  },
  uploadHallImage(
    hallId: number,
    file: File,
    primary = false
  ): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ url: string }>(
      `/api/admin/upload/hall/${hallId}?primary=${primary}`,
      { method: 'POST', body: fd },
      true
    );
  },

  // Bookings
  listBookings(params?: {
    status?: BookingStatusInput;
    paid?: boolean;
    page?: number;
    size?: number;
  }): Promise<Page<BookingResponse>> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.paid !== undefined) q.set('paid', String(params.paid));
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 20));
    return request<Page<BookingResponse>>(
      `/api/admin/bookings?${q}`,
      {},
      true
    );
  },
  updateBookingStatus(
    id: number,
    status: BookingStatusInput
  ): Promise<BookingResponse> {
    return request<BookingResponse>(
      `/api/admin/bookings/${id}/status?status=${status}`,
      { method: 'PATCH' },
      true
    );
  },

  // Hall bookings
  listHallBookings(params?: {
    status?: BookingStatusInput;
    paid?: boolean;
    page?: number;
    size?: number;
  }): Promise<Page<HallBookingResponse>> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.paid !== undefined) q.set('paid', String(params.paid));
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 20));
    return request<Page<HallBookingResponse>>(
      `/api/admin/hall-bookings?${q}`,
      {},
      true
    );
  },
  updateHallBookingStatus(
    id: number,
    status: BookingStatusInput
  ): Promise<HallBookingResponse> {
    return request<HallBookingResponse>(
      `/api/admin/hall-bookings/${id}/status?status=${status}`,
      { method: 'PATCH' },
      true
    );
  },

  // Feedback
  listFeedback(params?: {
    resolved?: boolean;
    page?: number;
    size?: number;
  }): Promise<Page<FeedbackDto>> {
    const q = new URLSearchParams();
    if (params?.resolved !== undefined)
      q.set('resolved', String(params.resolved));
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 20));
    return request<Page<FeedbackDto>>(`/api/admin/feedback?${q}`, {}, true);
  },
  resolveFeedback(id: number, resolved = true): Promise<FeedbackDto> {
    return request<FeedbackDto>(
      `/api/admin/feedback/${id}/resolve?resolved=${resolved}`,
      { method: 'PATCH' },
      true
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Site settings (lodge name + logo)
// ─────────────────────────────────────────────────────────────

export interface SiteSettingsDto {
  lodgeName: string;
  logoUrl: string;
}

export const siteSettingsApi = {
  /** Public — used by the header on every page. */
  async read(): Promise<SiteSettingsDto> {
    return request<SiteSettingsDto>('/api/public/site-settings');
  },

  /** Admin — update the lodge name. */
  async updateName(lodgeName: string): Promise<SiteSettingsDto> {
    return request<SiteSettingsDto>(
      '/api/admin/site-settings/name',
      { method: 'PUT', body: JSON.stringify({ lodgeName }) },
      true
    );
  },

  /** Admin — upload a new logo image. */
  async uploadLogo(file: File): Promise<SiteSettingsDto> {
    const fd = new FormData();
    fd.append('file', file);
    return request<SiteSettingsDto>(
      '/api/admin/site-settings/logo',
      { method: 'POST', body: fd },
      true
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Convenience: build absolute image URL
// ─────────────────────────────────────────────────────────────

export function imageUrl(path?: string | null): string {
  if (!path) return '/images/placeholder.jpg';
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
}