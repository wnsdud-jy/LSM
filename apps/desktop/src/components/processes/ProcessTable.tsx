import type { ProcessRow } from "@/types/system";
import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProcessActions } from "./ProcessActions";

export function ProcessTable({ rows }: { rows: ProcessRow[] }) {
  const list = useMemo(() => rows, [rows]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">PID</TableHead>
          <TableHead>USER</TableHead>
          <TableHead>COMMAND</TableHead>
          <TableHead>CPU%</TableHead>
          <TableHead>MEM%</TableHead>
          <TableHead className="w-48">ACTIONS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.map((row) => (
          <TableRow key={row.pid}>
            <TableCell className="font-mono">{row.pid}</TableCell>
            <TableCell>{row.user}</TableCell>
            <TableCell className="max-w-0 truncate" title={row.command}>
              {row.command}
            </TableCell>
            <TableCell>{row.cpu_percent.toFixed(1)}%</TableCell>
            <TableCell>{row.mem_percent.toFixed(1)}%</TableCell>
            <TableCell>
              <ProcessActions pid={row.pid} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
