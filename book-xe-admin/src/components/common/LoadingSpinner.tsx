import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullPage?: boolean;
}

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text = "Đang tải dữ liệu...",
  fullPage = false,
}) => {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={`${sizeMap[size]} rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin`}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export const TableLoadingRow: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Đang tải dữ liệu...
        </p>
      </div>
    </td>
  </tr>
);
