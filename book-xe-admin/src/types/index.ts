export type Role = 'admin' | 'staff' | 'manager_viet' | 'manager_korea';

export interface User {
  id: string;
  email: string;
  role: Role;
  full_name?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export type BookingStatus = 
  | 'pending' 
  | 'pending_viet' 
  | 'pending_korea' 
  | 'pending_admin' 
  | 'approved' 
  | 'rejected' 
  | 'completed' 
  | 'cancelled';

export interface Booking {
  id: string;
  vehicle_type: string;
  travel_time: string;
  reason: string;
  status: BookingStatus;
  
  // New columns
  cargo_type?: string;
  cargo_weight?: string;
  destination?: string;
  requester_name?: string;
  requester_department?: string;
  driver_info?: string;

  // Approval flow
  viet_approval_status?: 'pending' | 'approved' | 'rejected';
  korea_approval_status?: 'pending' | 'approved' | 'rejected';
  admin_approval_status?: 'pending' | 'approved' | 'rejected';
  
  // General/Final approval info
  approved_at?: string;
  approved_by?: string;
  
  created_by: string;
  created_at: string;
  
  // Join fields (optional)
  creator_email?: string;
}
