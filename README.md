# LSM (Linux System Monitor)

Tauri v2 + React 기반의 Linux 시스템 모니터 데스크톱 앱입니다.  
성능 모니터링(CPU/RAM/Swap/Disk/Network), 프로세스 목록/검색, 프로세스 시그널 제어 기능을 제공합니다.

## Project Structure

- `apps/desktop`: Tauri v2 데스크톱 앱 (Rust backend + React frontend)

## Requirements

- Node.js 20+
- npm
- Rust (stable)
- Linux 빌드 의존성(WebKitGTK 등 Tauri 필수 패키지)

## Quick Start

```bash
cd apps/desktop
npm install
npm run tauri:dev
```

## Build

```bash
cd apps/desktop
npm run tauri:build
```

빌드 결과물:

- 바이너리: `apps/desktop/src-tauri/target/release/desktop`

## Test

```bash
# Frontend
cd apps/desktop
npm run test

# Rust
cd apps/desktop/src-tauri
cargo test
```
