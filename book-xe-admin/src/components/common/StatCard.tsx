import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange" | "indigo";
  trend?: {
    value: number;
    label: string;
  };
  suffix?: string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    iconBg: "bg-blue-600",
    shadow: "shadow-blue-100",
    gradient: "from-blue-500 to-blue-700",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    iconBg: "bg-emerald-600",
    shadow: "shadow-emerald-100",
    gradient: "from-emerald-500 to-emerald-700",
  },
  yellow: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    iconBg: "bg-amber-500",
    shadow: "shadow-amber-100",
    gradient: "from-amber-400 to-amber-600",
  },
  red: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    iconBg: "bg-rose-600",
    shadow: "shadow-rose-100",
    gradient: "from-rose-500 to-rose-700",
  },
  purple: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    iconBg: "bg-violet-600",
    shadow: "shadow-violet-100",
    gradient: "from-violet-500 to-violet-700",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    iconBg: "bg-orange-500",
    shadow: "shadow-orange-100",
    gradient: "from-orange-400 to-orange-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    iconBg: "bg-indigo-600",
    shadow: "shadow-indigo-100",
    gradient: "from-indigo-500 to-indigo-700",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = "blue",
  trend,
  suffix,
}) => {
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 group overflow-hidden relative">
      {/* Background decoration */}
      <div
        className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${colors.bg} opacity-60 transition-all duration-300 group-hover:scale-150`}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-3xl font-bold text-slate-900">
              {typeof value === "number"
                ? value.toLocaleString("vi-VN")
                : value}
            </p>
            {suffix && (
              <span className="text-sm font-medium text-slate-400">
                {suffix}
              </span>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-semibold ${trend.value >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={`flex-none p-3.5 bg-gradient-to-br ${colors.gradient} rounded-2xl shadow-lg ${colors.shadow} text-white`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
