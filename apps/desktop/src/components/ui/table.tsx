import { type ReactNode } from "react";

type NodeProps = {
  className?: string;
  children: ReactNode;
};

export function Table({ className = "", children }: NodeProps) {
  return <div className={`relative w-full overflow-auto rounded-md border border-slate-200 ${className}`}><table className="w-full caption-bottom text-sm">{children}</table></div>;
}

export function TableHeader({ className = "", children }: NodeProps) {
  return <thead className={`[&_tr]:border-b ${className}`}>{children}</thead>;
}

export function TableBody({ className = "", children }: NodeProps) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>;
}

export function TableRow({ className = "", children }: NodeProps) {
  return <tr className={`border-b transition-colors hover:bg-slate-50 ${className}`}>{children}</tr>;
}

export function TableHead({ className = "", children }: NodeProps) {
  return <th className={`h-10 px-4 text-left align-middle font-medium text-slate-600 ${className}`}>{children}</th>;
}

export function TableCell({ className = "", children }: NodeProps) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function TableCaption({ className = "", children }: NodeProps) {
  return <caption className={`mt-4 text-sm text-slate-500 ${className}`}>{children}</caption>;
}
