import React, { useEffect, useState } from "react";
import { supabase } from "../../app/supabase";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Wrench,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import type { Vehicle } from "../../types";

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

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

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
              message: `Xe ${v.vehicle_name} đã quá hạn bảo trì ${Math.abs(daysUntil)} ngày.`,
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

      // 2. Check Pending Bookings (Mock logic: "Stuck" bookings)
      const { data: pendingBookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "pending")
        .lt(
          "created_at",
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ); // Older than 2 days

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

      // 3. System Health (Mock)
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

  const getIcon = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-5 w-5" />;
      case "booking":
        return <Bell className="h-5 w-5" />;
      case "system":
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-rose-50 text-rose-600 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "low":
        return "bg-blue-50 text-blue-600 border-blue-200";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Trung tâm Cảnh báo
          </h1>
          <p className="text-slate-500">
            Thông báo quan trọng về hệ thống và vận hành
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">
                Không có cảnh báo nào
              </h3>
              <p className="text-slate-500">
                Hệ thống đang hoạt động hoàn hảo!
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4"
              >
                <div
                  className={`p-3 rounded-full border ${getColor(alert.severity)}`}
                >
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-900">
                      {alert.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(alert.date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{alert.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
