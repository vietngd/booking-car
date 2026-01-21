import React from "react";
import type { Booking } from "../../types";
import { BookingStatusBadge } from "../../components/common/BookingStatusBadge";
import { Table, type Column } from "../../components/common/table/Table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface BookingListProps {
  bookings: Booking[];
  loading: boolean;
}

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  loading,
}) => {
  const columns: Column<Booking>[] = [
    {
      header: "Mã đơn",
      cell: (item) => (
        <span className="text-xs text-slate-500 font-mono">
          #{item.id.slice(0, 8)}
        </span>
      ),
    },
    {
      header: "Người yêu cầu",
      accessorKey: "requester_name",
    },
    {
      header: "Bộ phận",
      accessorKey: "requester_department",
    },
    {
      header: "Loại xe / Hàng",
      cell: (item) => (
        <div>
          <div className="font-medium">{item.vehicle_type}</div>
          <div className="text-xs text-slate-500">
            {item.cargo_type} ({item.cargo_weight})
          </div>
        </div>
      ),
    },
    {
      header: "Điểm đến",
      accessorKey: "destination",
    },
    {
      header: "Thời gian",
      cell: (item) => (
        <span className="text-sm">
          {format(new Date(item.travel_time), "HH:mm dd/MM/yyyy", {
            locale: vi,
          })}
        </span>
      ),
    },
    {
      header: "Trạng thái",
      cell: (item) => <BookingStatusBadge status={item.status} />,
    },
  ];

  return (
    <Table
      data={bookings}
      columns={columns}
      loading={loading}
      emptyMessage="Bạn chưa có yêu cầu đặt xe nào."
    />
  );
};
