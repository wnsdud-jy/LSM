pub struct AppState {
    current_uid: u32,
    target_uid: u32,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            current_uid: 0,
            target_uid: 0,
        }
    }

    pub fn new_for_tests(current_uid: u32, target_uid: u32) -> Self {
        Self {
            current_uid,
            target_uid,
        }
    }

    pub fn current_uid(&self) -> u32 {
        self.current_uid
    }

    pub fn fake_target_uid(&self) -> u32 {
        self.target_uid
    }
}
