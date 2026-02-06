-- 1. Create master_data table
CREATE TABLE IF NOT EXISTS public.master_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- 'department', 'cargo_type', 'cargo_weight'
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.master_data ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Everyone can view active master data" 
ON public.master_data FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage master data" 
ON public.master_data FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Seed initial data (Optional but helpful)
INSERT INTO public.master_data (type, label, value, sort_order) VALUES
-- Departments
('department', 'Kho (Warehouse)', 'Kho', 1),
('department', 'Sản xuất (Production)', 'Sản xuất', 2),
('department', 'Kế toán (Accounting)', 'Kế toán', 3),
('department', 'Nhân sự (HR)', 'Nhân sự', 4),
('department', 'Sales / Marketing', 'Sales', 5),
('department', 'Kỹ thuật (Engineering)', 'Kỹ thuật', 6),
('department', 'IT', 'IT', 7),
('department', 'Bảo vệ (Security)', 'Bảo vệ', 8),
('department', 'Khác', 'Khác', 99),

-- Cargo Types
('cargo_type', 'Nguyên vật liệu', 'Nguyên vật liệu', 1),
('cargo_type', 'Thành phẩm', 'Thành phẩm', 2),
('cargo_type', 'Máy móc / Thiết bị', 'Máy móc / Thiết bị', 3),
('cargo_type', 'Phế liệu', 'Phế liệu', 4),
('cargo_type', 'Văn phòng phẩm / Đồ dùng', 'Văn phòng phẩm / Đồ dùng', 5),
('cargo_type', 'Khác', 'Khác', 99),

-- Cargo Weights
('cargo_weight', 'Dưới 100kg', 'Dưới 100kg', 1),
('cargo_weight', '100kg - 500kg', '100kg - 500kg', 2),
('cargo_weight', '500kg - 1 tấn', '500kg - 1 tấn', 3),
('cargo_weight', '1 tấn - 2 tấn', '1 tấn - 2 tấn', 4),
('cargo_weight', 'Trên 2 tấn', 'Trên 2 tấn', 5);
