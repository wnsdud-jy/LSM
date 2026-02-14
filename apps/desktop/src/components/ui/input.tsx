import { forwardRef } from "react";

type InputProps = Omit<React.ComponentProps<"input">, "className"> & {
  className?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
});
