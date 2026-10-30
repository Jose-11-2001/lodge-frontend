
export type * from '../lib/api';
export type * from '../lib/models';
export type Role = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface Room {
  id: number;
  name: string;
  building: string;
  description: string;
  pricePerNight: number;
  totalRooms: number;
  availableRooms: number;
  amenities: string[];
  primaryImage: string;
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface Meal {
  id: number;
  name: string;
  mealType: MealType;
  description: string;
  price: number;
  primaryImage: string;
}

export interface Hall {
  id: number;
  name: string;
  building: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  pricePerDay: number;
  available: boolean;
  primaryImage: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

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
  paymentReference: string | null;
  paymentMethod: string | null;
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
  paymentReference: string | null;
  paymentMethod: string | null;
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
  paymentReference: string | null;
  paymentMethod: string | null;
}

export interface Feedback {
  id: number;
  customerUsername: string;
  bookingId: number | null;
  rating: number;
  comment: string;
  resolved: boolean;
  createdAt: string;
}