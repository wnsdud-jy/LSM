use crate::{
    app_state::AppState,
    errors::ApiError,
    system::models::ProcessRow,
    system::processes::ProcessQuery,
    system::signal::validate_permission,
};
use serde::Deserialize;
use std::{cmp::Ordering, collections::HashMap, fs};

#[derive(Debug, Clone, Copy, Deserialize)]
pub enum ProcessSignal {
    Sigterm,
    Sigkill,
    Sigstop,
    Sigcont,
}

pub fn send_process_signal_inner(
    state: &AppState,
    pid: i32,
    _signal: ProcessSignal,
) -> Result<(), ApiError> {
    validate_permission(state.current_uid(), state.fake_target_uid(), pid).map_err(|_| ApiError::PermissionDenied)
}

pub fn send_process_signal(
    state: &AppState,
    pid: i32,
    signal: ProcessSignal,
) -> Result<(), ApiError> {
    send_process_signal_inner(state, pid, signal)?;

    let sig = match signal {
        ProcessSignal::Sigterm => libc::SIGTERM,
        ProcessSignal::Sigkill => libc::SIGKILL,
        ProcessSignal::Sigstop => libc::SIGSTOP,
        ProcessSignal::Sigcont => libc::SIGCONT,
    };

    let rc = unsafe { libc::kill(pid, sig) };
    if rc == 0 {
        return Ok(());
    }

    match std::io::Error::last_os_error().raw_os_error() {
        Some(code) if code == libc::EPERM => Err(ApiError::PermissionDenied),
        Some(code) if code == libc::ESRCH => Err(ApiError::NotFound),
        _ => Err(ApiError::Internal),
    }
}

fn parse_uid(status: &str) -> Option<u32> {
    status
        .lines()
        .find(|line| line.starts_with("Uid:"))
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|raw| raw.parse::<u32>().ok())
}

fn load_uid_map() -> HashMap<u32, String> {
    let mut map = HashMap::new();
    if let Ok(passwd) = fs::read_to_string("/etc/passwd") {
        for line in passwd.lines() {
            let cols: Vec<&str> = line.split(':').collect();
            if cols.len() < 3 {
                continue;
            }
            if let Ok(uid) = cols[2].parse::<u32>() {
                map.insert(uid, cols[0].to_string());
            }
        }
    }
    map
}

fn read_process_command(pid: i32) -> String {
    let cmdline_path = format!("/proc/{pid}/cmdline");
    if let Ok(cmdline) = fs::read(cmdline_path) {
        if !cmdline.is_empty() {
            let parts: Vec<String> = cmdline
                .split(|b| *b == 0)
                .filter(|chunk| !chunk.is_empty())
                .map(|chunk| String::from_utf8_lossy(chunk).to_string())
                .collect();
            if !parts.is_empty() {
                return parts.join(" ");
            }
        }
    }

    let comm_path = format!("/proc/{pid}/comm");
    fs::read_to_string(comm_path)
        .unwrap_or_else(|_| "unknown".to_string())
        .trim()
        .to_string()
}

fn parse_proc_stat_values(stat_raw: &str) -> Option<(u64, u64, u64)> {
    let rparen = stat_raw.rfind(')')?;
    let rest = stat_raw.get(rparen + 2..)?;
    let cols: Vec<&str> = rest.split_whitespace().collect();
    if cols.len() < 22 {
        return None;
    }

    let utime = cols.get(11)?.parse::<u64>().ok()?;
    let stime = cols.get(12)?.parse::<u64>().ok()?;
    let rss_pages = cols.get(21)?.parse::<u64>().ok()?;
    Some((utime, stime, rss_pages))
}

fn parse_total_mem_bytes() -> u64 {
    if let Ok(meminfo) = fs::read_to_string("/proc/meminfo") {
        for line in meminfo.lines() {
            if line.starts_with("MemTotal:") {
                if let Some(raw) = line.split_whitespace().nth(1) {
                    if let Ok(kb) = raw.parse::<u64>() {
                        return kb.saturating_mul(1024);
                    }
                }
            }
        }
    }
    1
}

fn parse_uptime_seconds() -> f64 {
    fs::read_to_string("/proc/uptime")
        .ok()
        .and_then(|raw| raw.split_whitespace().next().and_then(|v| v.parse::<f64>().ok()))
        .unwrap_or(1.0)
}

pub fn list_processes(query: Option<ProcessQuery>) -> Result<Vec<ProcessRow>, ApiError> {
    let uid_map = load_uid_map();
    let total_mem = parse_total_mem_bytes() as f64;
    let uptime = parse_uptime_seconds().max(1.0);
    let hz = unsafe { libc::sysconf(libc::_SC_CLK_TCK) as f64 }.max(1.0);
    let page_size = unsafe { libc::sysconf(libc::_SC_PAGESIZE) as u64 }.max(1) as f64;

    let mut rows: Vec<ProcessRow> = Vec::new();

    let proc_entries = fs::read_dir("/proc").map_err(|_| ApiError::Internal)?;
    for entry in proc_entries.flatten() {
        let name = entry.file_name();
        let pid_text = name.to_string_lossy();
        let Ok(pid) = pid_text.parse::<i32>() else {
            continue;
        };

        let stat_path = format!("/proc/{pid}/stat");
        let status_path = format!("/proc/{pid}/status");

        let stat = fs::read_to_string(stat_path).unwrap_or_default();
        let status = fs::read_to_string(status_path).unwrap_or_default();
        if stat.is_empty() || status.is_empty() {
            continue;
        }

        let Some((utime, stime, rss_pages)) = parse_proc_stat_values(&stat) else {
            continue;
        };

        let total_proc_seconds = (utime + stime) as f64 / hz;
        let cpu_percent = ((total_proc_seconds / uptime) * 100.0) as f32;
        let rss_bytes = (rss_pages as f64) * page_size;
        let mem_percent = if total_mem > 0.0 {
            ((rss_bytes / total_mem) * 100.0) as f32
        } else {
            0.0
        };

        let uid = parse_uid(&status).unwrap_or(0);
        let user = uid_map
            .get(&uid)
            .cloned()
            .unwrap_or_else(|| uid.to_string());
        let command = read_process_command(pid);

        rows.push(ProcessRow {
            pid,
            user,
            command,
            cpu_percent,
            mem_percent,
        });
    }

    let query = query.unwrap_or(ProcessQuery {
        search: None,
        sort_by: Some("cpu".to_string()),
        sort_dir: Some("desc".to_string()),
        limit: Some(300),
        offset: Some(0),
    });

    if let Some(search) = query.search {
        let search = search.to_lowercase();
        rows.retain(|row| {
            row.command.to_lowercase().contains(&search) || row.user.to_lowercase().contains(&search)
        });
    }

    match query.sort_by.as_deref() {
        Some("cpu") => rows.sort_by(|a, b| b.cpu_percent.partial_cmp(&a.cpu_percent).unwrap_or(Ordering::Equal)),
        Some("mem") => rows.sort_by(|a, b| b.mem_percent.partial_cmp(&a.mem_percent).unwrap_or(Ordering::Equal)),
        Some("pid") => rows.sort_by_key(|row| row.pid),
        Some("user") => rows.sort_by(|a, b| a.user.cmp(&b.user)),
        Some("command") => rows.sort_by(|a, b| a.command.cmp(&b.command)),
        _ => {}
    }

    if query.sort_dir.as_deref() == Some("asc") && query.sort_by.is_some() {
        rows.reverse();
    }

    let offset = query.offset.unwrap_or(0);
    let limit = query.limit.unwrap_or(rows.len());
    Ok(rows.into_iter().skip(offset).take(limit).collect())
}

#[cfg(test)]
mod tests {
    use super::{ProcessSignal, send_process_signal_inner};
    use crate::app_state::AppState;

    #[test]
    fn send_process_signal_rejects_foreign_uid() {
        let state = AppState::new_for_tests(1000, 1001);
        let result = send_process_signal_inner(&state, 4242, ProcessSignal::Sigterm);
        assert!(result.is_err());
    }
}
