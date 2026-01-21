import React from "react";

// type BookingStatus =
//   | "pending"
//   | "pending_viet"
//   | "pending_korea"
//   | "pending_admin"
//   | "approved"
//   | "rejected"
//   | "completed"
//   | "cancelled";

interface BookingStatusBadgeProps {
  status: string; // Type loosening to string for easier DB mapping
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Nháp",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  pending_viet: {
    label: "Chờ Sếp Việt duyệt",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  pending_korea: {
    label: "Chờ Sếp Hàn duyệt",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  pending_admin: {
    label: "Chờ Hành chính duyệt",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  approved: {
    label: "Đã xếp xe",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  completed: {
    label: "Hoàn thành",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  cancelled: {
    label: "Hủy",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
}) => {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
};
