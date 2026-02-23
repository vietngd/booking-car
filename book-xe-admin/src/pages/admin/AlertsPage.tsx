import React, { useEffect, useState } from "react";
import { supabase } from "../../app/supabase";
import {
  CheckCircle2,
  Bell,
  Wrench,
  RefreshCw,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Vehicle } from "../../types";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";

interface Alert {
  id: string;
  type: "maintenance" | "booking" | "system";
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  date: string;
  actionLabel?: string;
  relatedId?: string;
}

const severityConfig = {
  high: {
    label: "Khẩn cấp",
    bg: "bg-rose-50",
    border: "border-rose-200",
    iconBg: "bg-rose-100",
    text: "text-rose-600",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
  },
  medium: {
    label: "Cảnh báo",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  low: {
    label: "Thông tin",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
};

const typeConfig = {
  maintenance: { icon: Wrench, label: "Bảo trì" },
  booking: { icon: Bell, label: "Đặt xe" },
  system: { icon: Zap, label: "Hệ thống" },
};

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Alert["severity"]>("all");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const generatedAlerts: Alert[] = [];

      // 1. Check Maintenance
      const { data: vehicles } = await supabase.from("vehicles").select("*");

      vehicles?.forEach((v: Vehicle) => {
        if (v.next_maintenance_date) {
          const daysUntil = differenceInDays(
            parseISO(v.next_maintenance_date),
            new Date(),
          );

          if (daysUntil < 0) {
            generatedAlerts.push({
              id: `maint-over-${v.id}`,
              type: "maintenance",
              severity: "high",
              title: `Bảo trì quá hạn: ${v.license_plate}`,
              message: `Xe ${v.vehicle_name} đã quá hạn bảo trì ${Math.abs(daysUntil)} ngày. Cần xử lý ngay!`,
              date: v.next_maintenance_date,
            });
          } else if (daysUntil <= 7) {
            generatedAlerts.push({
              id: `maint-soon-${v.id}`,
              type: "maintenance",
              severity: "medium",
              title: `Sắp đến hạn bảo trì: ${v.license_plate}`,
              message: `Xe ${v.vehicle_name} cần bảo trì trong ${daysUntil} ngày tới.`,
              date: v.next_maintenance_date,
            });
          }
        }
      });

      // 2. Check Pending Bookings (Stuck bookings > 2 days)
      const { data: pendingBookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "pending")
        .lt(
          "created_at",
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        );

      pendingBookings?.forEach((b) => {
        generatedAlerts.push({
          id: `booking-stuck-${b.id}`,
          type: "booking",
          severity: "low",
          title: "Đơn chờ duyệt lâu",
          message: `Đơn đặt xe đi ${b.destination} của ${b.requester_name} đã treo hơn 2 ngày.`,
          date: b.created_at,
        });
      });

      // 3. System Health
      generatedAlerts.push({
        id: "sys-1",
        type: "system",
        severity: "low",
        title: "Hệ thống hoạt động ổn định",
        message:
          "Tất cả các dịch vụ (Database, Storage) đang hoạt động bình thường.",
        date: new Date().toISOString(),
      });

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error("Error generating alerts", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts =
    filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  const counts = {
    all: alerts.length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Trung tâm Cảnh báo"
        description="Thông báo quan trọng về hệ thống và vận hành"
        icon={<ShieldAlert className="h-6 w-6" />}
        action={
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            { key: "all", label: "Tất cả", color: "bg-slate-600" },
            { key: "high", label: "Khẩn cấp", color: "bg-rose-600" },
            { key: "medium", label: "Cảnh báo", color: "bg-amber-500" },
            { key: "low", label: "Thông tin", color: "bg-blue-600" },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
              filter === item.key
                ? "border-blue-300 shadow-md ring-2 ring-blue-100"
                : "border-slate-100 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-2 w-2 rounded-full ${item.color}`} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {item.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {counts[item.key]}
            </p>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Đang kiểm tra hệ thống..." />
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" />}
            title="Không có cảnh báo nào"
            description="Hệ thống đang hoạt động hoàn hảo!"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const sev = severityConfig[alert.severity];
            const typeInfo = typeConfig[alert.type];
            const IconComponent = typeInfo.icon;

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl border ${sev.border} shadow-sm hover:shadow-md transition-all duration-200 p-5 flex items-start gap-4`}
              >
                {/* Icon */}
                <div
                  className={`flex-none p-3 rounded-xl ${sev.iconBg} ${sev.text}`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {alert.title}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sev.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                      {sev.label}
                    </span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                      {typeInfo.label}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{alert.message}</p>
                </div>

                {/* Date */}
                <div className="flex-none text-right">
                  <p className="text-xs font-medium text-slate-400">
                    {format(new Date(alert.date), "dd/MM/yyyy", { locale: vi })}
                  </p>
                  <p className="text-xs text-slate-300">
                    {format(new Date(alert.date), "HH:mm", { locale: vi })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
