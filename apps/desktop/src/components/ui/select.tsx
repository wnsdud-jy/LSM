import { forwardRef, type ReactNode } from "react";

type SelectProps = Omit<React.ComponentProps<"select">, "className"> & {
  className?: string;
  children: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className = "", children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:border-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

export const SelectOption = ({ children, value }: { children: ReactNode; value: string }) => (
  <option value={value}>{children}</option>
);
