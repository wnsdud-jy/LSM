# Process Control Policy

- Only processes owned by the current effective UID can be signaled.
- UID 0 bypasses ownership checks.
- `pid > 1` is required for all signal actions.
- Allowed signals: `SIGTERM`, `SIGKILL`, `SIGSTOP`, `SIGCONT`.
- The frontend shows a clear permission error when an action is blocked.
