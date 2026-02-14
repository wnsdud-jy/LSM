import type { ReactNode } from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "destructive";
type ButtonSize = "default" | "sm";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

const variants: Record<ButtonVariant, string> = {
  default: "bg-slate-900 text-white hover:bg-slate-700",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  outline: "border border-slate-200 text-slate-900 hover:bg-slate-50",
  ghost: "text-slate-900 hover:bg-slate-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-9 px-3",
  sm: "h-8 px-2",
};

export function Button({ children, variant = "default", size = "default", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors ${sizes[size]} py-1.5 ${variants[variant]} ${className}`.trim()}
      {...props}
      type={props.type ?? "button"}
    >
      {children}
    </button>
  );
}
