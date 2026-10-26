'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Room, Meal, Hall, Booking, HallBooking, Feedback, BookingStatus } from '@/types';

const DB_KEY = 'lodge_db_v2';

interface StoredUser extends User {
  password: string;
}

interface LodgeDatabase {
  users: StoredUser[];
  rooms: Room[];
  meals: Meal[];
  halls: Hall[];
  bookings: Booking[];
  hallBookings: HallBooking[];
  feedback: Feedback[];
  seq: {
    rooms: number;
    meals: number;
    halls: number;
    bookings: number;
    hallBookings: number;
    feedback: number;
  };
}

const seedData = (): LodgeDatabase => ({
  users: [
    { id: 1, username: 'admin', password: 'admin', role: 'ADMIN' as const },
    { id: 2, username: 'alice', password: 'pass', role: 'CUSTOMER' as const },
    { id: 3, username: 'bob',   password: 'pass', role: 'CUSTOMER' as const },
  ],
  rooms: [
    { id: 1, name: 'Deluxe King', building: 'Block A', description: 'Spacious room with king bed, city view and premium amenities', pricePerNight: 85, totalRooms: 5, availableRooms: 5, amenities: ['WiFi','AC','TV'], primaryImage: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80' },
    { id: 2, name: 'Standard Twin', building: 'Block B', description: 'Two single beds, budget friendly and comfortable', pricePerNight: 55, totalRooms: 8, availableRooms: 8, amenities: ['WiFi','Fan'], primaryImage: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80' },
    { id: 3, name: 'Executive Suite', building: 'Block A', description: 'Luxury suite with lounge, king bed, and minibar', pricePerNight: 140, totalRooms: 2, availableRooms: 2, amenities: ['WiFi','AC','TV','Minibar'], primaryImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80' },
    { id: 4, name: 'Garden View Room', building: 'Block B', description: 'Overlooks the lodge garden, perfect for couples', pricePerNight: 70, totalRooms: 4, availableRooms: 4, amenities: ['WiFi','AC'], primaryImage: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=900&q=80' },
  ],
  meals: [
    { id: 1, name: 'Full English Breakfast', mealType: 'BREAKFAST' as const, description: 'Eggs, bacon, toast, coffee', price: 12, primaryImage: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=900&q=80' },
    { id: 2, name: 'Grilled Chicken Plate', mealType: 'LUNCH' as const, description: 'Chicken, rice, salad', price: 15, primaryImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80' },
    { id: 3, name: 'Beef Stew', mealType: 'DINNER' as const, description: 'Slow cooked beef with veg', price: 18, primaryImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=80' },
    { id: 4, name: 'Fruit & Yogurt Bowl', mealType: 'BREAKFAST' as const, description: 'Seasonal fruit, honey yogurt', price: 8, primaryImage: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=900&q=80' },
  ],
  halls: [
    { id: 1, name: 'Grand Conference Hall', building: 'Block C', description: 'Full AV setup, 200 seats, ideal for conferences', capacity: 200, pricePerHour: 50, pricePerDay: 350, available: true, primaryImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&q=80' },
    { id: 2, name: 'Boardroom', building: 'Block A', description: '12-seat meeting room with video conferencing', capacity: 12, pricePerHour: 20, pricePerDay: 120, available: true, primaryImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80' },
  ],
  bookings: [] as Booking[],
  hallBookings: [] as HallBooking[],
  feedback: [] as Feedback[],
  seq: { rooms: 5, meals: 5, halls: 3, bookings: 1, hallBookings: 1, feedback: 1 }
});

interface LodgeContextType {
  theme: string;
  toggleTheme: () => void;
  user: User | null;
  login: (credentials: { username: string; password: string }) => User;
  register: (credentials: { username: string; password: string }) => User;
  logout: () => void;
  rooms: Room[];
  meals: Meal[];
  halls: Hall[];
  bookings: Booking[];
  hallBookings: HallBooking[];
  feedbackList: Feedback[];
  createBooking: (data: { roomId: number; checkIn: string; checkOut: string; roomCount?: number }) => Booking;
  payBooking: (id: number, method: string) => Booking;
  cancelBooking: (id: number) => void;
  createHallBooking: (data: { hallId: number; startTime: string; endTime: string; purpose: string; attendees: number; billingMode?: 'HOURLY' | 'DAILY' }) => HallBooking;
  payHallBooking: (id: number, method: string) => HallBooking;
  cancelHallBooking: (id: number) => void;
  createFeedback: (data: { bookingId?: number | null; rating: number; comment: string }) => Feedback;
  createRoom: (data: Omit<Room, 'id' | 'availableRooms'>) => Room;
  updateRoom: (id: number, data: Partial<Room>) => void;
  deleteRoom: (id: number) => void;
  createMeal: (data: Omit<Meal, 'id'>) => Meal;
  updateMeal: (id: number, data: Partial<Meal>) => void;
  deleteMeal: (id: number) => void;
  createHall: (data: Omit<Hall, 'id' | 'available'>) => Hall;
  updateHall: (id: number, data: Partial<Hall>) => void;
  deleteHall: (id: number) => void;
  updateBookingStatus: (id: number, status: BookingStatus) => void;
  updateHallBookingStatus: (id: number, status: BookingStatus) => void;
  resolveFeedback: (id: number) => void;
  toastMessage: { msg: string; err?: boolean } | null;
  showToast: (msg: string, err?: boolean) => void;
}

const LodgeContext = createContext<LodgeContextType | undefined>(undefined);

export const LodgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<string>('dark');
  const [user, setUser] = useState<User | null>(null);
  const [db, setDb] = useState<LodgeDatabase>(seedData);
  const [toastMessage, setToastMessage] = useState<{ msg: string; err?: boolean } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('lodge_theme') || 'dark';
    setThemeState(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedUser = sessionStorage.getItem('lodge_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedDb = localStorage.getItem(DB_KEY);
    if (savedDb) {
      setDb(JSON.parse(savedDb));
    } else {
      const initial = seedData();
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      setDb(initial);
    }
  }, []);

  const saveDb = (newDb: LodgeDatabase) => {
    setDb(newDb);
    localStorage.setItem(DB_KEY, JSON.stringify(newDb));
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    localStorage.setItem('lodge_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const showToast = (msg: string, err = false) => {
    setToastMessage({ msg, err });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const login = ({ username, password }: { username: string; password: string }) => {
    const found = db.users.find(u => u.username === username && u.password === password);
    if (!found) throw new Error('Invalid credentials');
    const userData: User = { id: found.id, username: found.username, role: found.role };
    setUser(userData);
    sessionStorage.setItem('lodge_user', JSON.stringify(userData));
    return userData;
  };

  const register = ({ username, password }: { username: string; password: string }) => {
    if (db.users.find(u => u.username === username)) throw new Error('Username taken');
    const newUser = { id: db.users.length + 1, username, password, role: 'CUSTOMER' as const };
    const newDb = { ...db, users: [...db.users, newUser] };
    saveDb(newDb);
    const userData: User = { id: newUser.id, username: newUser.username, role: newUser.role };
    setUser(userData);
    sessionStorage.setItem('lodge_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('lodge_user');
  };

  const createBooking = ({ roomId, checkIn, checkOut, roomCount = 1 }: { roomId: number; checkIn: string; checkOut: string; roomCount?: number }) => {
    if (!user) throw new Error('User not logged in');
    const room = db.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    if (room.availableRooms < roomCount) throw new Error('Not enough rooms available');

    const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
    const newBooking: Booking = {
      id: db.seq.bookings,
      roomId,
      roomName: room.name,
      customerUsername: user.username,
      checkIn,
      checkOut,
      roomCount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      paid: false,
      totalAmount: nights * room.pricePerNight * roomCount,
      paymentReference: null,
      paymentMethod: null
    };

    const updatedRooms = db.rooms.map(r => r.id === roomId ? { ...r, availableRooms: r.availableRooms - roomCount } : r);
    saveDb({
      ...db,
      rooms: updatedRooms,
      bookings: [...db.bookings, newBooking],
      seq: { ...db.seq, bookings: db.seq.bookings + 1 }
    });
    return newBooking;
  };

  const payBooking = (id: number, method: string) => {
    const updatedBookings = db.bookings.map(b => b.id === id ? {
      ...b,
      paid: true,
      status: 'CONFIRMED' as BookingStatus,
      paymentMethod: method,
      paymentReference: 'PAY-' + Date.now()
    } : b);
    saveDb({ ...db, bookings: updatedBookings });
    return updatedBookings.find(b => b.id === id)!;
  };

  const cancelBooking = (id: number) => {
    const b = db.bookings.find(x => x.id === id);
    if (!b) throw new Error('Booking not found');

    const updatedBookings = db.bookings.map(x => x.id === id ? { ...x, status: 'CANCELLED' as BookingStatus } : x);
    const updatedRooms = db.rooms.map(r => r.id === b.roomId ? { ...r, availableRooms: r.availableRooms + b.roomCount } : r);

    saveDb({ ...db, bookings: updatedBookings, rooms: updatedRooms });
  };

  const createHallBooking = ({ hallId, startTime, endTime, purpose, attendees, billingMode = 'HOURLY' }: { hallId: number; startTime: string; endTime: string; purpose: string; attendees: number; billingMode?: 'HOURLY' | 'DAILY' }) => {
    if (!user) throw new Error('User not logged in');
    const hall = db.halls.find(h => h.id === hallId);
    if (!hall) throw new Error('Hall not found');
    if (!hall.available) throw new Error('Hall not available');

    const hours = Math.max(1, (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000);
    const total = billingMode === 'DAILY' ? hall.pricePerDay : hall.pricePerHour * hours;

    const newHallBooking: HallBooking = {
      id: db.seq.hallBookings,
      hallId,
      hallName: hall.name,
      customerUsername: user.username,
      startTime,
      endTime,
      purpose,
      attendees,
      totalPrice: total,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      paid: false,
      paymentReference: null,
      paymentMethod: null
    };

    const updatedHalls = db.halls.map(h => h.id === hallId ? { ...h, available: false } : h);
    saveDb({
      ...db,
      halls: updatedHalls,
      hallBookings: [...db.hallBookings, newHallBooking],
      seq: { ...db.seq, hallBookings: db.seq.hallBookings + 1 }
    });
    return newHallBooking;
  };

  const payHallBooking = (id: number, method: string) => {
    const updated = db.hallBookings.map(hb => hb.id === id ? {
      ...hb,
      paid: true,
      status: 'CONFIRMED' as BookingStatus,
      paymentMethod: method,
      paymentReference: 'PAY-' + Date.now()
    } : hb);
    saveDb({ ...db, hallBookings: updated });
    return updated.find(hb => hb.id === id)!;
  };

  const cancelHallBooking = (id: number) => {
    const hb = db.hallBookings.find(x => x.id === id);
    if (!hb) throw new Error('Booking not found');

    const updatedBookings = db.hallBookings.map(x => x.id === id ? { ...x, status: 'CANCELLED' as BookingStatus } : x);
    const updatedHalls = db.halls.map(h => h.id === hb.hallId ? { ...h, available: true } : h);

    saveDb({ ...db, hallBookings: updatedBookings, halls: updatedHalls });
  };

  const createFeedback = ({ bookingId = null, rating, comment }: { bookingId?: number | null; rating: number; comment: string }) => {
    if (!user) throw new Error('User not logged in');
    const newFb: Feedback = {
      id: db.seq.feedback,
      customerUsername: user.username,
      bookingId,
      rating,
      comment,
      resolved: false,
      createdAt: new Date().toISOString()
    };
    saveDb({
      ...db,
      feedback: [...db.feedback, newFb],
      seq: { ...db.seq, feedback: db.seq.feedback + 1 }
    });
    return newFb;
  };

  const createRoom = (data: Omit<Room, 'id' | 'availableRooms'>) => {
    const r: Room = {
      ...data,
      id: db.seq.rooms,
      availableRooms: data.totalRooms || 1,
      primaryImage: data.primaryImage || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80'
    };
    saveDb({ ...db, rooms: [...db.rooms, r], seq: { ...db.seq, rooms: db.seq.rooms + 1 } });
    return r;
  };

  const updateRoom = (id: number, data: Partial<Room>) => {
    saveDb({ ...db, rooms: db.rooms.map(r => r.id === id ? { ...r, ...data } : r) });
  };

  const deleteRoom = (id: number) => {
    saveDb({ ...db, rooms: db.rooms.filter(r => r.id !== id) });
  };

  const createMeal = (data: Omit<Meal, 'id'>) => {
    const m: Meal = {
      ...data,
      id: db.seq.meals,
      primaryImage: data.primaryImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80'
    };
    saveDb({ ...db, meals: [...db.meals, m], seq: { ...db.seq, meals: db.seq.meals + 1 } });
    return m;
  };

  const updateMeal = (id: number, data: Partial<Meal>) => {
    saveDb({ ...db, meals: db.meals.map(m => m.id === id ? { ...m, ...data } : m) });
  };

  const deleteMeal = (id: number) => {
    saveDb({ ...db, meals: db.meals.filter(m => m.id !== id) });
  };

  const createHall = (data: Omit<Hall, 'id' | 'available'>) => {
    const h: Hall = {
      ...data,
      id: db.seq.halls,
      available: true,
      primaryImage: data.primaryImage || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=900&q=80'
    };
    saveDb({ ...db, halls: [...db.halls, h], seq: { ...db.seq, halls: db.seq.halls + 1 } });
    return h;
  };

  const updateHall = (id: number, data: Partial<Hall>) => {
    saveDb({ ...db, halls: db.halls.map(h => h.id === id ? { ...h, ...data } : h) });
  };

  const deleteHall = (id: number) => {
    saveDb({ ...db, halls: db.halls.filter(h => h.id !== id) });
  };

  const updateBookingStatus = (id: number, status: BookingStatus) => {
    const b = db.bookings.find(x => x.id === id);
    if (!b) return;
    const updatedBookings = db.bookings.map(x => x.id === id ? { ...x, status } : x);
    let updatedRooms = db.rooms;
    if (status === 'CANCELLED') {
      updatedRooms = db.rooms.map(r => r.id === b.roomId ? { ...r, availableRooms: r.availableRooms + b.roomCount } : r);
    }
    saveDb({ ...db, bookings: updatedBookings, rooms: updatedRooms });
  };

  const updateHallBookingStatus = (id: number, status: BookingStatus) => {
    const hb = db.hallBookings.find(x => x.id === id);
    if (!hb) return;
    const updatedBookings = db.hallBookings.map(x => x.id === id ? { ...x, status } : x);
    let updatedHalls = db.halls;
    if (status === 'CANCELLED') {
      updatedHalls = db.halls.map(h => h.id === hb.hallId ? { ...h, available: true } : h);
    }
    saveDb({ ...db, hallBookings: updatedBookings, halls: updatedHalls });
  };

  const resolveFeedback = (id: number) => {
    saveDb({ ...db, feedback: db.feedback.map(f => f.id === id ? { ...f, resolved: true } : f) });
  };

  return (
    <LodgeContext.Provider value={{
      theme, toggleTheme, user, login, register, logout,
      rooms: db.rooms, meals: db.meals, halls: db.halls,
      bookings: db.bookings, hallBookings: db.hallBookings, feedbackList: db.feedback,
      createBooking, payBooking, cancelBooking,
      createHallBooking, payHallBooking, cancelHallBooking,
      createFeedback, createRoom, updateRoom, deleteRoom,
      createMeal, updateMeal, deleteMeal, createHall, updateHall, deleteHall,
      updateBookingStatus, updateHallBookingStatus, resolveFeedback,
      toastMessage, showToast
    }}>
      {children}
    </LodgeContext.Provider>
  );
};

export const useLodge = () => {
  const context = useContext(LodgeContext);
  if (!context) throw new Error('useLodge must be used within a LodgeProvider');
  return context;
};