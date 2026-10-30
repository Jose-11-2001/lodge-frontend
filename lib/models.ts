/**
 * app/lib/models.ts
 *
 * Friendly type aliases over the canonical DTOs declared in api.ts.
 * No duplicate declarations, no drift with the backend.
 *
 * Place this file NEXT TO api.ts so the relative import works.
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

// Re-export the shared enums so components can pull everything from one place
export type { Role, BookingStatus, MealType };

// Friendly aliases — same shapes as the backend DTOs
export type Room = RoomDto;
export type Meal = MealDto;
export type Hall = HallDto;
export type Booking = BookingResponse;
export type HallBooking = HallBookingResponse;
export type Feedback = FeedbackDto;

/**
 * Frontend-only type — populated from localStorage by the `auth` helper.
 * Not returned by the backend.
 */
export interface User {
  username: string;
  role: Role;
}