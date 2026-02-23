import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/auth-context";
import {
  Car,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  CheckSquare,
  ChevronRight,
  Truck,
  BarChart3,
  Wrench,
  Droplet,
  List,
  PieChart,
  Calendar,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { NotificationList } from "../common/NotificationList";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROLE_LABELS: Record<string, string> = {
  staff: "Nhân viên",
  manager_viet: "Sếp Việt",
  manager_korea: "Sếp Hàn",
  admin: "Quản trị viên",
};

export const MainLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Tổng quan",
      icon: BarChart3,
      path: "/overview",
      roles: ["staff", "manager_viet", "manager_korea", "admin"],
    },
    {
      label: "Đặt xe",
      icon: LayoutDashboard,
      path: "/dashboard",
      roles: ["staff", "manager_viet", "manager_korea", "admin"],
    },
    {
      label: "Quản lý đơn",
      icon: CheckSquare,
      path: "/admin/bookings",
      roles: ["admin"],
    },
    {
      label: "Quản lý xe",
      icon: Truck,
      path: "/admin/vehicles",
      roles: ["admin"],
    },
    {
      label: "Bảo trì & Sửa chữa",
      icon: Wrench,
      path: "/admin/maintenance",
      roles: ["admin", "manager_viet", "manager_korea"],
    },
    {
      label: "Quản lý Nhiên liệu",
      icon: Droplet,
      path: "/admin/fuel",
      roles: ["admin", "manager_viet", "manager_korea"],
    },
    {
      label: "Quản lý Danh mục",
      icon: List,
      path: "/admin/master-data",
      roles: ["admin"],
    },
    {
      label: "Quản lý nhân sự",
      icon: UserIcon,
      path: "/admin/users",
      roles: ["admin"],
    },
    {
      label: "Báo cáo & Thống kê",
      icon: PieChart,
      path: "/admin/reports",
      roles: ["admin", "manager_viet", "manager_korea"],
    },
    {
      label: "Lịch xe",
      icon: Calendar,
      path: "/admin/schedule",
      roles: ["admin", "manager_viet", "manager_korea", "staff"],
    },
    {
      label: "Cảnh báo",
      icon: Bell,
      path: "/admin/alerts",
      roles: ["admin", "manager_viet", "manager_korea"],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes((user?.role as string) || "staff"),
  );

  const activeItem = navItems.find((item) =>
    location.pathname.startsWith(item.path),
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-200">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              CarBooking
            </span>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pb-2 pt-1">
          Điều hướng
        </p>
        {filteredNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 flex-none",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-600",
                  )}
                  style={{ height: "18px", width: "18px" }}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-blue-200 flex-none">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-blue-600 font-medium">
              {ROLE_LABELS[user?.role || "staff"] || user?.role}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="Đăng xuất"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-none"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 hidden lg:flex flex-col shadow-sm z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white flex flex-col shadow-2xl z-50 lg:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 overflow-auto flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-4 lg:px-8 justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-base font-bold text-slate-900">
                {activeItem?.label || "Book Xe Online"}
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                <span>CarBooking</span>
                <span>›</span>
                <span className="text-blue-600 font-medium">
                  {activeItem?.label || "Trang chủ"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationList />
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-xs shadow-md">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
