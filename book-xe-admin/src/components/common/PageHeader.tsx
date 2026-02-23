import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex-none p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <div className="text-white">{icon}</div>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="text-slate-500 text-sm mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
};
