/**
 * lib/models.ts
 *
 * Friendly type aliases over the canonical DTOs declared in api.ts.
 * No duplicate declarations, no drift with the backend.
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
} from './api';

export type { Role, BookingStatus, MealType };

export type Room = RoomDto;
export type Meal = MealDto;
export type Hall = HallDto;
export type Booking = BookingResponse;
export type HallBooking = HallBookingResponse;
export type Feedback = FeedbackDto;

export interface User {
  username: string;
  role: Role;
}