-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'staff', 'manager_viet', 'manager_korea')) NOT NULL DEFAULT 'staff'
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_plate TEXT UNIQUE NOT NULL,
    vehicle_name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL, -- 'truck', 'van', 'car', etc.
    capacity TEXT, -- cargo capacity or passenger seats
    status TEXT CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')) NOT NULL DEFAULT 'available',
    driver_name TEXT,
    driver_phone TEXT,
    last_maintenance_date TIMESTAMPTZ,
    next_maintenance_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_type TEXT NOT NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    travel_time TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'pending_viet', 'pending_korea', 'pending_admin', 'approved', 'rejected', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
    
    -- Cargo/trip details
    cargo_type TEXT,
    cargo_weight TEXT,
    destination TEXT,
    requester_name TEXT,
    requester_department TEXT,
    driver_info TEXT,
    
    -- Approval flow
    approver_viet_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approver_korea_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    viet_approval_status TEXT CHECK (viet_approval_status IN ('pending', 'approved', 'rejected')),
    korea_approval_status TEXT CHECK (korea_approval_status IN ('pending', 'approved', 'rejected')),
    admin_approval_status TEXT CHECK (admin_approval_status IN ('pending', 'approved', 'rejected')),
    
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    approved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 3. Policies for 'users' table
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Privileged users can view all profiles" 
ON public.users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')
  )
);

-- 4. Policies for 'bookings' table
CREATE POLICY "Staff can view their own bookings" 
ON public.bookings FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Staff can create bookings" 
ON public.bookings FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Privileged users can view all bookings" 
ON public.bookings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')
  )
);

CREATE POLICY "Privileged users can update bookings" 
ON public.bookings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')
  )
);

-- 5. Policies for 'vehicles' table
CREATE POLICY "All authenticated users can view vehicles" 
ON public.vehicles FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert vehicles" 
ON public.vehicles FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update vehicles" 
ON public.vehicles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete vehicles" 
ON public.vehicles FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Trigger to automatically create a user profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Function to set initial admin (you can run this manually for your first email)
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
