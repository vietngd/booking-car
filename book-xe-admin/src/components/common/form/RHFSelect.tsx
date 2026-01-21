import React from "react";
import type {
  UseFormRegister,
  FieldValues,
  Path,
  FieldErrors,
} from "react-hook-form";

interface Option {
  label: string;
  value: string | number;
}

interface RHFSelectProps<
  T extends FieldValues,
> extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  options: Option[];
  errors?: FieldErrors<T>;
  icon?: React.ReactNode;
  containerClassName?: string;
  placeholder?: string;
  required?: boolean;
}

export const RHFSelect = <T extends FieldValues>({
  name,
  label,
  register,
  options,
  errors,
  icon,
  containerClassName = "",
  className = "",
  placeholder = "Chọn...",
  ...props
}: RHFSelectProps<T>) => {
  const errorMessage = errors?.[name]?.message as string | undefined;

  return (
    <div className={containerClassName}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700 mb-1.5 ml-1"
      >
        {label}
        {props.required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <select
          id={name}
          {...register(name)}
          className={`block w-full rounded-xl border-0 py-3 ${icon ? "pl-11" : "pl-4"} pr-8 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all bg-slate-50/50 hover:bg-white focus:bg-white appearance-none ${className} ${errorMessage ? "ring-rose-300 focus:ring-rose-500" : ""}`}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <svg
            className="h-4 w-4 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      {errorMessage && (
        <p className="mt-1 text-sm text-rose-600 ml-1 font-medium flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-rose-500 inline-block" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};
