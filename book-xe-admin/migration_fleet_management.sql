-- 1. Create maintenance_records table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_type TEXT NOT NULL, -- 'scheduled', 'repair', 'inspection', etc.
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    garage_name TEXT,
    description TEXT,
    mileage_at_service INTEGER, -- Odometer reading
    performed_by TEXT, -- Mechanic name or simple text
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create fuel_logs table
CREATE TABLE IF NOT EXISTS public.fuel_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    fill_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    liters NUMERIC(5, 2) NOT NULL,
    cost NUMERIC(12, 2) NOT NULL,
    current_mileage INTEGER,
    filled_by TEXT, -- Driver name or user
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies for 'maintenance_records'
CREATE POLICY "Privileged users can view maintenance_records" 
ON public.maintenance_records FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')
  )
);

CREATE POLICY "Privileged users can manage maintenance_records" 
ON public.maintenance_records FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')
  )
);

-- 5. Policies for 'fuel_logs'
CREATE POLICY "Privileged users can view fuel_logs" 
ON public.fuel_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')
  )
);

CREATE POLICY "Privileged users can manage fuel_logs" 
ON public.fuel_logs FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager_viet', 'manager_korea')
  )
);
