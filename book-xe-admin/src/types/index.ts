export type Role = 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface Booking {
  id: string;
  vehicle_type: string;
  travel_time: string;
  reason: string;
  status: BookingStatus;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  approved_at: string | null;
  // Join fields
  creator_email?: string;
  approver_email?: string;
}
