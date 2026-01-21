import React from "react";
import type {
  UseFormRegister,
  FieldValues,
  Path,
  FieldErrors,
} from "react-hook-form";

interface RHFInputProps<
  T extends FieldValues,
> extends React.InputHTMLAttributes<HTMLInputElement> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const RHFInput = <T extends FieldValues>({
  name,
  label,
  register,
  errors,
  icon,
  containerClassName = "",
  className = "",
  ...props
}: RHFInputProps<T>) => {
  const errorMessage = errors?.[name]?.message as string | undefined;

  return (
    <div className={containerClassName}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700 mb-1.5 ml-1"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={name}
          {...register(name)}
          className={`block w-full rounded-xl border-0 py-3 ${icon ? "pl-11" : "pl-4"} pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all bg-slate-50/50 hover:bg-white focus:bg-white ${className} ${errorMessage ? "ring-rose-300 focus:ring-rose-500 bg-rose-50/10" : ""}`}
          {...props}
        />
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
