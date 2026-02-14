export type PollIntervalMs = 500 | 1000 | 2000;

export function normalizeIntervalMs(value: number): PollIntervalMs {
  if (value <= 500) {
    return 500;
  }
  if (value <= 1000) {
    return 1000;
  }
  return 2000;
}
