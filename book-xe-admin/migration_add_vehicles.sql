-- ============================================
-- MIGRATION SCRIPT - Thêm tính năng mới
-- Chạy script này trên Supabase SQL Editor
-- ============================================

-- 1. Tạo bảng vehicles (nếu chưa có)
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

-- 2. Thêm các cột mới vào bảng bookings (nếu chưa có)
DO $$ 
BEGIN
    -- Thêm vehicle_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='vehicle_id') THEN
        ALTER TABLE public.bookings ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL;
    END IF;

    -- Thêm cargo_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='cargo_type') THEN
        ALTER TABLE public.bookings ADD COLUMN cargo_type TEXT;
    END IF;

    -- Thêm cargo_weight
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='cargo_weight') THEN
        ALTER TABLE public.bookings ADD COLUMN cargo_weight TEXT;
    END IF;

    -- Thêm destination
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='destination') THEN
        ALTER TABLE public.bookings ADD COLUMN destination TEXT;
    END IF;

    -- Thêm requester_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='requester_name') THEN
        ALTER TABLE public.bookings ADD COLUMN requester_name TEXT;
    END IF;

    -- Thêm requester_department
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='requester_department') THEN
        ALTER TABLE public.bookings ADD COLUMN requester_department TEXT;
    END IF;

    -- Thêm driver_info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='driver_info') THEN
        ALTER TABLE public.bookings ADD COLUMN driver_info TEXT;
    END IF;

    -- Thêm approver_viet_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='approver_viet_id') THEN
        ALTER TABLE public.bookings ADD COLUMN approver_viet_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- Thêm approver_korea_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='approver_korea_id') THEN
        ALTER TABLE public.bookings ADD COLUMN approver_korea_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- Thêm viet_approval_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='viet_approval_status') THEN
        ALTER TABLE public.bookings ADD COLUMN viet_approval_status TEXT CHECK (viet_approval_status IN ('pending', 'approved', 'rejected'));
    END IF;

    -- Thêm korea_approval_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='korea_approval_status') THEN
        ALTER TABLE public.bookings ADD COLUMN korea_approval_status TEXT CHECK (korea_approval_status IN ('pending', 'approved', 'rejected'));
    END IF;

    -- Thêm admin_approval_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='admin_approval_status') THEN
        ALTER TABLE public.bookings ADD COLUMN admin_approval_status TEXT CHECK (admin_approval_status IN ('pending', 'approved', 'rejected'));
    END IF;

    -- Thêm updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='updated_at') THEN
        ALTER TABLE public.bookings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
    END IF;
END $$;

-- 3. Cập nhật constraint cho status column trong bookings
DO $$
BEGIN
    -- Drop constraint cũ nếu có
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
    
    -- Thêm constraint mới với các status mới
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'pending_viet', 'pending_korea', 'pending_admin', 'approved', 'rejected', 'completed', 'cancelled'));
END $$;

-- 4. Enable RLS cho vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 5. Drop các policies cũ nếu có (để tránh conflict)
DROP POLICY IF EXISTS "All authenticated users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Only admins can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Only admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Only admins can delete vehicles" ON public.vehicles;

-- 6. Tạo policies mới cho vehicles
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

-- 7. Thêm dữ liệu mẫu cho vehicles (để test)
INSERT INTO public.vehicles (license_plate, vehicle_name, vehicle_type, capacity, status, driver_name, driver_phone, notes)
VALUES 
    ('29A-12345', 'Toyota Hilux', 'truck', '2 tấn', 'available', 'Nguyễn Văn A', '0901234567', 'Xe tải chở hàng nội bộ'),
    ('30B-67890', 'Hyundai H350', 'van', '16 chỗ', 'available', 'Trần Văn B', '0912345678', 'Xe đưa đón nhân viên'),
    ('51C-11111', 'Ford Transit', 'van', '12 chỗ', 'in_use', 'Lê Văn C', '0923456789', 'Xe đang sử dụng cho chuyến đi'),
    ('29D-22222', 'Isuzu QKR', 'truck', '1.9 tấn', 'maintenance', 'Phạm Văn D', '0934567890', 'Đang bảo trì định kỳ'),
    ('30E-33333', 'Toyota Camry', 'car', '5 chỗ', 'available', NULL, NULL, 'Xe công vụ')
ON CONFLICT (license_plate) DO NOTHING;

-- 8. Thông báo hoàn thành
DO $$
BEGIN
    RAISE NOTICE '✅ Migration hoàn thành!';
    RAISE NOTICE '📊 Bảng vehicles đã được tạo';
    RAISE NOTICE '🔄 Bảng bookings đã được cập nhật với các cột mới';
    RAISE NOTICE '🔐 RLS policies đã được thiết lập';
    RAISE NOTICE '🚗 Đã thêm 5 phương tiện mẫu';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Bạn có thể kiểm tra:';
    RAISE NOTICE '   - Vào Table Editor để xem bảng vehicles';
    RAISE NOTICE '   - Refresh ứng dụng để xem dữ liệu mới';
END $$;
