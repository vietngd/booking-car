# Hướng dẫn cập nhật Database và sử dụng tính năng mới

## 📋 Tổng quan

Đã thêm thành công các tính năng sau vào hệ thống:

1. **Dashboard Tổng quan** - Trang tổng quan với thống kê chi tiết
2. **Quản lý xe** - Quản lý danh sách phương tiện của công ty
3. **Cập nhật Database** - Thêm bảng vehicles và cập nhật bảng bookings

## 🗄️ Cập nhật Database trên Supabase

### Bước 1: Truy cập Supabase Dashboard

1. Mở trình duyệt và truy cập: https://supabase.com/dashboard
2. Chọn project của bạn: `mabxzbceppqnrdlieipo`
3. Vào phần **SQL Editor** ở menu bên trái

### Bước 2: Chạy SQL Script

1. Mở file `supabase_setup.sql` trong project
2. Copy toàn bộ nội dung file
3. Paste vào SQL Editor trên Supabase
4. Click nút **Run** để thực thi

### Bước 3: Kiểm tra

1. Vào phần **Table Editor**
2. Kiểm tra các bảng sau đã được tạo/cập nhật:
   - ✅ `public.users` - Đã có sẵn
   - ✅ `public.vehicles` - **MỚI** - Quản lý phương tiện
   - ✅ `public.bookings` - Đã được cập nhật với các cột mới

## 📊 Cấu trúc bảng Vehicles

Bảng `vehicles` có các cột sau:

| Cột                   | Kiểu dữ liệu | Mô tả                                               |
| --------------------- | ------------ | --------------------------------------------------- |
| id                    | UUID         | ID duy nhất (tự động)                               |
| license_plate         | TEXT         | Biển số xe (bắt buộc, unique)                       |
| vehicle_name          | TEXT         | Tên xe (bắt buộc)                                   |
| vehicle_type          | TEXT         | Loại xe: truck, van, car, bus                       |
| capacity              | TEXT         | Sức chứa (tùy chọn)                                 |
| status                | TEXT         | Trạng thái: available, in_use, maintenance, retired |
| driver_name           | TEXT         | Tên tài xế (tùy chọn)                               |
| driver_phone          | TEXT         | SĐT tài xế (tùy chọn)                               |
| last_maintenance_date | TIMESTAMPTZ  | Ngày bảo trì lần cuối                               |
| next_maintenance_date | TIMESTAMPTZ  | Ngày bảo trì tiếp theo                              |
| notes                 | TEXT         | Ghi chú                                             |
| created_at            | TIMESTAMPTZ  | Ngày tạo                                            |
| updated_at            | TIMESTAMPTZ  | Ngày cập nhật                                       |

## 🔐 Phân quyền (RLS Policies)

### Vehicles Table

- **Xem**: Tất cả người dùng đã đăng nhập
- **Thêm/Sửa/Xóa**: Chỉ Admin

### Bookings Table (đã cập nhật)

- Thêm cột `vehicle_id` để liên kết với phương tiện
- Thêm các cột approval flow: `approver_viet_id`, `approver_korea_id`
- Thêm các trạng thái mới: `pending_viet`, `pending_korea`, `pending_admin`, `completed`, `cancelled`

## 🎨 Tính năng mới

### 1. Trang Tổng quan (/overview)

**Đường dẫn**: `/overview`

**Tính năng**:

- 📊 Thống kê tổng quan về đặt xe
  - Tổng số đơn đặt xe
  - Số đơn chờ duyệt
  - Số đơn đã duyệt
  - Số đơn bị từ chối
- 🚗 Thống kê phương tiện
  - Tổng số phương tiện
  - Số xe sẵn sàng
  - Số xe đang sử dụng
  - Số xe đang bảo trì

- 📈 Thống kê nhanh
  - Đơn đặt xe hôm nay
  - Đơn đặt xe tuần này
  - Tỷ lệ duyệt đơn

- 📝 Danh sách đặt xe gần đây (5 đơn mới nhất)

**Ai có thể truy cập**: Tất cả người dùng (staff, manager_viet, manager_korea, admin)

### 2. Trang Quản lý xe (/admin/vehicles)

**Đường dẫn**: `/admin/vehicles`

**Tính năng**:

- ➕ Thêm phương tiện mới
- ✏️ Chỉnh sửa thông tin xe
- 🗑️ Xóa phương tiện
- 🔍 Tìm kiếm theo biển số, tên xe
- 🔽 Lọc theo trạng thái (Sẵn sàng, Đang sử dụng, Bảo trì, Ngưng hoạt động)
- 📋 Hiển thị thông tin chi tiết:
  - Biển số xe
  - Tên xe
  - Loại xe
  - Trạng thái
  - Thông tin tài xế
  - Lịch bảo trì

**Ai có thể truy cập**: Chỉ Admin

**Ai có thể chỉnh sửa**: Chỉ Admin

## 🧭 Điều hướng

Menu sidebar đã được cập nhật với các mục sau:

1. **Tổng quan** 📊 - Trang tổng quan (tất cả user)
2. **Đặt xe** 📝 - Trang đặt xe và quản lý đơn cá nhân (tất cả user)
3. **Quản lý đơn** ✅ - Quản lý tất cả đơn đặt xe (chỉ admin)
4. **Quản lý xe** 🚗 - Quản lý phương tiện (chỉ admin)
5. **Quản lý nhân sự** 👥 - Quản lý người dùng (chỉ admin)

## 🚀 Hướng dẫn sử dụng

### Đối với Admin

#### Thêm phương tiện mới

1. Vào trang **Quản lý xe**
2. Click nút **"Thêm phương tiện"**
3. Điền thông tin:
   - Biển số xe (bắt buộc)
   - Tên xe (bắt buộc)
   - Loại xe (bắt buộc)
   - Sức chứa
   - Trạng thái
   - Thông tin tài xế
   - Lịch bảo trì
   - Ghi chú
4. Click **"Thêm mới"**

#### Chỉnh sửa phương tiện

1. Vào trang **Quản lý xe**
2. Click icon ✏️ ở phương tiện cần sửa
3. Cập nhật thông tin
4. Click **"Cập nhật"**

#### Xóa phương tiện

1. Vào trang **Quản lý xe**
2. Click icon 🗑️ ở phương tiện cần xóa
3. Xác nhận xóa

### Đối với tất cả người dùng

#### Xem tổng quan

1. Đăng nhập vào hệ thống
2. Tự động chuyển đến trang **Tổng quan**
3. Xem các thống kê:
   - Thống kê đặt xe của bạn (nếu là staff)
   - Thống kê toàn hệ thống (nếu là manager/admin)
   - Thống kê phương tiện
   - Đơn đặt xe gần đây

## 🎯 Lưu ý quan trọng

1. **Phải chạy SQL script** trên Supabase trước khi sử dụng tính năng mới
2. **Chỉ Admin** mới có quyền quản lý phương tiện
3. **Tất cả user** đều có thể xem danh sách phương tiện
4. Trang **Tổng quan** hiện là trang mặc định khi đăng nhập
5. Dữ liệu thống kê được tính theo thời gian thực

## 📝 Các file đã thay đổi

### Files mới

- `src/pages/dashboard/OverviewPage.tsx` - Trang tổng quan
- `src/pages/admin/VehicleManagementPage.tsx` - Trang quản lý xe

### Files đã cập nhật

- `supabase_setup.sql` - Thêm bảng vehicles và cập nhật bookings
- `src/types/index.ts` - Thêm Vehicle và VehicleStatus types
- `src/app/router.tsx` - Thêm routes mới
- `src/components/layout/MainLayout.tsx` - Cập nhật menu sidebar
- `src/pages/login/LoginPage.tsx` - Cập nhật redirect đến /overview

## ✅ Checklist triển khai

- [ ] Chạy SQL script trên Supabase
- [ ] Kiểm tra bảng `vehicles` đã được tạo
- [ ] Kiểm tra bảng `bookings` đã được cập nhật
- [ ] Kiểm tra RLS policies đã được áp dụng
- [ ] Test đăng nhập và xem trang Tổng quan
- [ ] Test thêm/sửa/xóa phương tiện (với tài khoản admin)
- [ ] Test tìm kiếm và lọc phương tiện

## 🆘 Hỗ trợ

Nếu gặp lỗi khi chạy SQL script:

1. Kiểm tra xem các bảng đã tồn tại chưa
2. Có thể cần xóa các policies cũ trước khi tạo mới
3. Đảm bảo đang chạy với quyền admin trên Supabase

Nếu gặp lỗi "Cannot read properties of undefined":

1. Đảm bảo đã chạy SQL script
2. Refresh lại trang
3. Kiểm tra console để xem lỗi chi tiết
