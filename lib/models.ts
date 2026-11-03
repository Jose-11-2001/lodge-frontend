/**
 * lib/models.ts
 *
 * Friendly type aliases over the canonical DTOs declared in api.ts.
 */

import type {
  RoomDto,
  MealDto,
  HallDto,
  BookingResponse,
  HallBookingResponse,
  FeedbackDto,
  Role,
  BookingStatus,
  MealType,
  PaymentMethod,
} from './api';

export type { Role, BookingStatus, MealType, PaymentMethod };

export type Room = RoomDto;
export type Meal = MealDto;
export type Hall = HallDto;
export type Booking = BookingResponse;
export type HallBooking = HallBookingResponse;
export type Feedback = FeedbackDto;

/** A meal order (meal + quantity + serve time + payment state). */
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
  paymentReference?: string | null;
  paymentMethod?: PaymentMethod | null;
}

export interface User {
  id: number;
  username: string;
  role: Role;
}