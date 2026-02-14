# Linux System Monitor MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/proc` 기반으로 CPU/RAM/Swap/Disk/Network 실시간 수치와 60초 그래프, 프로세스 조회/제어를 제공하는 Linux 데스크톱 System Monitor MVP를 구축한다.

**Architecture:** 앱은 `apps/desktop` 단일 워크스페이스에 배치하고, Rust backend에서 `/proc` 수집기, 델타 계산기, ring buffer, 프로세스 캐시를 관리한다. Tauri command는 스냅샷 조회(`metrics`, `processes`)와 시그널 전송(`SIGTERM/SIGKILL/SIGSTOP/SIGCONT`)만 노출하고 권한 정책을 backend에서 강제한다. React frontend는 Zustand 기반 polling(500ms/1s/2s)을 사용해 Dashboard/Processes 페이지를 렌더링하고, 프로세스 테이블은 가상 스크롤로 렌더링 비용을 제한한다.

**Tech Stack:** Tauri v2, Rust, React + TypeScript, Tailwind CSS, Zustand, Vitest, Testing Library, @tanstack/react-virtual

---

**Skill References:** @tauri @calling-rust-from-tauri-frontend @vitest @vercel-react-best-practices

## Target Directory Layout

- `apps/desktop/src-tauri/src/system/*`: `/proc` 파서, 수집기, 델타 계산기, ring buffer, 캐시
- `apps/desktop/src-tauri/src/commands/*`: Tauri command entrypoints
- `apps/desktop/src/types/*`, `apps/desktop/src/stores/*`, `apps/desktop/src/pages/*`: frontend 타입/상태/UI
- `apps/desktop/src/components/*`: Dashboard/Processes 컴포넌트
- `apps/desktop/src/**/*.test.ts(x)`, `apps/desktop/src-tauri/**/*.rs`의 `#[cfg(test)]`: 테스트

## Rust Module Design (MVP)

```rust
// apps/desktop/src-tauri/src/system/models.rs
#[derive(Debug, Clone, serde::Serialize)]
pub struct MetricPoint {
    pub ts_ms: i64,
    pub value: f64,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct MetricsSnapshot {
    pub cpu_percent: f32,
    pub ram_used_bytes: u64,
    pub ram_total_bytes: u64,
    pub swap_used_bytes: u64,
    pub swap_total_bytes: u64,
    pub disk_read_bps: f64,
    pub disk_write_bps: f64,
    pub net_rx_bps: f64,
    pub net_tx_bps: f64,
    pub cpu_history: Vec<MetricPoint>,
    pub ram_history: Vec<MetricPoint>,
    pub disk_read_history: Vec<MetricPoint>,
    pub disk_write_history: Vec<MetricPoint>,
    pub net_rx_history: Vec<MetricPoint>,
    pub net_tx_history: Vec<MetricPoint>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ProcessRow {
    pub pid: i32,
    pub user: String,
    pub command: String,
    pub cpu_percent: f32,
    pub mem_percent: f32,
}
```

```rust
// apps/desktop/src-tauri/src/system/ring_buffer.rs
pub struct RingBuffer<T> {
    cap: usize,
    data: std::collections::VecDeque<T>,
}
```

```rust
// apps/desktop/src-tauri/src/system/cache.rs
pub struct ProcessCacheEntry {
    pub command: String,
    pub last_seen_ms: i64,
    pub last_proc_jiffies: u64,
}
```

## Tauri Command API Design

```rust
// apps/desktop/src-tauri/src/commands/metrics.rs
#[tauri::command]
pub async fn get_metrics_snapshot(state: tauri::State<'_, crate::app_state::AppState>)
    -> Result<crate::system::models::MetricsSnapshot, crate::errors::ApiError>;
```

```rust
// apps/desktop/src-tauri/src/commands/processes.rs
#[derive(Debug, Clone, serde::Deserialize)]
pub struct ProcessQuery {
    pub search: Option<String>,
    pub sort_by: Option<String>,     // "cpu" | "mem" | "pid" | "user" | "command"
    pub sort_dir: Option<String>,    // "asc" | "desc"
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[tauri::command]
pub async fn list_processes(
    state: tauri::State<'_, crate::app_state::AppState>,
    query: ProcessQuery
) -> Result<Vec<crate::system::models::ProcessRow>, crate::errors::ApiError>;

#[derive(Debug, Clone, Copy, serde::Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ProcessSignal { Sigterm, Sigkill, Sigstop, Sigcont }

#[tauri::command]
pub async fn send_process_signal(
    state: tauri::State<'_, crate::app_state::AppState>,
    pid: i32,
    signal: ProcessSignal
) -> Result<(), crate::errors::ApiError>;
```

## React Page + Component Structure

- `DashboardPage`
- `MetricGrid`
- `MetricCard`
- `Sparkline`
- `ProcessesPage`
- `ProcessToolbar` (search, sort, interval selector)
- `ProcessTable` (virtualized rows)
- `ProcessActions` (TERM/KILL/STOP/CONT buttons)

## Performance + Security Policies

- 프로세스 스캔은 `/proc` numeric 디렉토리만 순회하고, `cmdline`은 신규 PID 또는 TTL 만료 시에만 재로딩
- CPU% 계산은 `process_jiffies_delta / total_jiffies_delta * cpu_count * 100`
- 60초 히스토리는 `RingBuffer<MetricPoint>`로 고정 길이 유지 (interval 기반 capacity = `60_000 / interval_ms`)
- frontend는 polling overlap 방지 (`inFlight` guard) + processes 테이블 가상 스크롤
- 시그널 전송은 `pid > 1`, 허용 시그널 화이트리스트, `current_uid == target_uid || current_uid == 0` 검사 강제

## Test Strategy (Rust + Vitest)

- Rust unit: `/proc` 파싱, 델타 계산, 캐시 동작, UID 권한 검사
- Rust integration: command 계층(성공/실패 path), mock reader 기반 collector
- Vitest unit: Zustand polling interval normalization, search/sort reducer
- Vitest component: Dashboard metric 렌더링, Processes 액션 dispatch
- Manual smoke: 실제 Linux에서 `/proc` live data 수집 + 권한 오류 메시지 확인

---

### Task 1: Bootstrap Desktop App + Test Harness

**Files:**
- Create: `apps/desktop/` (Tauri + React template)
- Modify: `apps/desktop/package.json`
- Create: `apps/desktop/vitest.config.ts`
- Create: `apps/desktop/src/lib/polling.ts`
- Test: `apps/desktop/src/lib/polling.test.ts`

**Step 1: Scaffold project**

Run: `npm create tauri-app@latest apps/desktop -- --template react-ts --manager npm --yes`
Expected: `apps/desktop` 생성, `src-tauri/`, `src/` 기본 템플릿 포함

**Step 2: Write the failing test**

```ts
// apps/desktop/src/lib/polling.test.ts
import { describe, expect, it } from "vitest";
import { normalizeIntervalMs } from "./polling";

describe("normalizeIntervalMs", () => {
  it("maps arbitrary values to 500/1000/2000", () => {
    expect(normalizeIntervalMs(400)).toBe(500);
    expect(normalizeIntervalMs(999)).toBe(1000);
    expect(normalizeIntervalMs(1500)).toBe(2000);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `cd apps/desktop && npm run test -- src/lib/polling.test.ts`
Expected: FAIL with `Cannot find module './polling'` 또는 `Missing script: "test"`

**Step 4: Write minimal implementation**

```ts
// apps/desktop/src/lib/polling.ts
export type PollIntervalMs = 500 | 1000 | 2000;

export function normalizeIntervalMs(value: number): PollIntervalMs {
  if (value <= 500) return 500;
  if (value <= 1000) return 1000;
  return 2000;
}
```

```ts
// apps/desktop/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

```json
// apps/desktop/package.json (scripts/devDependencies 핵심)
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "jsdom": "^24.0.0"
  }
}
```

**Step 5: Run test to verify it passes**

Run: `cd apps/desktop && npm install && npm run test -- src/lib/polling.test.ts`
Expected: PASS (`1 passed`)

**Step 6: Commit**

```bash
git add apps/desktop
git commit -m "chore: bootstrap tauri react app with vitest baseline"
```

### Task 2: Implement `/proc/stat` + `/proc/meminfo` Parsers

**Files:**
- Create: `apps/desktop/src-tauri/src/system/mod.rs`
- Create: `apps/desktop/src-tauri/src/system/models.rs`
- Create: `apps/desktop/src-tauri/src/system/procfs.rs`
- Modify: `apps/desktop/src-tauri/src/lib.rs`
- Test: `apps/desktop/src-tauri/src/system/procfs.rs` (`#[cfg(test)]`)

**Step 1: Write the failing test**

```rust
#[test]
fn parse_meminfo_extracts_totals() {
    let text = "MemTotal:       16384256 kB\nMemAvailable:   10240000 kB\nSwapTotal:      2097148 kB\nSwapFree:       1048574 kB\n";
    let parsed = parse_meminfo(text).expect("parsed");
    assert_eq!(parsed.mem_total_kb, 16384256);
    assert_eq!(parsed.mem_available_kb, 10240000);
    assert_eq!(parsed.swap_total_kb, 2097148);
    assert_eq!(parsed.swap_free_kb, 1048574);
}

#[test]
fn parse_cpu_totals_extracts_idle_and_total() {
    let text = "cpu  2255 34 2290 22625563 6290 127 456 0 0 0\n";
    let cpu = parse_cpu_totals(text).expect("cpu");
    assert_eq!(cpu.idle, 22625563);
    assert_eq!(cpu.total, 22637015);
}
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop/src-tauri && cargo test parse_meminfo_extracts_totals -- --exact`
Expected: FAIL with `cannot find function 'parse_meminfo'`

**Step 3: Write minimal implementation**

```rust
// apps/desktop/src-tauri/src/system/procfs.rs
#[derive(Debug, Clone, Copy)]
pub struct CpuTotals {
    pub idle: u64,
    pub total: u64,
}

#[derive(Debug, Clone, Copy)]
pub struct MemInfo {
    pub mem_total_kb: u64,
    pub mem_available_kb: u64,
    pub swap_total_kb: u64,
    pub swap_free_kb: u64,
}

pub fn parse_cpu_totals(input: &str) -> Option<CpuTotals> {
    let cpu_line = input.lines().find(|l| l.starts_with("cpu "))?;
    let nums: Vec<u64> = cpu_line
        .split_whitespace()
        .skip(1)
        .filter_map(|v| v.parse::<u64>().ok())
        .collect();
    if nums.len() < 4 {
        return None;
    }
    let idle = nums[3];
    let total = nums.iter().sum();
    Some(CpuTotals { idle, total })
}

pub fn parse_meminfo(input: &str) -> Option<MemInfo> {
    let mut mem_total = None;
    let mut mem_available = None;
    let mut swap_total = None;
    let mut swap_free = None;
    for line in input.lines() {
        let mut parts = line.split_whitespace();
        match parts.next()? {
            "MemTotal:" => mem_total = parts.next().and_then(|v| v.parse().ok()),
            "MemAvailable:" => mem_available = parts.next().and_then(|v| v.parse().ok()),
            "SwapTotal:" => swap_total = parts.next().and_then(|v| v.parse().ok()),
            "SwapFree:" => swap_free = parts.next().and_then(|v| v.parse().ok()),
            _ => {}
        }
    }
    Some(MemInfo {
        mem_total_kb: mem_total?,
        mem_available_kb: mem_available?,
        swap_total_kb: swap_total?,
        swap_free_kb: swap_free?,
    })
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop/src-tauri && cargo test parse_cpu_totals_extracts_idle_and_total -- --exact`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/system apps/desktop/src-tauri/src/lib.rs
git commit -m "feat: add proc stat and meminfo parsers"
```

### Task 3: Add Delta Calculator + Ring Buffer

**Files:**
- Create: `apps/desktop/src-tauri/src/system/delta.rs`
- Create: `apps/desktop/src-tauri/src/system/ring_buffer.rs`
- Modify: `apps/desktop/src-tauri/src/system/mod.rs`
- Test: `apps/desktop/src-tauri/src/system/delta.rs` (`#[cfg(test)]`)
- Test: `apps/desktop/src-tauri/src/system/ring_buffer.rs` (`#[cfg(test)]`)

**Step 1: Write the failing test**

```rust
#[test]
fn cpu_percent_uses_idle_and_total_delta() {
    let prev = (100_u64, 200_u64); // (idle,total)
    let next = (130_u64, 260_u64);
    let value = cpu_percent(prev, next);
    assert!((value - 50.0).abs() < 0.01);
}

#[test]
fn ring_buffer_keeps_latest_n_points() {
    let mut rb = RingBuffer::new(3);
    rb.push(1);
    rb.push(2);
    rb.push(3);
    rb.push(4);
    assert_eq!(rb.snapshot(), vec![2, 3, 4]);
}
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop/src-tauri && cargo test ring_buffer_keeps_latest_n_points -- --exact`
Expected: FAIL with `cannot find type 'RingBuffer'`

**Step 3: Write minimal implementation**

```rust
// apps/desktop/src-tauri/src/system/delta.rs
pub fn cpu_percent(prev: (u64, u64), next: (u64, u64)) -> f32 {
    let idle_delta = next.0.saturating_sub(prev.0) as f32;
    let total_delta = next.1.saturating_sub(prev.1) as f32;
    if total_delta <= 0.0 {
        return 0.0;
    }
    ((total_delta - idle_delta) / total_delta) * 100.0
}
```

```rust
// apps/desktop/src-tauri/src/system/ring_buffer.rs
pub struct RingBuffer<T> {
    cap: usize,
    data: std::collections::VecDeque<T>,
}

impl<T: Clone> RingBuffer<T> {
    pub fn new(cap: usize) -> Self {
        Self { cap, data: std::collections::VecDeque::with_capacity(cap) }
    }

    pub fn push(&mut self, value: T) {
        if self.data.len() == self.cap {
            self.data.pop_front();
        }
        self.data.push_back(value);
    }

    pub fn snapshot(&self) -> Vec<T> {
        self.data.iter().cloned().collect()
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop/src-tauri && cargo test cpu_percent_uses_idle_and_total_delta -- --exact`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/system/delta.rs apps/desktop/src-tauri/src/system/ring_buffer.rs apps/desktop/src-tauri/src/system/mod.rs
git commit -m "feat: add delta calculator and ring buffer primitives"
```

### Task 4: Build System Collector (CPU/RAM/Swap/Disk/Network + 60s History)

**Files:**
- Create: `apps/desktop/src-tauri/src/system/collector.rs`
- Create: `apps/desktop/src-tauri/src/system/cache.rs`
- Modify: `apps/desktop/src-tauri/src/system/models.rs`
- Modify: `apps/desktop/src-tauri/src/system/procfs.rs`
- Test: `apps/desktop/src-tauri/src/system/collector.rs` (`#[cfg(test)]`)

**Step 1: Write the failing test**

```rust
#[test]
fn collector_generates_rates_and_history_points() {
    let mut collector = SystemCollector::new_for_tests(500);
    collector.ingest_for_tests(
        "cpu  1 1 1 10 0 0 0 0 0 0\n",
        "MemTotal: 1000 kB\nMemAvailable: 400 kB\nSwapTotal: 200 kB\nSwapFree: 100 kB\n",
        "eth0: 1000 0 0 0 0 0 0 0 2000 0 0 0 0 0 0 0\n",
        "   8       0 sda 1 0 100 0 1 0 200 0 0 0 0 0 0 0 0 0 0\n",
        1_000
    ).unwrap();
    let snap = collector.ingest_for_tests(
        "cpu  2 2 2 12 0 0 0 0 0 0\n",
        "MemTotal: 1000 kB\nMemAvailable: 300 kB\nSwapTotal: 200 kB\nSwapFree: 90 kB\n",
        "eth0: 2000 0 0 0 0 0 0 0 2600 0 0 0 0 0 0 0\n",
        "   8       0 sda 2 0 300 0 2 0 500 0 0 0 0 0 0 0 0 0 0\n",
        1_500
    ).unwrap();
    assert!(snap.net_rx_bps > 0.0);
    assert!(snap.disk_write_bps > 0.0);
    assert_eq!(snap.cpu_history.len(), 2);
}
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop/src-tauri && cargo test collector_generates_rates_and_history_points -- --exact`
Expected: FAIL with `cannot find type 'SystemCollector'`

**Step 3: Write minimal implementation**

```rust
// apps/desktop/src-tauri/src/system/collector.rs (핵심)
pub struct SystemCollector {
    interval_ms: u64,
    last_cpu: Option<(u64, u64)>,
    last_net: Option<(u64, u64)>,
    last_disk: Option<(u64, u64)>,
    cpu_history: crate::system::ring_buffer::RingBuffer<crate::system::models::MetricPoint>,
    ram_history: crate::system::ring_buffer::RingBuffer<crate::system::models::MetricPoint>,
    disk_read_history: crate::system::ring_buffer::RingBuffer<crate::system::models::MetricPoint>,
    disk_write_history: crate::system::ring_buffer::RingBuffer<crate::system::models::MetricPoint>,
    net_rx_history: crate::system::ring_buffer::RingBuffer<crate::system::models::MetricPoint>,
    net_tx_history: crate::system::ring_buffer::RingBuffer<crate::system::models::MetricPoint>,
}

impl SystemCollector {
    pub fn new(interval_ms: u64) -> Self {
        let cap = ((60_000 / interval_ms.max(500)) as usize).max(30);
        Self {
            interval_ms,
            last_cpu: None,
            last_net: None,
            last_disk: None,
            cpu_history: crate::system::ring_buffer::RingBuffer::new(cap),
            ram_history: crate::system::ring_buffer::RingBuffer::new(cap),
            disk_read_history: crate::system::ring_buffer::RingBuffer::new(cap),
            disk_write_history: crate::system::ring_buffer::RingBuffer::new(cap),
            net_rx_history: crate::system::ring_buffer::RingBuffer::new(cap),
            net_tx_history: crate::system::ring_buffer::RingBuffer::new(cap),
        }
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop/src-tauri && cargo test collector_generates_rates_and_history_points -- --exact`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/system/collector.rs apps/desktop/src-tauri/src/system/cache.rs apps/desktop/src-tauri/src/system/models.rs apps/desktop/src-tauri/src/system/procfs.rs
git commit -m "feat: add system collector with 60s history buffers"
```

### Task 5: Implement Process Scanner (PID/USER/COMMAND/CPU/MEM + Sort/Search)

**Files:**
- Create: `apps/desktop/src-tauri/src/system/processes.rs`
- Modify: `apps/desktop/src-tauri/src/system/cache.rs`
- Modify: `apps/desktop/src-tauri/src/system/models.rs`
- Test: `apps/desktop/src-tauri/src/system/processes.rs` (`#[cfg(test)]`)

**Step 1: Write the failing test**

```rust
#[test]
fn list_processes_supports_search_and_cpu_sort() {
    let mut service = ProcessService::new_for_tests();
    service.seed_for_tests(vec![
        ProcessRow { pid: 10, user: "alice".into(), command: "bash".into(), cpu_percent: 1.0, mem_percent: 0.2 },
        ProcessRow { pid: 22, user: "bob".into(), command: "chrome".into(), cpu_percent: 35.0, mem_percent: 10.0 },
    ]);
    let rows = service.list(ProcessQuery {
        search: Some("chr".into()),
        sort_by: Some("cpu".into()),
        sort_dir: Some("desc".into()),
        limit: Some(50),
        offset: Some(0),
    });
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].pid, 22);
}
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop/src-tauri && cargo test list_processes_supports_search_and_cpu_sort -- --exact`
Expected: FAIL with `cannot find type 'ProcessService'`

**Step 3: Write minimal implementation**

```rust
// apps/desktop/src-tauri/src/system/processes.rs (핵심)
pub struct ProcessQuery {
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

pub struct ProcessService {
    rows: Vec<crate::system::models::ProcessRow>,
}

impl ProcessService {
    pub fn list(&self, query: ProcessQuery) -> Vec<crate::system::models::ProcessRow> {
        let mut rows: Vec<_> = self.rows.iter().cloned().collect();
        if let Some(search) = query.search {
            let s = search.to_lowercase();
            rows.retain(|r| r.command.to_lowercase().contains(&s) || r.user.to_lowercase().contains(&s));
        }
        match query.sort_by.as_deref() {
            Some("cpu") => rows.sort_by(|a, b| b.cpu_percent.partial_cmp(&a.cpu_percent).unwrap()),
            Some("mem") => rows.sort_by(|a, b| b.mem_percent.partial_cmp(&a.mem_percent).unwrap()),
            Some("pid") => rows.sort_by_key(|r| r.pid),
            _ => {}
        }
        let offset = query.offset.unwrap_or(0).min(rows.len());
        let limit = query.limit.unwrap_or(200);
        rows.into_iter().skip(offset).take(limit).collect()
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop/src-tauri && cargo test list_processes_supports_search_and_cpu_sort -- --exact`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/system/processes.rs apps/desktop/src-tauri/src/system/cache.rs apps/desktop/src-tauri/src/system/models.rs
git commit -m "feat: add process listing with search and sort"
```

### Task 6: Implement Process Signal Control with Permission Enforcement

**Files:**
- Create: `apps/desktop/src-tauri/src/system/signal.rs`
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Test: `apps/desktop/src-tauri/src/system/signal.rs` (`#[cfg(test)]`)

**Step 1: Write the failing test**

```rust
#[test]
fn deny_signal_for_different_user_when_not_root() {
    let err = validate_permission(1000, 1001, 4242).unwrap_err();
    assert_eq!(err.to_string(), "permission denied");
}

#[test]
fn allow_signal_for_same_user() {
    assert!(validate_permission(1000, 1000, 4242).is_ok());
}

#[test]
fn reject_pid_one() {
    assert!(validate_permission(0, 0, 1).is_err());
}
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop/src-tauri && cargo test deny_signal_for_different_user_when_not_root -- --exact`
Expected: FAIL with `cannot find function 'validate_permission'`

**Step 3: Write minimal implementation**

```rust
// apps/desktop/src-tauri/src/system/signal.rs
#[derive(Debug, thiserror::Error)]
pub enum SignalError {
    #[error("permission denied")]
    PermissionDenied,
    #[error("invalid pid")]
    InvalidPid,
}

pub fn validate_permission(current_uid: u32, target_uid: u32, pid: i32) -> Result<(), SignalError> {
    if pid <= 1 {
        return Err(SignalError::InvalidPid);
    }
    if current_uid == 0 || current_uid == target_uid {
        return Ok(());
    }
    Err(SignalError::PermissionDenied)
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop/src-tauri && cargo test -- signal::tests --nocapture`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/system/signal.rs apps/desktop/src-tauri/Cargo.toml
git commit -m "feat: enforce uid-based process signal permissions"
```

### Task 7: Wire Tauri Command Layer

**Files:**
- Create: `apps/desktop/src-tauri/src/app_state.rs`
- Create: `apps/desktop/src-tauri/src/errors.rs`
- Create: `apps/desktop/src-tauri/src/commands/mod.rs`
- Create: `apps/desktop/src-tauri/src/commands/metrics.rs`
- Create: `apps/desktop/src-tauri/src/commands/processes.rs`
- Modify: `apps/desktop/src-tauri/src/lib.rs`
- Modify: `apps/desktop/src-tauri/src/main.rs`
- Test: `apps/desktop/src-tauri/src/commands/processes.rs` (`#[cfg(test)]`)

**Step 1: Write the failing test**

```rust
#[tokio::test]
async fn send_process_signal_rejects_foreign_uid() {
    let state = crate::app_state::AppState::new_for_tests(1000, 1001);
    let result = crate::commands::processes::send_process_signal_inner(&state, 4242, ProcessSignal::Sigterm).await;
    assert!(result.is_err());
}
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop/src-tauri && cargo test send_process_signal_rejects_foreign_uid -- --exact`
Expected: FAIL with `cannot find function 'send_process_signal_inner'`

**Step 3: Write minimal implementation**

```rust
// apps/desktop/src-tauri/src/commands/processes.rs (핵심)
#[tauri::command]
pub async fn send_process_signal(
    state: tauri::State<'_, crate::app_state::AppState>,
    pid: i32,
    signal: ProcessSignal,
) -> Result<(), crate::errors::ApiError> {
    send_process_signal_inner(&state, pid, signal).await
}
```

```rust
// apps/desktop/src-tauri/src/lib.rs (invoke_handler)
tauri::Builder::default()
    .manage(crate::app_state::AppState::new())
    .invoke_handler(tauri::generate_handler![
        crate::commands::metrics::get_metrics_snapshot,
        crate::commands::processes::list_processes,
        crate::commands::processes::send_process_signal
    ]);
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop/src-tauri && cargo test commands::processes::tests -- --nocapture`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/app_state.rs apps/desktop/src-tauri/src/errors.rs apps/desktop/src-tauri/src/commands apps/desktop/src-tauri/src/lib.rs apps/desktop/src-tauri/src/main.rs
git commit -m "feat: expose tauri command api for metrics processes and signals"
```

### Task 8: Build Frontend API Client + Zustand Store + Polling Interval Settings

**Files:**
- Create: `apps/desktop/src/types/system.ts`
- Create: `apps/desktop/src/lib/tauriApi.ts`
- Create: `apps/desktop/src/stores/systemStore.ts`
- Create: `apps/desktop/src/hooks/usePolling.ts`
- Test: `apps/desktop/src/stores/systemStore.test.ts`
- Test: `apps/desktop/src/hooks/usePolling.test.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { useSystemStore } from "./systemStore";

describe("systemStore interval", () => {
  it("accepts only 500/1000/2000ms", () => {
    const { setIntervalMs } = useSystemStore.getState();
    setIntervalMs(700);
    expect(useSystemStore.getState().intervalMs).toBe(1000);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm run test -- src/stores/systemStore.test.ts`
Expected: FAIL with `Cannot find module './systemStore'`

**Step 3: Write minimal implementation**

```ts
// apps/desktop/src/stores/systemStore.ts
import { create } from "zustand";
import { normalizeIntervalMs, type PollIntervalMs } from "@/lib/polling";

type State = {
  intervalMs: PollIntervalMs;
  setIntervalMs: (v: number) => void;
};

export const useSystemStore = create<State>((set) => ({
  intervalMs: 1000,
  setIntervalMs: (v) => set({ intervalMs: normalizeIntervalMs(v) }),
}));
```

```ts
// apps/desktop/src/lib/tauriApi.ts
import { invoke } from "@tauri-apps/api/core";
import type { MetricsSnapshot, ProcessQuery, ProcessRow, ProcessSignal } from "@/types/system";

export const tauriApi = {
  getMetricsSnapshot: () => invoke<MetricsSnapshot>("get_metrics_snapshot"),
  listProcesses: (query: ProcessQuery) => invoke<ProcessRow[]>("list_processes", { query }),
  sendProcessSignal: (pid: number, signal: ProcessSignal) => invoke<void>("send_process_signal", { pid, signal }),
};
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm run test -- src/stores/systemStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/types/system.ts apps/desktop/src/lib/tauriApi.ts apps/desktop/src/stores/systemStore.ts apps/desktop/src/hooks/usePolling.ts apps/desktop/src/stores/systemStore.test.ts apps/desktop/src/hooks/usePolling.test.tsx
git commit -m "feat: add zustand system store and tauri api client"
```

### Task 9: Implement Dashboard Page (Realtime Metrics + 60s Sparkline)

**Files:**
- Create: `apps/desktop/src/pages/DashboardPage.tsx`
- Create: `apps/desktop/src/components/metrics/MetricCard.tsx`
- Create: `apps/desktop/src/components/metrics/Sparkline.tsx`
- Create: `apps/desktop/src/components/layout/AppShell.tsx`
- Modify: `apps/desktop/src/App.tsx`
- Test: `apps/desktop/src/pages/DashboardPage.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage";

it("renders cpu and memory cards", () => {
  render(<DashboardPage />);
  expect(screen.getByText("CPU")).toBeInTheDocument();
  expect(screen.getByText("RAM")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm run test -- src/pages/DashboardPage.test.tsx`
Expected: FAIL with `Cannot find module './DashboardPage'`

**Step 3: Write minimal implementation**

```tsx
// apps/desktop/src/pages/DashboardPage.tsx
import { MetricCard } from "@/components/metrics/MetricCard";
import { useSystemStore } from "@/stores/systemStore";

export function DashboardPage() {
  const metrics = useSystemStore((s) => s.metrics);
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <MetricCard title="CPU" value={`${metrics.cpu_percent.toFixed(1)}%`} points={metrics.cpu_history} />
      <MetricCard title="RAM" value={`${((metrics.ram_used_bytes / metrics.ram_total_bytes) * 100).toFixed(1)}%`} points={metrics.ram_history} />
      <MetricCard title="Swap" value={`${((metrics.swap_used_bytes / metrics.swap_total_bytes) * 100).toFixed(1)}%`} points={metrics.ram_history} />
      <MetricCard title="Disk Read" value={`${metrics.disk_read_bps.toFixed(0)} B/s`} points={metrics.disk_read_history} />
      <MetricCard title="Disk Write" value={`${metrics.disk_write_bps.toFixed(0)} B/s`} points={metrics.disk_write_history} />
      <MetricCard title="Network" value={`${metrics.net_rx_bps.toFixed(0)} / ${metrics.net_tx_bps.toFixed(0)} B/s`} points={metrics.net_rx_history} />
    </section>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm run test -- src/pages/DashboardPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/pages/DashboardPage.tsx apps/desktop/src/components/metrics apps/desktop/src/components/layout/AppShell.tsx apps/desktop/src/App.tsx apps/desktop/src/pages/DashboardPage.test.tsx
git commit -m "feat: add dashboard realtime metrics and sparkline cards"
```

### Task 10: Implement Processes Page (Sort/Search + Virtual Scroll + Signal Actions)

**Files:**
- Create: `apps/desktop/src/pages/ProcessesPage.tsx`
- Create: `apps/desktop/src/components/processes/ProcessToolbar.tsx`
- Create: `apps/desktop/src/components/processes/ProcessTable.tsx`
- Create: `apps/desktop/src/components/processes/ProcessActions.tsx`
- Create: `apps/desktop/src/utils/processSort.ts`
- Test: `apps/desktop/src/utils/processSort.test.ts`
- Test: `apps/desktop/src/pages/ProcessesPage.test.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { sortProcesses } from "./processSort";

it("sorts by cpu desc", () => {
  const rows = [
    { pid: 1, cpu_percent: 2, mem_percent: 1, user: "a", command: "a" },
    { pid: 2, cpu_percent: 9, mem_percent: 2, user: "b", command: "b" },
  ];
  const out = sortProcesses(rows, "cpu", "desc");
  expect(out[0].pid).toBe(2);
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npm run test -- src/utils/processSort.test.ts`
Expected: FAIL with `Cannot find module './processSort'`

**Step 3: Write minimal implementation**

```ts
// apps/desktop/src/utils/processSort.ts
import type { ProcessRow } from "@/types/system";

export function sortProcesses(rows: ProcessRow[], by: "cpu" | "mem" | "pid", dir: "asc" | "desc"): ProcessRow[] {
  const out = [...rows];
  out.sort((a, b) => {
    const value = by === "cpu" ? a.cpu_percent - b.cpu_percent : by === "mem" ? a.mem_percent - b.mem_percent : a.pid - b.pid;
    return dir === "asc" ? value : -value;
  });
  return out;
}
```

```tsx
// apps/desktop/src/components/processes/ProcessTable.tsx (핵심)
import { useVirtualizer } from "@tanstack/react-virtual";
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npm run test -- src/utils/processSort.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/pages/ProcessesPage.tsx apps/desktop/src/components/processes apps/desktop/src/utils/processSort.ts apps/desktop/src/utils/processSort.test.ts apps/desktop/src/pages/ProcessesPage.test.tsx
git commit -m "feat: add process table with search sort virtualization and actions"
```

### Task 11: Performance Hardening + Security Docs + Final QA

**Files:**
- Create: `apps/desktop/src-tauri/src/system/perf_tests.rs`
- Create: `apps/desktop/docs/security/process-control-policy.md`
- Create: `apps/desktop/docs/architecture/collector-flow.md`
- Modify: `apps/desktop/README.md`
- Test: `apps/desktop/src/hooks/usePolling.test.tsx`
- Test: `apps/desktop/src-tauri/src/system/cache.rs` (`#[cfg(test)]`)

**Step 1: Write the failing test**

```rust
#[test]
fn cache_reuses_cmdline_within_ttl() {
    let mut cache = ProcessCache::new(5_000);
    cache.upsert(100, "python app.py".into(), 10_000);
    let first = cache.get_command(100, 12_000).unwrap();
    assert_eq!(first, "python app.py");
}
```

```tsx
it("skips overlapping polling requests", async () => {
  // fake timers + delayed promise로 overlap 방지 검증
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop/src-tauri && cargo test cache_reuses_cmdline_within_ttl -- --exact`
Expected: FAIL with `cannot find type 'ProcessCache'`

Run: `cd apps/desktop && npm run test -- src/hooks/usePolling.test.tsx`
Expected: FAIL with overlap assertion 실패

**Step 3: Write minimal implementation**

```rust
// apps/desktop/src-tauri/src/system/cache.rs (핵심)
pub struct ProcessCache {
    ttl_ms: i64,
    map: std::collections::HashMap<i32, ProcessCacheEntry>,
}
```

```tsx
// apps/desktop/src/hooks/usePolling.ts (핵심)
let inFlight = false;
```

**Step 4: Run full verification**

Run: `cd apps/desktop && npm run test`
Expected: PASS (frontend unit/component)

Run: `cd apps/desktop/src-tauri && cargo test`
Expected: PASS (backend unit/integration)

Run: `cd apps/desktop && npm run tauri build -- --debug`
Expected: PASS (Linux debug bundle 생성)

**Step 5: Commit**

```bash
git add apps/desktop/src-tauri/src/system/perf_tests.rs apps/desktop/src-tauri/src/system/cache.rs apps/desktop/src/hooks/usePolling.ts apps/desktop/src/hooks/usePolling.test.tsx apps/desktop/docs/security/process-control-policy.md apps/desktop/docs/architecture/collector-flow.md apps/desktop/README.md
git commit -m "chore: harden performance and document security policy"
```

## Final Acceptance Checklist

- Dashboard에서 CPU/RAM/Swap/Disk/Network 실시간 수치 + 최근 60초 그래프 표시
- Processes에서 PID/USER/COMMAND/CPU%/MEM% 노출, 검색/정렬 정상 동작
- SIGTERM/SIGKILL/SIGSTOP/SIGCONT 동작, 타 사용자 PID 제어는 권한 오류 처리
- 업데이트 주기 500ms/1s/2s 변경 시 backend/frontend history 용량 및 polling 동기화
- `npm run test`, `cargo test`, `npm run tauri build -- --debug` 모두 통과
