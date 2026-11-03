// types.ts
export type Role = 'ADMIN' | 'CUSTOMER';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentMethod = 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface Room {
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

export interface Meal {
  id: number;
  name: string;
  mealType?: MealType;
  description?: string;
  price: number;
  primaryImage?: string;
  images?: string[];
}

export interface Hall {
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

export interface Booking {
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
  paymentReference: string | null;   // ← allow null
  paymentMethod: PaymentMethod | null; // ← allow null
}

export interface HallBooking {
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
  paymentReference: string | null;     // ← allow null
  paymentMethod: PaymentMethod | null; // ← allow null
}

export interface MealOrder {
  id: number;
  mealId: number;
  mealName: string;
  customerUsername: string;
  quantity: number;
  serveAt: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  paid: boolean;
  paymentReference: string | null;     // ← allow null
  paymentMethod: PaymentMethod | null; // ← allow null
}

export interface Feedback {
  id: number;
  customerUsername: string;
  bookingId?: number | null;   // ← optional/nullable
  rating: number;
  comment?: string;            // ← optional
  resolved: boolean;
  createdAt: string;
}