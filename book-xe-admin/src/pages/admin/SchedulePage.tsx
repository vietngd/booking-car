import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../app/supabase";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar as CalendarIcon,
  RefreshCw,
  Car,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  getHours,
  getMinutes,
  isToday,
} from "date-fns";
import { vi } from "date-fns/locale";
import type { Booking } from "../../types";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";


const BOOKING_COLORS = [
  {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-800",
    sub: "text-blue-600",
    bar: "border-blue-500",
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-400",
    text: "text-violet-800",
    sub: "text-violet-600",
    bar: "border-violet-500",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    text: "text-emerald-800",
    sub: "text-emerald-600",
    bar: "border-emerald-500",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-800",
    sub: "text-amber-600",
    bar: "border-amber-500",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-400",
    text: "text-rose-800",
    sub: "text-rose-600",
    bar: "border-rose-500",
  },
];

export const SchedulePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const START_HOUR = 6;
  const END_HOUR = 22;
  const HOURS = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );
  const PIXELS_PER_HOUR = 64;

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  useEffect(() => {
    fetchBookings();
  }, [currentDate]);

  // Auto-scroll to current time on load
  useEffect(() => {
    if (!loading && scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      if (currentHour >= START_HOUR) {
        const scrollPos =
          ((currentHour - START_HOUR - 1) / (END_HOUR - START_HOUR)) *
          scrollContainerRef.current.scrollHeight;
        scrollContainerRef.current.scrollTop = Math.max(0, scrollPos);
      }
    }
  }, [loading]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, vehicle:vehicles(license_plate, vehicle_name)`)
        .or("status.eq.approved,status.eq.completed")
        .order("travel_time", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching schedule", error);
    } finally {
      setLoading(false);
    }
  };

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const today = () => setCurrentDate(new Date());

  const getEventStyle = (booking: Booking) => {
    const date = parseISO(booking.travel_time);
    const hour = getHours(date);
    const minute = getMinutes(date);
    if (hour < START_HOUR || hour > END_HOUR) return null;
    const top = ((hour - START_HOUR) * 60 + minute) * (PIXELS_PER_HOUR / 60);
    const height = 2 * PIXELS_PER_HOUR; // 2 hours duration
    return { top: `${top}px`, height: `${height}px` };
  };

  const getBookingsForDate = (date: Date) =>
    bookings.filter((b) => isSameDay(parseISO(b.travel_time), date));

  const totalBookingsThisWeek = weekDays.reduce(
    (sum, day) => sum + getBookingsForDate(day).length,
    0,
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PageHeader
        title="Lịch trình xe"
        description={`Tuần ${format(startDate, "'từ' dd/MM", { locale: vi })} — ${format(addDays(startDate, 6), "dd/MM/yyyy", { locale: vi })} · ${totalBookingsThisWeek} chuyến`}
        icon={<CalendarIcon className="h-6 w-6" />}
        action={
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        }
      />

      {/* Calendar Container */}
      <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={prevWeek}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={today}
              className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              Hôm nay
            </button>
            <button
              onClick={nextWeek}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm font-semibold text-slate-700">
            Tháng {format(startDate, "MM · yyyy")}
          </span>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <LoadingSpinner text="Đang tải lịch trình..." />
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="overflow-auto"
            style={{ maxHeight: "calc(100vh - 280px)" }}
          >
            <div className="min-w-[700px]">
              {/* Day Headers */}
              <div className="flex sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
                <div className="w-14 flex-none" />
                {weekDays.map((day, i) => {
                  const isCurrentDay = isToday(day);
                  return (
                    <div
                      key={i}
                      className={`flex-1 min-w-[90px] py-3 text-center border-r border-slate-100 last:border-r-0 ${isCurrentDay ? "bg-blue-50/50" : ""}`}
                    >
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {format(day, "EEE", { locale: vi })}
                      </p>
                      <div
                        className={`mt-1 mx-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                          isCurrentDay
                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                            : "text-slate-700"
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="flex">
                {/* Time Column */}
                <div className="w-14 flex-none border-r border-slate-100 bg-slate-50/50">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="relative border-b border-slate-100"
                      style={{ height: `${PIXELS_PER_HOUR}px` }}
                    >
                      <span className="absolute -top-2.5 right-2 text-[10px] font-semibold text-slate-400 select-none">
                        {String(hour).padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {weekDays.map((day, dayIndex) => {
                  const bookingsForDay = getBookingsForDate(day);
                  return (
                    <div
                      key={dayIndex}
                      className={`flex-1 min-w-[90px] border-r border-slate-100 last:border-r-0 relative`}
                    >
                      {/* Hour lines */}
                      {HOURS.map((_, i) => (
                        <div
                          key={i}
                          className={`border-b ${i % 2 === 0 ? "border-slate-100" : "border-slate-50"} w-full`}
                          style={{ height: `${PIXELS_PER_HOUR}px` }}
                        />
                      ))}

                      {/* Today highlight */}
                      {isToday(day) && (
                        <div className="absolute inset-0 bg-blue-50/20 pointer-events-none" />
                      )}

                      {/* Events */}
                      {bookingsForDay.map((booking, bIndex) => {
                        const style = getEventStyle(booking);
                        if (!style) return null;
                        const colorSet =
                          BOOKING_COLORS[bIndex % BOOKING_COLORS.length];

                        return (
                          <div
                            key={booking.id}
                            className={`absolute left-1 right-1 px-2 py-1.5 rounded-lg border ${colorSet.border} ${colorSet.bg} hover:z-20 transition-all cursor-pointer shadow-sm hover:shadow-md overflow-hidden group`}
                            style={style}
                            title={`${booking.requester_name} → ${booking.destination}`}
                          >
                            <div
                              className={`flex border-l-2 ${colorSet.bar} pl-1.5 h-full flex-col gap-0.5`}
                            >
                              <div
                                className={`font-bold text-[10px] ${colorSet.text} truncate`}
                              >
                                {(booking as any).vehicle?.vehicle_name ||
                                  "Xe chưa gán"}
                              </div>
                              <div
                                className={`text-[10px] ${colorSet.sub} font-medium truncate`}
                              >
                                {format(parseISO(booking.travel_time), "HH:mm")}{" "}
                                · {booking.requester_name}
                              </div>
                              <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                                <MapPin className="h-2.5 w-2.5 flex-none" />
                                <span className="text-[9px] truncate">
                                  {booking.destination}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Current time indicator */}
                      {isToday(day) && (
                        <div
                          className="absolute w-full z-10 pointer-events-none flex items-center"
                          style={{
                            top: `${((getHours(new Date()) - START_HOUR) * 60 + getMinutes(new Date())) * (PIXELS_PER_HOUR / 60)}px`,
                          }}
                        >
                          <div className="h-3 w-3 rounded-full bg-red-500 shadow-md shadow-red-200 -ml-1.5 flex-none" />
                          <div className="flex-1 border-t-2 border-red-400 border-dashed" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer - Legend */}
        {!loading && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-xs text-slate-500 font-medium">
                Thời điểm hiện tại
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium">
                {totalBookingsThisWeek} chuyến tuần này
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Chỉ hiển thị đơn đã được duyệt & hoàn thành
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
