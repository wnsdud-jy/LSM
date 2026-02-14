use std::collections::HashMap;

pub struct ProcessCacheEntry {
    pub command: String,
    pub last_seen_ms: i64,
    pub last_proc_jiffies: u64,
}

#[derive(Default)]
pub struct ProcessCache {
    ttl_ms: i64,
    map: HashMap<i32, ProcessCacheEntry>,
}

impl ProcessCache {
    pub fn new(ttl_ms: i64) -> Self {
        Self {
            ttl_ms,
            map: HashMap::new(),
        }
    }

    pub fn upsert(&mut self, pid: i32, command: String, now_ms: i64) {
        self.map.insert(
            pid,
            ProcessCacheEntry {
                command,
                last_seen_ms: now_ms,
                last_proc_jiffies: 0,
            },
        );
    }

    pub fn get_command(&self, pid: i32, now_ms: i64) -> Option<&str> {
        let entry = self.map.get(&pid)?;
        let age = now_ms - entry.last_seen_ms;
        if age > self.ttl_ms {
            return None;
        }
        Some(entry.command.as_str())
    }

    pub fn upsert_with_jiffies(&mut self, pid: i32, command: String, now_ms: i64, jiffies: u64) {
        self.map.insert(
            pid,
            ProcessCacheEntry {
                command,
                last_seen_ms: now_ms,
                last_proc_jiffies: jiffies,
            },
        );
    }
}

#[cfg(test)]
mod tests {
    use super::ProcessCache;

    #[test]
    fn cache_reuses_cmdline_within_ttl() {
        let mut cache = ProcessCache::new(5_000);
        cache.upsert(100, "python app.py".into(), 10_000);
        let first = cache.get_command(100, 12_000).unwrap();
        assert_eq!(first, "python app.py");
    }
}
