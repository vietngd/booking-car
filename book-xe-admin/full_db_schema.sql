-- ==========================================
-- FULL DATABASE SCHEMA FOR BOOK CAR ADMIN
-- Includes:
-- 1. Core Tables (Users, Vehicles, Bookings)
-- 2. V2 Updates (Profile fields, Audit Logs)
-- 3. Fleet Management (Maintenance, Fuel)
-- ==========================================

-- 1. Create Core Tables
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'staff', 'manager_viet', 'manager_korea')) NOT NULL DEFAULT 'staff',
    full_name TEXT,
    phone TEXT,
    department TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_plate TEXT UNIQUE NOT NULL,
    vehicle_name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    capacity TEXT,
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

-- 2. Create Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Create Fleet Management Tables (New Features)
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_type TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    garage_name TEXT,
    description TEXT,
    mileage_at_service INTEGER,
    performed_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fuel_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    fill_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    liters NUMERIC(5, 2) NOT NULL,
    cost NUMERIC(12, 2) NOT NULL,
    current_mileage INTEGER,
    filled_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;

-- 5. Define Policies (Consolidated)

-- Users
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Privileged users can view all profiles" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')));

-- Bookings
CREATE POLICY "Staff can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Staff can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Privileged users can view all bookings" ON public.bookings FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')));
CREATE POLICY "Privileged users can update bookings" ON public.bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')));

-- Vehicles
CREATE POLICY "All authenticated users can view vehicles" ON public.vehicles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Only admins can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can update vehicles" ON public.vehicles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can delete vehicles" ON public.vehicles FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Audit Logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Maintenance Records
CREATE POLICY "Privileged users can view maintenance_records" ON public.maintenance_records FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')));
CREATE POLICY "Privileged users can manage maintenance_records" ON public.maintenance_records FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')));

-- Fuel Logs
CREATE POLICY "Privileged users can view fuel_logs" ON public.fuel_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')));
CREATE POLICY "Privileged users can manage fuel_logs" ON public.fuel_logs FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')));

-- 6. Trigger for New User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    'staff', 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
