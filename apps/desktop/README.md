# Linux System Monitor Desktop

Tauri v2 + React 기반 데스크톱 시스템 모니터입니다.

## Features

- 실시간 성능 모니터링: CPU, RAM, Swap, Disk, Network
- 작업 관리자형 프로세스 목록/검색
- 프로세스 제어: End / Force / Pause / Resume
- Services 뷰

## Run (Dev)

```bash
npm install
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

## Test

```bash
# Frontend
npm run test

# Rust
cd src-tauri
cargo test
```
