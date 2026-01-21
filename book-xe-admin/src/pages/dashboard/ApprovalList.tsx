import React, { useState } from "react";
import type { Booking } from "../../types";
import { Table, type Column } from "../../components/common/table/Table";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "../../app/supabase";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ApprovalListProps {
  bookings: Booking[];
  loading: boolean;
  onRefresh: () => void;
  approverRole: "manager_viet" | "manager_korea" | "admin";
}

export const ApprovalList: React.FC<ApprovalListProps> = ({
  bookings,
  loading,
  onRefresh,
  approverRole,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (booking: Booking) => {
    if (!confirm("Bạn có chắc chắn muốn duyệt yêu cầu này?")) return;
    setProcessingId(booking.id);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let updates: any = {};

      // Logic flow
      if (approverRole === "manager_viet") {
        updates = {
          status: "pending_korea",
          viet_approval_status: "approved",
          approver_viet_id: user?.id,
        };
      } else if (approverRole === "manager_korea") {
        updates = {
          status: "pending_admin",
          korea_approval_status: "approved",
          approver_korea_id: user?.id,
        };
      } else if (approverRole === "admin") {
        updates = {
          status: "approved",
          admin_approval_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        };
      }

      console.log("Approving with updates:", updates);

      const { error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", booking.id);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi duyệt. Vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (booking: Booking) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối yêu cầu này?")) return;
    setProcessingId(booking.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          // Update specific status too
          ...(approverRole === "manager_viet" && {
            viet_approval_status: "rejected",
          }),
          ...(approverRole === "manager_korea" && {
            korea_approval_status: "rejected",
          }),
          ...(approverRole === "admin" && {
            admin_approval_status: "rejected",
          }),
        })
        .eq("id", booking.id);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi từ chối.");
    } finally {
      setProcessingId(null);
    }
  };

  const columns: Column<Booking>[] = [
    {
      header: "Người yêu cầu",
      cell: (item) => (
        <div>
          <div className="font-medium">{item.requester_name}</div>
          <div className="text-xs text-slate-500">
            {item.requester_department}
          </div>
        </div>
      ),
    },
    {
      header: "Chi tiết",
      cell: (item) => (
        <div className="max-w-xs">
          <p className="font-semibold">{item.vehicle_type}</p>
          <p className="text-sm text-slate-600">
            Hàng: {item.cargo_type} ({item.cargo_weight})
          </p>
          <p className="text-sm text-slate-600">Đến: {item.destination}</p>
          <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
            {item.reason}
          </p>
        </div>
      ),
    },
    {
      header: "Thời gian đi",
      cell: (item) => (
        <span className="text-sm">
          {format(new Date(item.travel_time), "HH:mm dd/MM", { locale: vi })}
        </span>
      ),
    },
    {
      header: "Thao tác",
      cell: (item) => (
        <div className="flex items-center gap-2">
          {processingId === item.id ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(item);
                }}
                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Duyệt"
              >
                <CheckCircle className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(item);
                }}
                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                title="Từ chối"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      data={bookings}
      columns={columns}
      loading={loading}
      emptyMessage="Không có yêu cầu nào cần duyệt."
    />
  );
};
