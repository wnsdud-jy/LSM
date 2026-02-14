import { useEffect } from "react";
import { sortProcesses } from "@/utils/processSort";
import { ProcessTable } from "@/components/processes/ProcessTable";
import { ProcessToolbar } from "@/components/processes/ProcessToolbar";
import { useSystemStore } from "@/stores/systemStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ProcessRow } from "@/types/system";

export function ProcessesPage() {
  const rows: ProcessRow[] = useSystemStore((state) => state.processes);

  useEffect(() => {
    void useSystemStore.getState().refreshProcesses();
  }, []);

  const sorted = sortProcesses(rows, "cpu", "desc");

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Processes</CardTitle>
        </CardHeader>
        <CardContent>
          <ProcessToolbar />
          <ProcessTable rows={sorted} />
        </CardContent>
      </Card>
    </section>
  );
}
