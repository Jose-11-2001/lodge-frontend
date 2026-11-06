'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  User,
  Room,
  Meal,
  Hall,
  Booking,
  HallBooking,
  MealOrder,
  Feedback,
  BookingStatus,
  PaymentMethod,
} from '@/types';
import {
  auth as authStore,
  authApi,
  publicApi,
  bookingsApi,
  hallBookingsApi,
  feedbackApi,
  adminApi,
  siteSettingsApi,
  ApiError,
  RoomDto,
  MealDto,
  HallDto,
  BookingResponse,
  HallBookingResponse,
  FeedbackDto,
  RoomRequest,
  MealRequest,
  HallRequest,
  BookingStatusInput,
} from '@/lib/api';
import { USER_KEY, ROLE_KEY, hasSavedSession } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────

interface LodgeContextType {
  // ui
  toastMessage: { msg: string; err?: boolean } | null;
  showToast: (msg: string, err?: boolean) => void;

  // auth
  user: User | null;
  initializing: boolean;
  login: (credentials: { username: string; password: string }) => Promise<User>;
  register: (credentials: { username: string; password: string }) => Promise<User>;
  logout: () => void;

  // data
  rooms: Room[];
  meals: Meal[];
  halls: Hall[];
  bookings: Booking[];
  hallBookings: HallBooking[];
  mealOrders: MealOrder[];
  feedbackList: Feedback[];
  loading: boolean;
  refresh: () => Promise<void>;

  // site settings
  lodgeName: string;
  logoUrl: string | null;
  refreshSiteSettings: () => Promise<void>;
  updateLodgeName: (name: string) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;

  // customer actions
  createBooking: (data: {
    roomId: number;
    checkIn: string;
    checkOut: string;
    roomCount?: number;
  }) => Promise<Booking>;
  payBooking: (id: number, method: PaymentMethod) => Promise<Booking>;
  cancelBooking: (id: number) => Promise<void>;

  createHallBooking: (data: {
    hallId: number;
    startTime: string;
    endTime: string;
    purpose: string;
    attendees: number;
    billingMode?: 'HOURLY' | 'DAILY';
  }) => Promise<HallBooking>;
  payHallBooking: (id: number, method: PaymentMethod) => Promise<HallBooking>;
  cancelHallBooking: (id: number) => Promise<void>;

  createMealOrder: (data: {
    mealId: number;
    quantity: number;
    serveAt: string;
  }) => Promise<MealOrder>;
  payMealOrder: (id: number, method: PaymentMethod) => Promise<MealOrder>;
  cancelMealOrder: (id: number) => Promise<void>;

  createFeedback: (data: {
    bookingId?: number | null;
    rating: number;
    comment: string;
  }) => Promise<Feedback>;

  // admin actions — image is optional and uploaded after create
  createRoom: (
    data: Omit<Room, 'id' | 'availableRooms'>,
    image?: File
  ) => Promise<Room>;
  updateRoom: (id: number, data: Partial<Room>) => Promise<void>;
  deleteRoom: (id: number) => Promise<void>;

  createMeal: (data: Omit<Meal, 'id'>, image?: File) => Promise<Meal>;
  updateMeal: (id: number, data: Partial<Meal>) => Promise<void>;
  deleteMeal: (id: number) => Promise<void>;

  createHall: (
    data: Omit<Hall, 'id' | 'available'>,
    image?: File
  ) => Promise<Hall>;
  updateHall: (id: number, data: Partial<Hall>) => Promise<void>;
  deleteHall: (id: number) => Promise<void>;

  updateBookingStatus: (id: number, status: BookingStatusInput) => Promise<void>;
  updateHallBookingStatus: (id: number, status: BookingStatusInput) => Promise<void>;
  updateMealOrderStatus: (id: number, status: BookingStatus) => Promise<void>;
  resolveFeedback: (id: number, resolved?: boolean) => Promise<void>;
}

const LodgeContext = createContext<LodgeContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// DTO → model mappers
// ─────────────────────────────────────────────────────────────

const roomFromDto = (r: RoomDto): Room => ({
  ...r,
  primaryImage: r.primaryImage ?? undefined,
  images: r.images ?? [],
});

const mealFromDto = (m: MealDto): Meal => ({
  ...m,
  primaryImage: m.primaryImage ?? undefined,
  images: m.images ?? [],
});

const hallFromDto = (h: HallDto): Hall => ({
  ...h,
  primaryImage: h.primaryImage ?? undefined,
  images: h.images ?? [],
});

const bookingFromDto = (b: BookingResponse): Booking => ({
  ...b,
  paymentReference: b.paymentReference ?? null,
  paymentMethod: b.paymentMethod ?? null,
});

const hallBookingFromDto = (b: HallBookingResponse): HallBooking => ({
  ...b,
  paymentReference: b.paymentReference ?? null,
  paymentMethod: b.paymentMethod ?? null,
});

const feedbackFromDto = (f: FeedbackDto): Feedback => ({
  ...f,
  bookingId: f.bookingId ?? null,
});

const extractError = (e: unknown): Error => {
  if (e instanceof ApiError) {
    return new Error(e.message || `Request failed (${e.status})`);
  }
  if (e instanceof Error) return e;
  return new Error('Unknown error');
};

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export const LodgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ui
  const [toastMessage, setToastMessage] = useState<{ msg: string; err?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // session
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // backend-backed caches
  const [rooms, setRooms] = useState<Room[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hallBookings, setHallBookings] = useState<HallBooking[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [mealOrders] = useState<MealOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // site settings
  const [lodgeName, setLodgeName] = useState<string>('LodgeApp');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const showToast = useCallback((msg: string, err = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage({ msg, err });
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // ── session hydration ─────────────────────────────────────
  useEffect(() => {
    try {
      if (!hasSavedSession()) return;
      const storedUser = localStorage.getItem(USER_KEY);
      const storedRole = localStorage.getItem(ROLE_KEY);
      if (storedUser && storedRole) {
        setUser({ id: 0, username: storedUser, role: storedRole as User['role'] });
      }
    } finally {
      setInitializing(false);
    }
  }, []);

  // ── site settings ─────────────────────────────────────────
  const refreshSiteSettings = useCallback(async () => {
    try {
      const s = await siteSettingsApi.read();
      setLodgeName(s.lodgeName || 'LodgeApp');
      setLogoUrl(s.logoUrl || null);
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => {
    refreshSiteSettings();
  }, [refreshSiteSettings]);

  const updateLodgeName = async (name: string) => {
    const s = await siteSettingsApi.updateName(name);
    setLodgeName(s.lodgeName);
  };

  const uploadLogo = async (file: File) => {
    const s = await siteSettingsApi.uploadLogo(file);
    setLogoUrl(s.logoUrl || null);
    setLodgeName(s.lodgeName || 'LodgeApp');
  };

  // ── data loading ──────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [r, m, h] = await Promise.all([
        publicApi.rooms(),
        publicApi.meals(),
        publicApi.halls(),
      ]);
      setRooms(r.map(roomFromDto));
      setMeals(m.map(mealFromDto));
      setHalls(h.map(hallFromDto));

      if (authStore.isLoggedIn()) {
        const [myBookings, myHallBookings] = await Promise.all([
          bookingsApi.mine().catch(() => []),
          hallBookingsApi.mine().catch(() => []),
        ]);
        setBookings(myBookings.map(bookingFromDto));
        setHallBookings(myHallBookings.map(hallBookingFromDto));

        if (authStore.isAdmin()) {
          const [allBookings, allHallBookings, allFeedback] = await Promise.all([
            adminApi.listBookings({ size: 100 }).catch(() => null),
            adminApi.listHallBookings({ size: 100 }).catch(() => null),
            adminApi.listFeedback({ size: 100 }).catch(() => null),
          ]);
          if (allBookings) setBookings(allBookings.content.map(bookingFromDto));
          if (allHallBookings) setHallBookings(allHallBookings.content.map(hallBookingFromDto));
          if (allFeedback) setFeedbackList(allFeedback.content.map(feedbackFromDto));
        }
      }
    } catch (e) {
      showToast(extractError(e).message, true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refresh();
  }, [refresh, user]);

  // ── auth ──────────────────────────────────────────────────
  const login = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<User> => {
    try {
      const res = await authApi.login(username, password);
      const u: User = { id: 0, username: res.username, role: res.role };
      setUser(u);
      return u;
    } catch (e) {
      throw extractError(e);
    }
  };

  const register = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<User> => {
    try {
      const res = await authApi.register(username, password);
      const u: User = { id: 0, username: res.username, role: res.role };
      setUser(u);
      return u;
    } catch (e) {
      throw extractError(e);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setBookings([]);
    setHallBookings([]);
    setFeedbackList([]);
    showToast('Logged out');
  };

  // ── room bookings ─────────────────────────────────────────
  const createBooking = async (data: {
    roomId: number;
    checkIn: string;
    checkOut: string;
    roomCount?: number;
  }): Promise<Booking> => {
    try {
      const b = await bookingsApi.create(data);
      const mapped = bookingFromDto(b);
      setBookings((prev) => [...prev, mapped]);
      const r = await publicApi.rooms();
      setRooms(r.map(roomFromDto));
      return mapped;
    } catch (e) {
      throw extractError(e);
    }
  };

  const payBooking = async (id: number, _method: PaymentMethod): Promise<Booking> => {
    try {
      await bookingsApi.initiatePayment(id);
      const b = bookings.find((x) => x.id === id);
      return b ?? ({} as Booking);
    } catch (e) {
      throw extractError(e);
    }
  };

  const cancelBooking = async (id: number): Promise<void> => {
    try {
      await bookingsApi.cancel(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b))
      );
      const r = await publicApi.rooms();
      setRooms(r.map(roomFromDto));
    } catch (e) {
      throw extractError(e);
    }
  };

  // ── hall bookings ─────────────────────────────────────────
  const createHallBooking = async (data: {
    hallId: number;
    startTime: string;
    endTime: string;
    purpose: string;
    attendees: number;
    billingMode?: 'HOURLY' | 'DAILY';
  }): Promise<HallBooking> => {
    try {
      const hb = await hallBookingsApi.create(data);
      const mapped = hallBookingFromDto(hb);
      setHallBookings((prev) => [...prev, mapped]);
      const h = await publicApi.halls();
      setHalls(h.map(hallFromDto));
      return mapped;
    } catch (e) {
      throw extractError(e);
    }
  };

  const payHallBooking = async (id: number, _method: PaymentMethod): Promise<HallBooking> => {
    try {
      await hallBookingsApi.initiatePayment(id);
      const hb = hallBookings.find((x) => x.id === id);
      return hb ?? ({} as HallBooking);
    } catch (e) {
      throw extractError(e);
    }
  };

  const cancelHallBooking = async (id: number): Promise<void> => {
    try {
      await hallBookingsApi.cancel(id);
      setHallBookings((prev) =>
        prev.map((hb) => (hb.id === id ? { ...hb, status: 'CANCELLED' } : hb))
      );
      const h = await publicApi.halls();
      setHalls(h.map(hallFromDto));
    } catch (e) {
      throw extractError(e);
    }
  };

  // ── meal orders (not backend-supported yet) ───────────────
  const createMealOrder = async (_data: {
    mealId: number;
    quantity: number;
    serveAt: string;
  }): Promise<MealOrder> => {
    throw new Error(
      'Meal ordering is not yet supported by the backend. Ask the backend team to add POST /api/meal-orders.'
    );
  };

  const payMealOrder = async (_id: number, _method: PaymentMethod): Promise<MealOrder> => {
    throw new Error('Meal ordering is not yet supported by the backend.');
  };

  const cancelMealOrder = async (_id: number): Promise<void> => {
    throw new Error('Meal ordering is not yet supported by the backend.');
  };

  // ── feedback ──────────────────────────────────────────────
  const createFeedback = async (data: {
    bookingId?: number | null;
    rating: number;
    comment: string;
  }): Promise<Feedback> => {
    try {
      const f = await feedbackApi.submit({
        bookingId: data.bookingId ?? undefined,
        rating: data.rating,
        comment: data.comment,
      });
      const mapped = feedbackFromDto(f);
      setFeedbackList((prev) => [...prev, mapped]);
      return mapped;
    } catch (e) {
      throw extractError(e);
    }
  };

  // ── admin: rooms ─────────────────────────────────────────
  const createRoom = async (
    data: Omit<Room, 'id' | 'availableRooms'>,
    image?: File
  ): Promise<Room> => {
    try {
      const req: RoomRequest = {
        name: data.name,
        building: data.building,
        description: data.description,
        pricePerNight: data.pricePerNight,
        totalRooms: data.totalRooms,
        amenities: data.amenities,
      };
      let r = await adminApi.createRoom(req);

      if (image) {
        try {
          await adminApi.uploadRoomImage(r.id, image, true);
        } catch (err) {
          showToast(
            `Room saved, but image upload failed: ${(err as Error).message}`,
            true
          );
        }
        const all = await publicApi.rooms();
        const updated = all.find((x) => x.id === r.id);
        if (updated) r = updated;
      }

      const mapped = roomFromDto(r);
      setRooms((prev) => [...prev, mapped]);
      return mapped;
    } catch (e) {
      throw extractError(e);
    }
  };

  const updateRoom = async (id: number, data: Partial<Room>): Promise<void> => {
    try {
      const req: RoomRequest = {
        name: data.name ?? '',
        building: data.building,
        description: data.description,
        pricePerNight: data.pricePerNight ?? 0,
        totalRooms: data.totalRooms ?? 0,
        amenities: data.amenities,
      };
      const r = await adminApi.updateRoom(id, req);
      setRooms((prev) => prev.map((x) => (x.id === id ? roomFromDto(r) : x)));
    } catch (e) {
      throw extractError(e);
    }
  };

  const deleteRoom = async (id: number): Promise<void> => {
    try {
      await adminApi.deleteRoom(id);
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      throw extractError(e);
    }
  };

  // ── admin: meals ─────────────────────────────────────────
  const createMeal = async (data: Omit<Meal, 'id'>, image?: File): Promise<Meal> => {
    try {
      const req: MealRequest = {
        name: data.name,
        mealType: data.mealType,
        description: data.description,
        price: data.price,
      };
      let m = await adminApi.createMeal(req);

      if (image) {
        try {
          await adminApi.uploadMealImage(m.id, image);
        } catch (err) {
          showToast(
            `Meal saved, but image upload failed: ${(err as Error).message}`,
            true
          );
        }
        const all = await publicApi.meals();
        const updated = all.find((x) => x.id === m.id);
        if (updated) m = updated;
      }

      const mapped = mealFromDto(m);
      setMeals((prev) => [...prev, mapped]);
      return mapped;
    } catch (e) {
      throw extractError(e);
    }
  };

  const updateMeal = async (id: number, data: Partial<Meal>): Promise<void> => {
    try {
      const req: MealRequest = {
        name: data.name ?? '',
        mealType: data.mealType,
        description: data.description,
        price: data.price ?? 0,
      };
      const m = await adminApi.updateMeal(id, req);
      setMeals((prev) => prev.map((x) => (x.id === id ? mealFromDto(m) : x)));
    } catch (e) {
      throw extractError(e);
    }
  };

  const deleteMeal = async (id: number): Promise<void> => {
    try {
      await adminApi.deleteMeal(id);
      setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      throw extractError(e);
    }
  };

  // ── admin: halls ─────────────────────────────────────────
  const createHall = async (
    data: Omit<Hall, 'id' | 'available'>,
    image?: File
  ): Promise<Hall> => {
    try {
      const req: HallRequest = {
        name: data.name,
        building: data.building,
        description: data.description,
        capacity: data.capacity,
        pricePerHour: data.pricePerHour,
        pricePerDay: data.pricePerDay,
      };
      let h = await adminApi.createHall(req);

      if (image) {
        try {
          await adminApi.uploadHallImage(h.id, image, true);
        } catch (err) {
          showToast(
            `Hall saved, but image upload failed: ${(err as Error).message}`,
            true
          );
        }
        const all = await publicApi.halls();
        const updated = all.find((x) => x.id === h.id);
        if (updated) h = updated;
      }

      const mapped = hallFromDto(h);
      setHalls((prev) => [...prev, mapped]);
      return mapped;
    } catch (e) {
      throw extractError(e);
    }
  };

  const updateHall = async (id: number, data: Partial<Hall>): Promise<void> => {
    try {
      const req: HallRequest = {
        name: data.name ?? '',
        building: data.building,
        description: data.description,
        capacity: data.capacity ?? 0,
        pricePerHour: data.pricePerHour ?? 0,
        pricePerDay: data.pricePerDay,
      };
      const h = await adminApi.updateHall(id, req);
      setHalls((prev) => prev.map((x) => (x.id === id ? hallFromDto(h) : x)));
    } catch (e) {
      throw extractError(e);
    }
  };

  const deleteHall = async (id: number): Promise<void> => {
    try {
      await adminApi.deleteHall(id);
      setHalls((prev) => prev.filter((h) => h.id !== id));
    } catch (e) {
      throw extractError(e);
    }
  };

  // ── admin: booking statuses + feedback ───────────────────
  const updateBookingStatus = async (
    id: number,
    status: BookingStatusInput
  ): Promise<void> => {
    try {
      const b = await adminApi.updateBookingStatus(id, status);
      setBookings((prev) => prev.map((x) => (x.id === id ? bookingFromDto(b) : x)));
    } catch (e) {
      throw extractError(e);
    }
  };

  const updateHallBookingStatus = async (
    id: number,
    status: BookingStatusInput
  ): Promise<void> => {
    try {
      const hb = await adminApi.updateHallBookingStatus(id, status);
      setHallBookings((prev) =>
        prev.map((x) => (x.id === id ? hallBookingFromDto(hb) : x))
      );
    } catch (e) {
      throw extractError(e);
    }
  };

  const updateMealOrderStatus = async (
    _id: number,
    _status: BookingStatus
  ): Promise<void> => {
    throw new Error('Meal ordering is not yet supported by the backend.');
  };

  const resolveFeedback = async (id: number, resolved = true): Promise<void> => {
    try {
      const f = await adminApi.resolveFeedback(id, resolved);
      setFeedbackList((prev) =>
        prev.map((x) => (x.id === id ? feedbackFromDto(f) : x))
      );
    } catch (e) {
      throw extractError(e);
    }
  };

  return (
    <LodgeContext.Provider
      value={{
        toastMessage,
        showToast,
        user,
        initializing,
        login,
        register,
        logout,
        rooms,
        meals,
        halls,
        bookings,
        hallBookings,
        mealOrders,
        feedbackList,
        loading,
        refresh,

        lodgeName,
        logoUrl,
        refreshSiteSettings,
        updateLodgeName,
        uploadLogo,

        createBooking,
        payBooking,
        cancelBooking,
        createHallBooking,
        payHallBooking,
        cancelHallBooking,
        createMealOrder,
        payMealOrder,
        cancelMealOrder,
        createFeedback,
        createRoom,
        updateRoom,
        deleteRoom,
        createMeal,
        updateMeal,
        deleteMeal,
        createHall,
        updateHall,
        deleteHall,
        updateBookingStatus,
        updateHallBookingStatus,
        updateMealOrderStatus,
        resolveFeedback,
      }}
    >
      {children}
    </LodgeContext.Provider>
  );
};

export const useLodge = () => {
  const context = useContext(LodgeContext);
  if (!context) throw new Error('useLodge must be used within a LodgeProvider');
  return context;
};