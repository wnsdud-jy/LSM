use std::fmt;

#[derive(Debug)]
pub enum SignalError {
    PermissionDenied,
    InvalidPid,
}

impl fmt::Display for SignalError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::PermissionDenied => write!(f, "permission denied"),
            Self::InvalidPid => write!(f, "invalid pid"),
        }
    }
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

#[cfg(test)]
mod tests {

    #[test]
    fn deny_signal_for_different_user_when_not_root() {
        let err = super::validate_permission(1000, 1001, 4242).unwrap_err();
        assert_eq!(err.to_string(), "permission denied");
    }

    #[test]
    fn allow_signal_for_same_user() {
        assert!(super::validate_permission(1000, 1000, 4242).is_ok());
    }

    #[test]
    fn reject_pid_one() {
        assert!(super::validate_permission(0, 0, 1).is_err());
    }
}
