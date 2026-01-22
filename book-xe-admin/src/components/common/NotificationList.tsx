import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotification } from "@/app/notification-context";



import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function NotificationList() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors outline-none focus:ring-2 focus:ring-slate-200">
          <Bell className="w-6 h-6 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-1 ring-white" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4" align="end">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-semibold text-sm text-slate-900">Thông báo</h4>
          {unreadCount > 0 ? (
            <button 
                onClick={() => markAllAsRead()}
                className="text-xs text-blue-600 font-medium hover:underline"
            >
              Đánh dấu tất cả
            </button>
          ) : null}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={cn(
                    "p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer",
                    !notification.read && "bg-blue-50/50"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h5
                      className={cn(
                        "text-sm",
                        !notification.read
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-700"
                      )}
                    >
                      {notification.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 text-nowrap ml-2">
                       {/* Handle potential invalid dates safely */}
                       {(() => {
                            try {
                                return formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi });
                            } catch (e) {
                                return "vừa xong";
                            }
                       })()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Không có thông báo mới</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <button className="w-full text-xs text-center text-blue-600 font-medium hover:underline py-1">
                Xem tất cả
            </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
