import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className = "" }: AppShellProps) {
  return (
    <main className={cn("min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-6", className)}>{children}</main>
  );
}
