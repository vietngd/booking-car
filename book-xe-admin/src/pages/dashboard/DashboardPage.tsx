import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/auth-context";
import { supabase } from "../../app/supabase";
import type { Booking, BookingStatus } from "../../types";
import {
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  CarFront,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const VEHICLE_TYPES = ["4 chỗ", "7 chỗ", "16 chỗ"];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [vehicleType, setVehicleType] = useState("4 chỗ");
  const [travelTime, setTravelTime] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchMyBookings();
  }, [user]);

  const fetchMyBookings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from("bookings").insert([
        {
          vehicle_type: vehicleType,
          travel_time: travelTime,
          reason,
          created_by: user.id,
          status: "pending" as BookingStatus,
        },
      ]);

      if (error) throw error;

      // Reset form and refresh list
      setTravelTime("");
      setReason("");
      fetchMyBookings();
    } catch (err) {
      console.error("Error creating booking:", err);
      alert("Không thể tạo đơn. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return <span className="status-badge status-pending">Đang chờ</span>;
      case "approved":
        return <span className="status-badge status-approved">Đã duyệt</span>;
      case "rejected":
        return <span className="status-badge status-rejected">Từ chối</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 capitalize">
            Xin chào, {user?.email?.split("@")[0]} 👋
          </h2>
          <p className="text-slate-500">Hôm nay bạn cần di chuyển đi đâu?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Booking Form */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Đặt xe mới
              </h3>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <CarFront className="h-4 w-4 text-slate-400" />
                  Loại xe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {VEHICLE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVehicleType(type)}
                      className={cn(
                        "py-2 px-3 text-xs font-medium rounded-lg border transition-all",
                        vehicleType === type
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Thời gian
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input-field"
                  value={travelTime}
                  onChange={(e) => setTravelTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  Lý do sử dụng
                </label>
                <textarea
                  required
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Ví dụ: Đi gặp đối tác tại Quận 1..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-2.5 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  "Xác nhận đặt xe"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* My Bookings List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">
              Lịch sử đặt xe của bạn
            </h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {bookings.length} đơn
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 card bg-white/50 border-dashed">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center px-4">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <CarFront className="h-8 w-8 text-slate-300" />
                </div>
                <h4 className="text-slate-900 font-semibold">
                  Chưa có yêu cầu nào
                </h4>
                <p className="text-slate-500 text-sm mt-1 max-w-xs">
                  Các đơn đặt xe của bạn sẽ xuất hiện tại đây khi bạn tạo chúng.
                </p>
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="card group hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500"
                >
                  <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(booking.status)}
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          # {booking.id.slice(0, 8)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg">
                        {booking.vehicle_type}
                      </h4>
                      <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {format(
                          new Date(booking.travel_time),
                          "HH:mm - dd/MM/yyyy",
                          { locale: vi },
                        )}
                      </p>
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                        <p className="text-slate-600 text-sm line-clamp-2 italic">
                          “{booking.reason}”
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-[10px] text-slate-400">
                        Tạo lúc:{" "}
                        {format(new Date(booking.created_at), "HH:mm dd/MM", {
                          locale: vi,
                        })}
                      </div>
                      {booking.status === "pending" ? (
                        <div className="bg-amber-100 text-amber-700 p-2 rounded-full">
                          <Clock className="h-5 w-5" />
                        </div>
                      ) : booking.status === "approved" ? (
                        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="bg-rose-100 text-rose-700 p-2 rounded-full">
                          <XCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
