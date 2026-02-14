# Collector Flow

1. Rust collector reads raw `/proc` strings from configured reader input.
2. `SystemCollector` computes deltas against the last snapshot.
3. Snapshot values are converted into B/s and percentages.
4. History series are appended to fixed-capacity `RingBuffer` windows.
5. Frontend polls `/metrics` and `/processes` at selected interval.
