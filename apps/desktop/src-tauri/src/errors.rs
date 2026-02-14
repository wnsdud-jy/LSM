use std::fmt;

#[derive(Debug)]
pub enum ApiError {
    PermissionDenied,
    InvalidSignal,
    NotFound,
    Internal,
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::PermissionDenied => write!(f, "permission denied"),
            Self::InvalidSignal => write!(f, "invalid signal"),
            Self::NotFound => write!(f, "process not found"),
            Self::Internal => write!(f, "internal error"),
        }
    }
}

impl std::error::Error for ApiError {}
