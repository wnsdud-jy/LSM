import { useCallback, useEffect, useRef } from "react";

type PollingFn = () => void | Promise<void>;

export function usePolling(pollFn: PollingFn, intervalMs: number) {
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(async () => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    try {
      await pollFn();
    } finally {
      inFlight.current = false;
    }
  }, [pollFn]);

  useEffect(() => {
    const timerId = setInterval(run, intervalMs);
    timer.current = timerId;
    void run();

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [intervalMs, run]);

  return {
    stop: () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    },
    start: () => {
      if (!timer.current) {
        timer.current = setInterval(run, intervalMs);
      }
    },
  };
}
