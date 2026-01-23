import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/auth-context";
import { supabase } from "../../app/supabase";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import type { Booking } from "../../types";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  thisMonthBookings: number;
  thisYearBookings: number;
}

interface ChartData {
  name: string;
  bookings: number;
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
    thisMonthBookings: 0,
    thisYearBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [chartRange, setChartRange] = useState<"week" | "month" | "year">(
    "month",
  );
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (allBookings.length > 0) {
      processChartData();
    }
  }, [allBookings, chartRange]);

  const processChartData = () => {
    const now = new Date();
    let data: ChartData[] = [];

    if (chartRange === "week") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("vi-VN", {
          weekday: "short",
          day: "numeric",
        });
        const count = allBookings.filter((b) => {
          const bDate = new Date(b.created_at);
          return (
            bDate.getDate() === d.getDate() &&
            bDate.getMonth() === d.getMonth() &&
            bDate.getFullYear() === d.getFullYear()
          );
        }).length;
        data.push({ name: dateStr, bookings: count });
      }
    } else if (chartRange === "month") {
      // Current month by day
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const count = allBookings.filter((b) => {
          const bDate = new Date(b.created_at);
          return (
            bDate.getDate() === i &&
            bDate.getMonth() === now.getMonth() &&
            bDate.getFullYear() === now.getFullYear()
          );
        }).length;
        if (i % 2 !== 0 || i === daysInMonth) {
          // Show every 2 days to avoid crowding
          data.push({ name: `${i}/${now.getMonth() + 1}`, bookings: count });
        } else {
          data.push({ name: ``, bookings: count }); // Empty label for spacing
        }
      }
    } else if (chartRange === "year") {
      // Current year by month
      const monthNames = [
        "Th1",
        "Th2",
        "Th3",
        "Th4",
        "Th5",
        "Th6",
        "Th7",
        "Th8",
        "Th9",
        "Th10",
        "Th11",
        "Th12",
      ];
      for (let i = 0; i < 12; i++) {
        const count = allBookings.filter((b) => {
          const bDate = new Date(b.created_at);
          return (
            bDate.getMonth() === i && bDate.getFullYear() === now.getFullYear()
          );
        }).length;
        data.push({ name: monthNames[i], bookings: count });
      }
    }

    setChartData(data);
  };

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
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

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
        thisMonthBookings: bookingsData.filter(
          (b) => new Date(b.created_at) >= firstDayOfMonth,
        ).length,
        thisYearBookings: bookingsData.filter(
          (b) => new Date(b.created_at) >= firstDayOfYear,
        ).length,
      });

      setAllBookings(bookingsData);

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
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {" "}
        {/* Vehicle Status Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Thống kê trạng thái phương tiện
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: "Sẵn sàng", value: stats.availableVehicles },
                { name: "Đang dùng", value: stats.inUseVehicles },
                { name: "Bảo trì", value: stats.maintenanceVehicles },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#576e92ff" name="Số lượng" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Booking Status Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Thống kê trạng thái đặt xe
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Chờ duyệt",
                    value: stats.pendingBookings,
                    color: "#f59e0b",
                  },
                  {
                    name: "Đã duyệt",
                    value: stats.approvedBookings,
                    color: "#10b981",
                  },
                  {
                    name: "Từ chối",
                    value: stats.rejectedBookings,
                    color: "#ef4444",
                  },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  {
                    name: "Chờ duyệt",
                    value: stats.pendingBookings,
                    color: "#f59e0b",
                  },
                  {
                    name: "Đã duyệt",
                    value: stats.approvedBookings,
                    color: "#10b981",
                  },
                  {
                    name: "Từ chối",
                    value: stats.rejectedBookings,
                    color: "#ef4444",
                  },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booking Trend Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Xu hướng đặt xe
          </h2>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(["week", "month", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  chartRange === range
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {range === "week"
                  ? "Tuần"
                  : range === "month"
                    ? "Tháng"
                    : "Năm"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="bookings"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Số lượng đặt xe"
            />
          </LineChart>
        </ResponsiveContainer>
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
                  Tháng này
                </span>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {stats.thisMonthBookings}
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
