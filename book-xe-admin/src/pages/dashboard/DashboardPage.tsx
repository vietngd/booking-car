import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/auth-context";
import { supabase } from "../../app/supabase";
import type { Booking } from "../../types";
import { BookingForm } from "./BookingForm";
import { BookingList } from "./BookingList";
import { ApprovalList } from "./ApprovalList";
import { PlusCircle, History as HistoryIcon, CheckSquare } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "create" | "my-history" | "approvals"
  >("create");
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      if (["manager_viet", "manager_korea", "admin"].includes(user.role)) {
        setActiveTab("approvals");
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (activeTab === "my-history") {
        fetchMyBookings();
      } else if (activeTab === "approvals") {
        fetchPendingApprovals();
      }
    }
  }, [user, activeTab]);

  const fetchMyBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: true });

      if (user?.role === "manager_viet") {
        query = query.eq("status", "pending_viet");
      } else if (user?.role === "manager_korea") {
        query = query.eq("status", "pending_korea");
      } else if (user?.role === "admin") {
        query = query.eq("status", "pending_admin");
      } else {
        // Staff shouldn't see this tab usually, or empty
        setPendingApprovals([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (err) {
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const canApprove = ["manager_viet", "manager_korea", "admin"].includes(
    user?.role || "staff",
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Quản lý đặt xe và phê duyệt</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("create")}
            className={`
              group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors duration-200
              ${
                activeTab === "create"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }
            `}
          >
            <PlusCircle
              className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === "create" ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500"}`}
            />
            Đặt xe mới
          </button>

          {canApprove && (
            <button
              onClick={() => setActiveTab("approvals")}
              className={`
                group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors duration-200
                ${
                  activeTab === "approvals"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }
                `}
            >
              <CheckSquare
                className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === "approvals" ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500"}`}
              />
              Cần duyệt
              {/* Badge for count could go here */}
            </button>
          )}

          <button
            onClick={() => setActiveTab("my-history")}
            className={`
              group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors duration-200
              ${
                activeTab === "my-history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }
            `}
          >
            <HistoryIcon
              className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === "my-history" ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500"}`}
            />
            Lịch sử của tôi
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === "create" && (
          <div className="max-w-3xl mx-auto">
            <BookingForm onSuccess={() => setActiveTab("my-history")} />
          </div>
        )}

        {activeTab === "my-history" && (
          <BookingList bookings={myBookings} loading={loading} />
        )}

        {activeTab === "approvals" && canApprove && (
          <ApprovalList
            bookings={pendingApprovals}
            loading={loading}
            onRefresh={fetchPendingApprovals}
            approverRole={
              user?.role as "manager_viet" | "manager_korea" | "admin"
            }
          />
        )}
      </div>
    </div>
  );
};
