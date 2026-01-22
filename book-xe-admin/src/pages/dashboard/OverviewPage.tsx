import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/auth-context";
import { supabase } from "../../app/supabase";
import {
  Car,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import type { Booking } from "../../types";

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  totalVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  todayBookings: number;
  thisWeekBookings: number;
}

export const OverviewPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    inUseVehicles: 0,
    maintenanceVehicles: 0,
    todayBookings: 0,
    thisWeekBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      let bookingsQuery = supabase.from("bookings").select("*");

      // If staff, only show their bookings
      if (user?.role === "staff") {
        bookingsQuery = bookingsQuery.eq("created_by", user.id);
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery;

      if (bookingsError) throw bookingsError;

      // Fetch vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*");

      if (vehiclesError) throw vehiclesError;

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const bookingsData = bookings || [];
      const vehiclesData = vehicles || [];

      setStats({
        totalBookings: bookingsData.length,
        pendingBookings: bookingsData.filter((b) =>
          [
            "pending",
            "pending_viet",
            "pending_korea",
            "pending_admin",
          ].includes(b.status),
        ).length,
        approvedBookings: bookingsData.filter((b) => b.status === "approved")
          .length,
        rejectedBookings: bookingsData.filter((b) => b.status === "rejected")
          .length,
        totalVehicles: vehiclesData.length,
        availableVehicles: vehiclesData.filter((v) => v.status === "available")
          .length,
        inUseVehicles: vehiclesData.filter((v) => v.status === "in_use").length,
        maintenanceVehicles: vehiclesData.filter(
          (v) => v.status === "maintenance",
        ).length,
        todayBookings: bookingsData.filter(
          (b) => new Date(b.created_at) >= today,
        ).length,
        thisWeekBookings: bookingsData.filter(
          (b) => new Date(b.created_at) >= weekAgo,
        ).length,
      });

      // Get recent bookings (last 5)
      const recent = bookingsData
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5);
      setRecentBookings(recent);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }> = ({ title, value, icon, color, bgColor }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`${bgColor} ${color} p-4 rounded-xl`}>{icon}</div>
      </div>
    </div>
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Chờ duyệt",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      },
      pending_viet: {
        label: "Chờ sếp Việt duyệt",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      },
      pending_korea: {
        label: "Chờ sếp Hàn duyệt",
        className: "bg-orange-50 text-orange-700 border-orange-200",
      },
      pending_admin: {
        label: "Chờ hành chính Admin duyệt",
        className: "bg-purple-50 text-purple-700 border-purple-200",
      },
      approved: {
        label: "Đã duyệt",
        className: "bg-green-50 text-green-700 border-green-200",
      },
      rejected: {
        label: "Từ chối",
        className: "bg-red-50 text-red-700 border-red-200",
      },
      completed: {
        label: "Hoàn thành",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      },
      cancelled: {
        label: "Đã hủy",
        className: "bg-slate-50 text-slate-700 border-slate-200",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Tổng quan Dashboard
        </h1>
        <p className="text-slate-500">
          Xem tổng quan về hệ thống đặt xe và quản lý phương tiện
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng đặt xe"
          value={stats.totalBookings}
          icon={<Calendar className="h-6 w-6" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Chờ duyệt"
          value={stats.pendingBookings}
          icon={<Clock className="h-6 w-6" />}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatCard
          title="Đã duyệt"
          value={stats.approvedBookings}
          icon={<CheckCircle className="h-6 w-6" />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Từ chối"
          value={stats.rejectedBookings}
          icon={<XCircle className="h-6 w-6" />}
          color="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* Vehicle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng phương tiện"
          value={stats.totalVehicles}
          icon={<Car className="h-6 w-6" />}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />
        <StatCard
          title="Sẵn sàng"
          value={stats.availableVehicles}
          icon={<CheckCircle className="h-6 w-6" />}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Đang sử dụng"
          value={stats.inUseVehicles}
          icon={<TrendingUp className="h-6 w-6" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          title="Bảo trì"
          value={stats.maintenanceVehicles}
          icon={<AlertCircle className="h-6 w-6" />}
          color="text-rose-600"
          bgColor="bg-rose-50"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Đặt xe gần đây
          </h2>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                Chưa có đặt xe nào
              </p>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {booking.vehicle_type}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(booking.travel_time).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div>{getStatusBadge(booking.status)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Thống kê nhanh
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">
                  Hôm nay
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {stats.todayBookings}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">
                  Tuần này
                </span>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {stats.thisWeekBookings}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-slate-700">
                  Tỷ lệ duyệt
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {stats.totalBookings > 0
                  ? Math.round(
                      (stats.approvedBookings / stats.totalBookings) * 100,
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
