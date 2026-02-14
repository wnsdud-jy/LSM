import type { ProcessSignal } from "@/types/system";
import { tauriApi } from "@/lib/tauriApi";
import { Button } from "@/components/ui/button";

type ProcessActionsProps = {
  pid: number;
};

export function ProcessActions({ pid }: ProcessActionsProps) {
  return (
    <div className="inline-flex gap-2">
      <Button variant="outline" size="sm" onClick={() => void tauriApi.sendProcessSignal(pid, "Sigterm" as ProcessSignal)}>
        TERM
      </Button>
      <Button variant="destructive" size="sm" onClick={() => void tauriApi.sendProcessSignal(pid, "Sigkill" as ProcessSignal)}>
        KILL
      </Button>
      <Button variant="secondary" size="sm" onClick={() => void tauriApi.sendProcessSignal(pid, "Sigstop" as ProcessSignal)}>
        STOP
      </Button>
      <Button variant="secondary" size="sm" onClick={() => void tauriApi.sendProcessSignal(pid, "Sigcont" as ProcessSignal)}>
        CONT
      </Button>
    </div>
  );
}
