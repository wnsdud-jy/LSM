import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  className?: string;
  children: ReactNode;
};

export function Card({ className, children }: CardProps) {
  return <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>{children}</section>;
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn("flex flex-col space-y-1.5 p-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h3 className={cn("text-sm font-semibold leading-none tracking-tight", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: CardProps) {
  return <p className={cn("text-sm text-slate-500", className)}>{children}</p>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("p-4 pt-0", className)}>{children}</div>;
}

export function CardFooter({ className, children }: CardProps) {
  return <div className={cn("flex items-center p-4 pt-0", className)}>{children}</div>;
}
