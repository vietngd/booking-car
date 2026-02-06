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
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface CostData {
  month: string;
  fuel: number;
  maintenance: number;
}

interface BookingStatusData {
  name: string;
  value: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

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

      // Fetch aggregated data (Mocked logic for aggregation as Supabase JS doesn't do complex group by easily without RPC)
      // In a real app, use RPC or Edge Functions. Here we fetch all and calculate client-side for "Perfect" demo.

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

        // Filter logs for this month/year
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
        name: key,
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
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Calculate totals
  const totalFuel = costData.reduce((acc, curr) => acc + curr.fuel, 0);
  const totalMaintenance = costData.reduce(
    (acc, curr) => acc + curr.maintenance,
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Báo cáo & Thống kê
          </h1>
          <p className="text-slate-500">
            Phân tích chi phí và hiệu quả vận hành (6 tháng gần nhất)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng chi phí nhiên liệu
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {totalFuel.toLocaleString("vi-VN")} ₫
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng chi bảo trì
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {totalMaintenance.toLocaleString("vi-VN")} ₫
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng chi phí vận hành
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {(totalFuel + totalMaintenance).toLocaleString("vi-VN")} ₫
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Biểu đồ Chi phí (VND)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="fuel"
                  name="Nhiên liệu"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="maintenance"
                  name="Bảo trì"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Tỷ lệ Trạng thái Đơn hàng
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
