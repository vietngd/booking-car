import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/auth-context";
import { supabase } from "../../app/supabase";
import type { Booking, BookingStatus } from "../../types";
import {
  Check,
  X,
  Filter,
  Search,
  Calendar,
  CarFront,
  User as UserIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BookingStatusBadge } from "../../components/common/BookingStatusBadge";

export const AllBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">(
    "all",
  );
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");

  useEffect(() => {
    if (user?.role) {
      fetchAllBookings();
    }
  }, [statusFilter, vehicleFilter, user?.role]);

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("bookings")
        .select(
          `
          *,
          users!bookings_created_by_fkey (
            email
          )
        `,
        )
        .order("created_at", { ascending: false });

      // Apply RBAC filters for initial load
      if (user?.role === "manager_viet") {
        // Manager Viet only sees pending_viet (their queue) OR history of what they approved?
        // Usually admin/dashboard shows "All" but maybe focused on their tasks.
        // User complained "manager_viet not seeing records".
        // If they want to see "Everything" but only ACT on some, that's fine (current logic).
        // But if they are restricted to ONLY see relevant ones:
        // query = query.eq('status', 'pending_viet') -- this would hide history.
        // Let's assume they should see ALL, but the issue is maybe RLS or the filter logic?
        // Wait, the user said "t đăng nhập với tài khoản có position là manager_viet mà không hiện bản ghi khi nhân viên mới gửi ý"
        // "nhân viên mới gửi" -> status is "pending".
        // MANAGER_VIET NEEDS TO SEE "PENDING" TO APPROVE IT TO "PENDING_VIET"?
        // OR DOES "PENDING" MEAN "WAITING FOR VIET"?
        // Let's re-read the flow.
        // Flow: Staff creates -> Pending Viet -> Viet approves -> Pending Korea -> Korea approves -> Pending Admin -> Admin approves.
        // IF staff creates, status is likely "pending" or "pending_viet".
        // Let's check BookingForm creation.
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (vehicleFilter !== "all") {
        query = query.eq("vehicle_type", vehicleFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = (data || []).map((b) => ({
        ...b,
        creator_email: b.users?.email,
      }));

      setBookings(formatted);
    } catch (err) {
      console.error("Error fetching admin bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (booking: Booking) => {
    if (!user || !user?.role) return;

    setActioningId(booking.id);

    try {
      let updates: any = {};
      const currentStatus = booking.status;

      // Strict role-based transition logic based on user?.role
      if (user?.role === "manager_viet" && currentStatus === "pending_viet") {
        updates = {
          status: "pending_korea" as BookingStatus,
          viet_approval_status: "approved",
          approver_viet_id: user.id,
        };
      } else if (
        user?.role === "manager_korea" &&
        currentStatus === "pending_korea"
      ) {
        updates = {
          status: "pending_admin" as BookingStatus,
          korea_approval_status: "approved",
          approver_korea_id: user.id,
        };
      } else if (user?.role === "admin") {
        if (currentStatus === "pending_admin") {
          updates = {
            status: "approved" as BookingStatus,
            admin_approval_status: "approved",
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          };
        } else {
          // Admin override check logic if needed
          if (
            currentStatus === "pending_viet" ||
            currentStatus === "pending_korea"
          ) {
            // For now, let's strictly enforced shared flow, or allow admin override?
            // User asked to check flow carefully. Let's assume strict unless admin.
            // Actually, if admin tries to approve pending_viet, they skip to... pending_korea?
            // Safer to restrict or allow complete override.
            // Let's restrict for now to ensure flow.
            alert(
              `Quy trình yêu cầu: Chờ Sếp Việt -> Chờ Sếp Hàn -> Hành chính. Trạng thái hiện tại: ${currentStatus}`,
            );
            setActioningId(null);
            return;
          }
        }
      } else {
        alert("Bạn không có quyền duyệt đơn này ở trạng thái hiện tại.");
        setActioningId(null);
        return;
      }

      if (Object.keys(updates).length === 0) {
        alert("Không có hành động nào được thực hiện cho trạng thái này.");
        setActioningId(null);
        return;
      }

      console.log("Updating booking", booking.id, updates);

      const { error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", booking.id);

      if (error) throw error;

      await fetchAllBookings();
    } catch (err) {
      console.error("Error updating booking:", err);
      alert("Không thể cập nhật trạng thái đơn.");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (booking: Booking) => {
    if (!user || !user?.role) return;
    if (!confirm("Bạn chắc chắn muốn từ chối đơn này?")) return;

    setActioningId(booking.id);

    try {
      let flagUpdate = {};
      if (user?.role === "manager_viet")
        flagUpdate = { viet_approval_status: "rejected" };
      else if (user?.role === "manager_korea")
        flagUpdate = { korea_approval_status: "rejected" };
      else if (user?.role === "admin")
        flagUpdate = { admin_approval_status: "rejected" };

      const updates = {
        status: "rejected" as BookingStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        ...flagUpdate,
      };

      const { error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", booking.id);

      if (error) throw error;

      await fetchAllBookings();
    } catch (err) {
      console.error("Error rejecting booking:", err);
      alert("Không thể từ chối đơn.");
    } finally {
      setActioningId(null);
    }
  };

  const isPendingStatus = (status: string) => {
    return [
      "pending",
      "pending_viet",
      "pending_korea",
      "pending_admin",
    ].includes(status);
  };

  // Can current user approve this booking?
  const canApprove = (booking: Booking) => {
    if (!user?.role) return false;
    if (user?.role === "manager_viet" && booking.status === "pending_viet")
      return true;
    if (user?.role === "manager_korea" && booking.status === "pending_korea")
      return true;
    if (user?.role === "admin" && booking.status === "pending_admin")
      return true;
    return false;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Quản lý duyệt đơn
          </h2>
          <p className="text-slate-500 text-sm">
            Xem và xử lý tất cả yêu cầu đặt xe trong công ty
          </p>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4 bg-amber-50/50 border-amber-100">
          <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Chờ xử lý
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {bookings.filter((b) => isPendingStatus(b.status)).length}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 bg-emerald-50/50 border-emerald-100">
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Đã duyệt
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {bookings.filter((b) => b.status === "approved").length}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 bg-slate-50/50 border-slate-100">
          <div className="bg-slate-200 p-3 rounded-2xl text-slate-600">
            <CarFront className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Tổng cộng
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {bookings.length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card p-4 bg-white border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              Lọc theo:
            </span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-field py-1.5 px-3 w-auto min-w-[140px] text-xs h-9 bg-slate-50 border-transparent focus:bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Nháp</option>
            <option value="pending_viet">Chờ Sếp Việt</option>
            <option value="pending_korea">Chờ Sếp Hàn</option>
            <option value="pending_admin">Chờ Hành chính</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>

          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="input-field py-1.5 px-3 w-auto min-w-[140px] text-xs h-9 bg-slate-50 border-transparent focus:bg-white"
          >
            <option value="all">Tất cả loại xe</option>
            <option value="4 chỗ">4 chỗ</option>
            <option value="7 chỗ">7 chỗ</option>
            <option value="16 chỗ">16 chỗ</option>
          </select>

          <div className="ml-auto relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm lý do, email..."
              className="input-field pl-10 py-1.5 text-xs h-9 bg-slate-50 border-transparent focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Table / List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lịch trình
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lý do
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Không tìm thấy đơn nào phù hợp.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div className="max-w-[150px]">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {booking.creator_email}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            ID: {booking.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
                          <CarFront className="h-3.5 w-3.5 text-blue-500" />
                          {booking.vehicle_type}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs text-nowrap">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(
                            new Date(booking.travel_time),
                            "HH:mm dd/MM",
                            { locale: vi },
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 line-clamp-2 max-w-[250px] italic">
                        “{booking.reason}”
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isPendingStatus(booking.status) ? (
                        <div className="flex items-center justify-end gap-2">
                          {/* Only show buttons if user can act on this booking */}
                          {canApprove(booking) && (
                            <>
                              <button
                                onClick={() => handleReject(booking)}
                                disabled={actioningId === booking.id}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Từ chối"
                              >
                                {actioningId === booking.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <X className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleApprove(booking)}
                                disabled={actioningId === booking.id}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100 bg-emerald-50/30"
                                title="Duyệt đơn"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                            </>
                          )}

                          {/* Helper text if not actionable status for this role */}
                          {!canApprove(booking) && (
                            <span className="text-xs text-slate-400 italic">
                              Đang chờ xử lý
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {booking?.approved_at
                            ? format(
                                new Date(booking.approved_at),
                                "HH:mm dd/MM",
                                { locale: vi },
                              )
                            : "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
