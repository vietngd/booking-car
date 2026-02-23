import React, { useEffect, useState } from "react";
import { supabase } from "../../app/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { StatCard } from "../../components/common/StatCard";

interface CostData {
  month: string;
  fuel: number;
  maintenance: number;
}

interface BookingStatusData {
  name: string;
  value: number;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#F97316",
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  pending_viet: "Chờ sếp Việt",
  pending_korea: "Chờ sếp Hàn",
  pending_admin: "Chờ admin",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

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
            <span className="font-semibold text-slate-800">
              {entry.value.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ReportsPage: React.FC = () => {
  const [costData, setCostData] = useState<CostData[]>([]);
  const [statusData, setStatusData] = useState<BookingStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: fuelLogs } = await supabase
        .from("fuel_logs")
        .select("cost, fill_date");
      const { data: maintenance } = await supabase
        .from("maintenance_records")
        .select("cost, service_date");
      const { data: bookings } = await supabase
        .from("bookings")
        .select("status");

      // Process Cost Data (Last 6 months)
      const months = [
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
      ];
      const currentMonth = new Date().getMonth();
      const reportData: CostData[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(currentMonth - i);
        const monthKey = months[d.getMonth()];
        const year = d.getFullYear();

        const monthlyFuel =
          fuelLogs
            ?.filter((l) => {
              const date = new Date(l.fill_date);
              return (
                date.getMonth() === d.getMonth() && date.getFullYear() === year
              );
            })
            .reduce((sum, l) => sum + (l.cost || 0), 0) || 0;

        const monthlyMaint =
          maintenance
            ?.filter((l) => {
              const date = new Date(l.service_date);
              return (
                date.getMonth() === d.getMonth() && date.getFullYear() === year
              );
            })
            .reduce((sum, l) => sum + (l.cost || 0), 0) || 0;

        reportData.push({
          month: monthKey,
          fuel: monthlyFuel,
          maintenance: monthlyMaint,
        });
      }
      setCostData(reportData);

      // Process Booking Status
      const statusCounts =
        bookings?.reduce((acc: any, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {}) || {};

      const pieData = Object.keys(statusCounts).map((key) => ({
        name: STATUS_LABELS[key] || key,
        value: statusCounts[key],
      }));
      setStatusData(pieData);
    } catch (error) {
      console.error("Error fetching report data", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Đang tổng hợp báo cáo..." />;
  }

  const totalFuel = costData.reduce((acc, curr) => acc + curr.fuel, 0);
  const totalMaintenance = costData.reduce(
    (acc, curr) => acc + curr.maintenance,
    0,
  );
  const totalOp = totalFuel + totalMaintenance;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Báo cáo & Thống kê"
        description="Phân tích chi phí và hiệu quả vận hành (6 tháng gần nhất)"
        icon={<PieIcon className="h-6 w-6" />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Tổng chi phí nhiên liệu"
          value={totalFuel}
          icon={<DollarSign className="h-5 w-5" />}
          color="blue"
          suffix="₫"
        />
        <StatCard
          title="Tổng chi bảo trì"
          value={totalMaintenance}
          icon={<TrendingDown className="h-5 w-5" />}
          color="red"
          suffix="₫"
        />
        <StatCard
          title="Tổng chi phí vận hành"
          value={totalOp}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
          suffix="₫"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">
              Chi phí theo tháng
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Biểu đồ theo dõi xu hướng chi phí vận hành
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costData}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="fuel"
                  name="Nhiên liệu"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorFuel)"
                />
                <Area
                  type="monotone"
                  dataKey="maintenance"
                  name="Bảo trì"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#colorMaint)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">
              Tỷ lệ trạng thái đơn hàng
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Phân bổ đơn đặt xe theo trạng thái
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar Chart full width */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-900">
            So sánh chi phí nhiên liệu & bảo trì
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Biểu đồ so sánh chi tiết theo từng tháng
          </p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />
              <Bar
                dataKey="fuel"
                name="Nhiên liệu"
                fill="#3B82F6"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="maintenance"
                name="Bảo trì"
                fill="#EF4444"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
