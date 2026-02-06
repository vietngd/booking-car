import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../app/supabase";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar as CalendarIcon,
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

export const SchedulePage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Time range config (6:00 AM to 22:00 PM)
  const START_HOUR = 6;
  const END_HOUR = 22;
  const HOURS = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );
  const PIXELS_PER_HOUR = 60; // 1px = 1min height

  // Calculate week range
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  useEffect(() => {
    fetchBookings();
    // Scroll to current time roughly on load if today is in view
    if (scrollContainerRef.current) {
      // scrollContainerRef.current.scrollTop = 300; // Optional auto-scroll
    }
  }, [currentDate]);

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

  // Helper to calculate position
  const getEventStyle = (booking: Booking) => {
    const date = parseISO(booking.travel_time);
    const hour = getHours(date);
    const minute = getMinutes(date);

    // Skip if outside viewable hours (simplification)
    if (hour < START_HOUR || hour > END_HOUR) return null;

    const startMinutesFromTop = (hour - START_HOUR) * 60 + minute;
    const top = (startMinutesFromTop / 60) * PIXELS_PER_HOUR;

    // Assume 2 hours duration for visualization since we don't have end_time in DB yet
    const durationHours = 2;
    const height = durationHours * PIXELS_PER_HOUR;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((b) => isSameDay(parseISO(b.travel_time), date));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200 animate-in fade-in duration-500">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Lịch trình xe</h1>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={prevWeek}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={today}
              className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white shadow-sm rounded-md"
            >
              Hôm nay
            </button>
            <button
              onClick={nextWeek}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-lg font-semibold text-slate-700 ml-2">
            Tháng {format(startDate, "MM yyyy", { locale: vi })}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          {/* Scrollable Grid Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-auto relative"
          >
            <div className="min-w-[800px] relative">
              {/* Header Row (Days) */}
              <div className="flex sticky top-0 z-10 bg-white border-b border-slate-200">
                <div className="w-16 flex-none border-r border-slate-200 bg-white"></div>{" "}
                {/* Time axis spacer */}
                {weekDays.map((day, i) => {
                  const isDayToday = isToday(day);
                  return (
                    <div
                      key={i}
                      className={`flex-1 min-w-[120px] py-4 text-center border-r border-slate-200 last:border-r-0 ${isDayToday ? "bg-blue-50/30" : ""}`}
                    >
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">
                        {format(day, "EEE", { locale: vi })}
                      </div>
                      <div
                        className={`text-xl font-medium inline-flex items-center justify-center w-8 h-8 rounded-full ${isDayToday ? "bg-blue-600 text-white shadow-md" : "text-slate-800"}`}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body */}
              <div className="flex relative">
                {/* Time Axis Column */}
                <div className="w-16 flex-none border-r border-slate-200 bg-white sticky left-0 z-10">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="relative h-[60px]"
                      style={{ height: `${PIXELS_PER_HOUR}px` }}
                    >
                      <span className="absolute -top-3 right-2 text-xs text-slate-400 font-medium bg-white px-1">
                        {hour}:00
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
                      className="flex-1 min-w-[120px] border-r border-slate-200 last:border-r-0 relative bg-slate-50/10"
                    >
                      {/* Grid Lines */}
                      {HOURS.map((_, i) => (
                        <div
                          key={i}
                          className="border-b border-slate-100 w-full absolute w-full"
                          style={{
                            top: `${i * PIXELS_PER_HOUR}px`,
                            height: "1px",
                          }}
                        ></div>
                      ))}

                      {/* Events */}
                      {bookingsForDay.map((booking) => {
                        const style = getEventStyle(booking);
                        if (!style) return null;

                        return (
                          <div
                            key={booking.id}
                            className="absolute left-1 right-1 px-2 py-1 rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:z-20 transition-all cursor-pointer shadow-sm overflow-hidden group"
                            style={style}
                            title={`${booking.requester_name} - ${booking.destination}`}
                          >
                            <div className="flex border-l-2 border-blue-500 pl-1.5 h-full flex-col">
                              <div className="font-semibold text-xs text-blue-800 truncate leading-tight">
                                {(booking as any).vehicle?.vehicle_name ||
                                  "Xe chưa gán"}
                              </div>
                              <div className="text-[10px] text-blue-600 font-medium truncate mt-0.5">
                                {format(parseISO(booking.travel_time), "HH:mm")}{" "}
                                - {booking.requester_name}
                              </div>
                              <div className="flex items-center gap-1 mt-1 text-slate-500">
                                <MapPin className="h-3 w-3 flex-none" />
                                <span className="text-[10px] truncate">
                                  {booking.destination}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Current Time Indicator Line (if today) */}
                      {isToday(day) && (
                        <div
                          className="absolute w-full border-t-2 border-red-500 z-10 pointer-events-none flex items-center"
                          style={{
                            top: `${(((getHours(new Date()) - START_HOUR) * 60 + getMinutes(new Date())) / 60) * PIXELS_PER_HOUR}px`,
                          }}
                        >
                          <div className="h-2 w-2 bg-red-500 rounded-full -ml-1"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
