import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/auth-context";
import { supabase } from "../../app/supabase";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Car,
  Wrench,
  BarChart3,
  Activity,
} from "lucide-react";
import type { Booking } from "../../types";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { BookingStatusBadge } from "../../components/common/BookingStatusBadge";

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

const PIE_COLORS = ["#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#8B5CF6"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-bold text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
    if (user) fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (allBookings.length > 0) processChartData();
  }, [allBookings, chartRange]);

  const processChartData = () => {
    const now = new Date();
    let data: ChartData[] = [];

    if (chartRange === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const count = allBookings.filter((b) => {
          const bDate = new Date(b.created_at);
          return (
            bDate.getDate() === d.getDate() &&
            bDate.getMonth() === d.getMonth() &&
            bDate.getFullYear() === d.getFullYear()
          );
        }).length;
        data.push({
          name: d.toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "numeric",
          }),
          bookings: count,
        });
      }
    } else if (chartRange === "month") {
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
        data.push({
          name:
            i % 3 === 1 || i === daysInMonth
              ? `${i}/${now.getMonth() + 1}`
              : "",
          bookings: count,
        });
      }
    } else {
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
      let bookingsQuery = supabase.from("bookings").select("*");
      if (user?.role === "staff") {
        bookingsQuery = bookingsQuery.eq("created_by", user.id);
      }
      const { data: bookings } = await bookingsQuery;
      const { data: vehicles } = await supabase.from("vehicles").select("*");

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfYear = new Date(now.getFullYear(), 0, 1);

      const bData = bookings || [];
      const vData = vehicles || [];

      setStats({
        totalBookings: bData.length,
        pendingBookings: bData.filter((b) =>
          [
            "pending",
            "pending_viet",
            "pending_korea",
            "pending_admin",
          ].includes(b.status),
        ).length,
        approvedBookings: bData.filter((b) => b.status === "approved").length,
        rejectedBookings: bData.filter((b) => b.status === "rejected").length,
        totalVehicles: vData.length,
        availableVehicles: vData.filter((v) => v.status === "available").length,
        inUseVehicles: vData.filter((v) => v.status === "in_use").length,
        maintenanceVehicles: vData.filter((v) => v.status === "maintenance")
          .length,
        todayBookings: bData.filter((b) => new Date(b.created_at) >= today)
          .length,
        thisMonthBookings: bData.filter(
          (b) => new Date(b.created_at) >= firstOfMonth,
        ).length,
        thisYearBookings: bData.filter(
          (b) => new Date(b.created_at) >= firstOfYear,
        ).length,
      });

      setAllBookings(bData);
      setRecentBookings(
        [...bData]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 6),
      );
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Đang tải dữ liệu tổng quan..." />;
  }

  const approvalRate =
    stats.totalBookings > 0
      ? Math.round((stats.approvedBookings / stats.totalBookings) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Tổng quan Dashboard"
        description="Xem tổng quan về hệ thống đặt xe và quản lý phương tiện"
        icon={<BarChart3 className="h-6 w-6" />}
      />

      {/* Booking Stats */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
          Thống kê đặt xe
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Tổng đặt xe"
            value={stats.totalBookings}
            icon={<Calendar className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Chờ duyệt"
            value={stats.pendingBookings}
            icon={<Clock className="h-5 w-5" />}
            color="yellow"
          />
          <StatCard
            title="Đã duyệt"
            value={stats.approvedBookings}
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            title="Từ chối"
            value={stats.rejectedBookings}
            icon={<XCircle className="h-5 w-5" />}
            color="red"
          />
        </div>
      </div>

      {/* Vehicle Stats */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
          Thống kê phương tiện
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Tổng phương tiện"
            value={stats.totalVehicles}
            icon={<Car className="h-5 w-5" />}
            color="indigo"
          />
          <StatCard
            title="Sẵn sàng"
            value={stats.availableVehicles}
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            title="Đang sử dụng"
            value={stats.inUseVehicles}
            icon={<Activity className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Đang bảo trì"
            value={stats.maintenanceVehicles}
            icon={<Wrench className="h-5 w-5" />}
            color="orange"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle PieChart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Phân bổ phương tiện
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Sẵn sàng", value: stats.availableVehicles },
                    { name: "Đang dùng", value: stats.inUseVehicles },
                    { name: "Bảo trì", value: stats.maintenanceVehicles },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {[0, 1, 2].map((index) => (
                    <Cell key={index} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #f1f5f9",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Thống kê nhanh
          </h3>
          <div className="grid grid-cols-2 gap-3 h-48">
            {[
              {
                label: "Hôm nay",
                value: stats.todayBookings,
                color: "blue",
                icon: "📅",
              },
              {
                label: "Tháng này",
                value: stats.thisMonthBookings,
                color: "purple",
                icon: "📊",
              },
              {
                label: "Năm nay",
                value: stats.thisYearBookings,
                color: "indigo",
                icon: "🗓️",
              },
              {
                label: "Tỷ lệ duyệt",
                value: `${approvalRate}%`,
                color: "green",
                icon: "✅",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="text-xl">{item.icon}</div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">
                    {item.label}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Xu hướng đặt xe
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Biểu đồ số lượng đơn đặt xe theo thời gian
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(["week", "month", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="bookings"
                name="Số đặt xe"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#gradBookings)"
                dot={{ fill: "#3B82F6", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-900">Đặt xe gần đây</h3>
          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
            {recentBookings.length} đơn mới nhất
          </span>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            Chưa có đặt xe nào
          </p>
        ) : (
          <div className="space-y-2">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-none">
                    <Car className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {booking.requester_name ||
                        booking.vehicle_type ||
                        "Đặt xe"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {new Date(
                        booking.travel_time || booking.created_at,
                      ).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
