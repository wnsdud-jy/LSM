import { useEffect } from "react";
import { sortProcesses } from "@/utils/processSort";
import { ProcessTable } from "@/components/processes/ProcessTable";
import { ProcessToolbar } from "@/components/processes/ProcessToolbar";
import { tauriApi } from "@/lib/tauriApi";
import type { ProcessRow } from "@/types/system";

export function ProcessesPage() {
  const rows: ProcessRow[] = [];

  useEffect(() => {
    void tauriApi.listProcesses({});
  }, []);

  const sorted = sortProcesses(rows, "cpu", "desc");

  return (
    <section>
      <ProcessToolbar />
      <ProcessTable rows={sorted} />
    </section>
  );
}
