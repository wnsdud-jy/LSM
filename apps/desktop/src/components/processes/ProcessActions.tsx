import type { ProcessSignal } from "@/types/system";
import { tauriApi } from "@/lib/tauriApi";

type ProcessActionsProps = {
  pid: number;
};

export function ProcessActions({ pid }: ProcessActionsProps) {
  return (
    <div className="inline-flex gap-2">
      <button onClick={() => void tauriApi.sendProcessSignal(pid, "Sigterm" as ProcessSignal)} type="button">
        TERM
      </button>
      <button onClick={() => void tauriApi.sendProcessSignal(pid, "Sigkill" as ProcessSignal)} type="button">
        KILL
      </button>
      <button onClick={() => void tauriApi.sendProcessSignal(pid, "Sigstop" as ProcessSignal)} type="button">
        STOP
      </button>
      <button onClick={() => void tauriApi.sendProcessSignal(pid, "Sigcont" as ProcessSignal)} type="button">
        CONT
      </button>
    </div>
  );
}
