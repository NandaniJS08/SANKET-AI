/**
 * User domain types
 *
 * Derived from the actual shape stored in localStorage key "infrawatch_user"
 * and the data/users.js array. Properties match exactly what the application
 * currently uses — no invented fields, no removed fields.
 */

/** The three roles the application currently supports. */
export type UserRole =
  | "Government Officer"
  | "Reviewer / Monitoring Officer"
  | "Project Administrator";

/** The user object as returned by apiService.login() and stored in localStorage. */
export interface User {
  id:         number | string;
  email:      string;
  password?:  string;   // Stored in the demo users array; not sent to a real API.
  role:       UserRole;
  name:       string;
  avatar:     string;   // Initials, e.g. "RK"
  department: string;
  agency:     string;
  token?:     string;   // Supabase Auth Bearer JWT token
}
