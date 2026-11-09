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
  mealOrdersApi,
  ApiError,
  RoomDto,
  MealDto,
  HallDto,
  BookingResponse,
  HallBookingResponse,
  MealOrderResponse,
  FeedbackDto,
  RoomRequest,
  MealRequest,
  HallRequest,
  BookingStatusInput,
} from '@/lib/api';
import { USER_KEY, ROLE_KEY, hasSavedSession } from '@/lib/auth';

interface LodgeContextType {
  toastMessage: { msg: string; err?: boolean } | null;
  showToast: (msg: string, err?: boolean) => void;

  user: User | null;
  initializing: boolean;
  login: (credentials: { username: string; password: string }) => Promise<User>;
  register: (credentials: { username: string; password: string }) => Promise<User>;
  logout: () => void;

  rooms: Room[];
  meals: Meal[];
  halls: Hall[];
  bookings: Booking[];
  hallBookings: HallBooking[];
  mealOrders: MealOrder[];
  feedbackList: Feedback[];
  loading: boolean;
  refresh: () => Promise<void>;

  lodgeName: string;
  logoUrl: string | null;
  refreshSiteSettings: () => Promise<void>;
  updateLodgeName: (name: string) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;

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
  updateMealOrderStatus: (id: number, status: BookingStatusInput) => Promise<void>;
  resolveFeedback: (id: number, resolved?: boolean) => Promise<void>;
}

const LodgeContext = createContext<LodgeContextType | undefined>(undefined);

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

const mealOrderFromDto = (o: MealOrderResponse): MealOrder => ({
  id: o.id,
  mealId: o.mealId,
  mealName: o.mealName,
  customerUsername: o.customerUsername,
  quantity: o.quantity,
  serveAt: o.serveAt,
  totalPrice: o.totalPrice,
  status: o.status,
  createdAt: o.createdAt,
  paid: o.paid,
  paymentReference: o.paymentReference ?? null,
  paymentMethod: o.paymentMethod ?? null,
});

const extractError = (e: unknown): Error => {
  if (e instanceof ApiError) {
    return new Error(e.message || `Request failed (${e.status})`);
  }
  if (e instanceof Error) return e;
  return new Error('Unknown error');
};

export const LodgeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toastMessage, setToastMessage] = useState<{
    msg: string;
    err?: boolean;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hallBookings, setHallBookings] = useState<HallBooking[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [mealOrders, setMealOrders] = useState<MealOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [lodgeName, setLodgeName] = useState<string>('LodgeApp');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const showToast = useCallback((msg: string, err = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage({ msg, err });
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => {
    try {
      if (!hasSavedSession()) return;
      const storedUser = localStorage.getItem(USER_KEY);
      const storedRole = localStorage.getItem(ROLE_KEY);
      if (storedUser && storedRole) {
        setUser({
          id: 0,
          username: storedUser,
          role: storedRole as User['role'],
        });
      }
    } finally {
      setInitializing(false);
    }
  }, []);

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
        const [myBookings, myHallBookings, myMealOrders] = await Promise.all([
          bookingsApi.mine().catch(() => []),
          hallBookingsApi.mine().catch(() => []),
          mealOrdersApi.mine().catch(() => []),
        ]);
        setBookings(myBookings.map(bookingFromDto));
        setHallBookings(myHallBookings.map(hallBookingFromDto));
        setMealOrders(myMealOrders.map(mealOrderFromDto));

        if (authStore.isAdmin()) {
          const [allBookings, allHallBookings, allFeedback, allMealOrders] =
            await Promise.all([
              adminApi.listBookings({ size: 100 }).catch(() => null),
              adminApi.listHallBookings({ size: 100 }).catch(() => null),
              adminApi.listFeedback({ size: 100 }).catch(() => null),
              mealOrdersApi.adminAll().catch(() => null),
            ]);
          if (allBookings) setBookings(allBookings.content.map(bookingFromDto));
          if (allHallBookings)
            setHallBookings(allHallBookings.content.map(hallBookingFromDto));
          if (allFeedback)
            setFeedbackList(allFeedback.content.map(feedbackFromDto));
          if (allMealOrders)
            setMealOrders(allMealOrders.map(mealOrderFromDto));
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
    setMealOrders([]);
    setFeedbackList([]);
    showToast('Logged out');
  };

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

  const payBooking = async (
    id: number,
    _method: PaymentMethod
  ): Promise<Booking> => {
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

  const payHallBooking = async (
    id: number,
    _method: PaymentMethod
  ): Promise<HallBooking> => {
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

  const createMealOrder = async (data: {
    mealId: number;
    quantity: number;
    serveAt: string;
  }): Promise<MealOrder> => {
    try {
      const m = await mealOrdersApi.create(data);
      const mapped = mealOrderFromDto(m);
      setMealOrders((prev) => [...prev, mapped]);
      return mapped;
    } catch (e) {
      throw extractError(e);
    }
  };

  const payMealOrder = async (
    _id: number,
    _method: PaymentMethod
  ): Promise<MealOrder> => {
    throw new Error(
      'Payment for meal orders is not supported yet — pay at reception.'
    );
  };

  const cancelMealOrder = async (id: number): Promise<void> => {
    try {
      await mealOrdersApi.cancel(id);
      setMealOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: 'CANCELLED' } : o))
      );
    } catch (e) {
      throw extractError(e);
    }
  };

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
      await adminApi.updateRoom(id, req);

      if (data.primaryImage instanceof File) {
        try {
          await adminApi.uploadRoomImage(id, data.primaryImage, true);
        } catch (err) {
          showToast(
            `Room updated, but image upload failed: ${(err as Error).message}`,
            true
          );
        }
      }

      const all = await publicApi.rooms();
      setRooms(all.map(roomFromDto));
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

  const createMeal = async (
    data: Omit<Meal, 'id'>,
    image?: File
  ): Promise<Meal> => {
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
          await adminApi.uploadMealImage(m.id, image, true);
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
      await adminApi.updateMeal(id, req);

      if (data.primaryImage instanceof File) {
        try {
          await adminApi.uploadMealImage(id, data.primaryImage, true);
        } catch (err) {
          showToast(
            `Meal updated, but image upload failed: ${(err as Error).message}`,
            true
          );
        }
      }

      const all = await publicApi.meals();
      setMeals(all.map(mealFromDto));
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
      await adminApi.updateHall(id, req);

      if (data.primaryImage instanceof File) {
        try {
          await adminApi.uploadHallImage(id, data.primaryImage, true);
        } catch (err) {
          showToast(
            `Hall updated, but image upload failed: ${(err as Error).message}`,
            true
          );
        }
      }

      const all = await publicApi.halls();
      setHalls(all.map(hallFromDto));
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

  const updateBookingStatus = async (
    id: number,
    status: BookingStatusInput
  ): Promise<void> => {
    try {
      const b = await adminApi.updateBookingStatus(id, status);
      setBookings((prev) =>
        prev.map((x) => (x.id === id ? bookingFromDto(b) : x))
      );
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
    id: number,
    status: BookingStatusInput
  ): Promise<void> => {
    try {
      const m = await mealOrdersApi.adminUpdateStatus(id, status);
      setMealOrders((prev) =>
        prev.map((x) => (x.id === id ? mealOrderFromDto(m) : x))
      );
    } catch (e) {
      throw extractError(e);
    }
  };

  const resolveFeedback = async (
    id: number,
    resolved = true
  ): Promise<void> => {
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