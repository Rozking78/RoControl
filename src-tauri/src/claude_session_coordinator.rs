use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::process::Command;
use std::fs;

/// Represents a Claude Code session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeSession {
    pub session_id: String,
    pub machine_name: String,
    pub branch_name: String,
    pub started_at: u64,
    pub last_heartbeat: u64,
    pub status: SessionStatus,
    pub current_task: Option<String>,
    pub capabilities: Vec<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Active,
    Idle,
    Busy,
    Offline,
}

/// Represents an action to trigger on a remote session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionAction {
    pub action_id: String,
    pub target_session: String,
    pub from_session: String,
    pub action_type: ActionType,
    pub payload: serde_json::Value,
    pub created_at: u64,
    pub status: ActionStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    ExecuteCommand,
    PullLogs,
    SyncState,
    TriggerBuild,
    RequestStatus,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ActionStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

/// Log entry for session activity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionLog {
    pub timestamp: u64,
    pub session_id: String,
    pub level: LogLevel,
    pub message: String,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogLevel {
    Info,
    Warning,
    Error,
    Success,
}

pub struct ClaudeSessionCoordinator {
    session_id: String,
    repo_path: PathBuf,
    sessions_dir: PathBuf,
    actions_dir: PathBuf,
    logs_dir: PathBuf,
    current_session: Arc<Mutex<ClaudeSession>>,
    active_sessions: Arc<Mutex<HashMap<String, ClaudeSession>>>,
    pending_actions: Arc<Mutex<HashMap<String, SessionAction>>>,
    logs: Arc<Mutex<Vec<SessionLog>>>,
}

impl ClaudeSessionCoordinator {
    pub fn new(repo_path: PathBuf, session_id: String, machine_name: String) -> Result<Self, String> {
        // Create .claude-sessions directory structure
        let sessions_dir = repo_path.join(".claude-sessions");
        let actions_dir = sessions_dir.join("actions");
        let logs_dir = sessions_dir.join("logs");

        // Create directories if they don't exist
        fs::create_dir_all(&sessions_dir).map_err(|e| format!("Failed to create sessions dir: {}", e))?;
        fs::create_dir_all(&actions_dir).map_err(|e| format!("Failed to create actions dir: {}", e))?;
        fs::create_dir_all(&logs_dir).map_err(|e| format!("Failed to create logs dir: {}", e))?;

        // Get current git branch
        let branch_name = Self::get_current_branch(&repo_path)?;

        let current_session = ClaudeSession {
            session_id: session_id.clone(),
            machine_name,
            branch_name,
            started_at: Self::current_timestamp(),
            last_heartbeat: Self::current_timestamp(),
            status: SessionStatus::Active,
            current_task: None,
            capabilities: vec![
                "node_management".to_string(),
                "dmx_control".to_string(),
                "stream_deck".to_string(),
            ],
            metadata: HashMap::new(),
        };

        Ok(ClaudeSessionCoordinator {
            session_id,
            repo_path,
            sessions_dir,
            actions_dir,
            logs_dir,
            current_session: Arc::new(Mutex::new(current_session)),
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
            pending_actions: Arc::new(Mutex::new(HashMap::new())),
            logs: Arc::new(Mutex::new(Vec::new())),
        })
    }

    /// Register this session with GitHub
    pub async fn register_session(&self) -> Result<(), String> {
        let session = self.current_session.lock().map_err(|e| e.to_string())?;
        let session_file = self.sessions_dir.join(format!("{}.json", session.session_id));

        // Write session file
        let json = serde_json::to_string_pretty(&*session)
            .map_err(|e| format!("Failed to serialize session: {}", e))?;

        fs::write(&session_file, json)
            .map_err(|e| format!("Failed to write session file: {}", e))?;

        // Commit and push to GitHub
        self.git_commit_push(
            &format!("Register Claude session: {}", session.session_id),
            &[session_file.to_string_lossy().to_string()]
        ).await?;

        self.log(LogLevel::Info, "Session registered with GitHub".to_string()).await?;
        Ok(())
    }

    /// Update session heartbeat
    pub async fn heartbeat(&self, status: SessionStatus, current_task: Option<String>) -> Result<(), String> {
        let mut session = self.current_session.lock().map_err(|e| e.to_string())?;
        session.last_heartbeat = Self::current_timestamp();
        session.status = status;
        session.current_task = current_task;

        let session_file = self.sessions_dir.join(format!("{}.json", session.session_id));
        let json = serde_json::to_string_pretty(&*session)
            .map_err(|e| format!("Failed to serialize session: {}", e))?;

        fs::write(&session_file, json)
            .map_err(|e| format!("Failed to write session file: {}", e))?;

        // Push heartbeat (non-blocking, fire and forget)
        let coordinator = self.clone_for_async();
        let file_path = session_file.to_string_lossy().to_string();
        tokio::spawn(async move {
            let _ = coordinator.git_commit_push(
                &format!("Heartbeat: {}", coordinator.session_id),
                &[file_path]
            ).await;
        });

        Ok(())
    }

    /// Sync sessions from GitHub
    pub async fn sync_sessions(&self) -> Result<Vec<ClaudeSession>, String> {
        // Pull latest from GitHub
        self.git_pull().await?;

        let mut sessions = Vec::new();

        // Read all session files
        if let Ok(entries) = fs::read_dir(&self.sessions_dir) {
            for entry in entries.flatten() {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(entry.path()) {
                        if let Ok(session) = serde_json::from_str::<ClaudeSession>(&content) {
                            // Filter out stale sessions (>5 minutes since last heartbeat)
                            let age = Self::current_timestamp() - session.last_heartbeat;
                            if age < 300 {
                                sessions.push(session.clone());

                                let mut active = self.active_sessions.lock().map_err(|e| e.to_string())?;
                                active.insert(session.session_id.clone(), session);
                            }
                        }
                    }
                }
            }
        }

        Ok(sessions)
    }

    /// Trigger an action on a remote session
    pub async fn trigger_action(
        &self,
        target_session: String,
        action_type: ActionType,
        payload: serde_json::Value,
    ) -> Result<String, String> {
        let action_id = uuid::Uuid::new_v4().to_string();
        let action = SessionAction {
            action_id: action_id.clone(),
            target_session: target_session.clone(),
            from_session: self.session_id.clone(),
            action_type,
            payload,
            created_at: Self::current_timestamp(),
            status: ActionStatus::Pending,
        };

        let action_file = self.actions_dir.join(format!("{}_{}.json", target_session, action_id));
        let json = serde_json::to_string_pretty(&action)
            .map_err(|e| format!("Failed to serialize action: {}", e))?;

        fs::write(&action_file, json)
            .map_err(|e| format!("Failed to write action file: {}", e))?;

        // Commit and push
        self.git_commit_push(
            &format!("Trigger action {} on {}", action_id, target_session),
            &[action_file.to_string_lossy().to_string()]
        ).await?;

        self.log(
            LogLevel::Info,
            format!("Triggered action {} on session {}", action_id, target_session)
        ).await?;

        Ok(action_id)
    }

    /// Check for pending actions directed at this session
    pub async fn check_pending_actions(&self) -> Result<Vec<SessionAction>, String> {
        self.git_pull().await?;

        let mut actions = Vec::new();

        if let Ok(entries) = fs::read_dir(&self.actions_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("json") {
                    // Check if action is for this session
                    if let Some(filename) = path.file_stem().and_then(|s| s.to_str()) {
                        if filename.starts_with(&self.session_id) {
                            if let Ok(content) = fs::read_to_string(&path) {
                                if let Ok(action) = serde_json::from_str::<SessionAction>(&content) {
                                    if action.status == ActionStatus::Pending {
                                        actions.push(action);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(actions)
    }

    /// Mark an action as completed
    pub async fn complete_action(&self, action_id: String, result: Result<String, String>) -> Result<(), String> {
        let action_file = self.actions_dir.join(format!("{}_{}.json", self.session_id, action_id));

        if let Ok(content) = fs::read_to_string(&action_file) {
            if let Ok(mut action) = serde_json::from_str::<SessionAction>(&content) {
                action.status = match result {
                    Ok(_) => ActionStatus::Completed,
                    Err(_) => ActionStatus::Failed,
                };

                let json = serde_json::to_string_pretty(&action)
                    .map_err(|e| format!("Failed to serialize action: {}", e))?;

                fs::write(&action_file, json)
                    .map_err(|e| format!("Failed to write action file: {}", e))?;

                self.git_commit_push(
                    &format!("Complete action {}", action_id),
                    &[action_file.to_string_lossy().to_string()]
                ).await?;
            }
        }

        Ok(())
    }

    /// Pull logs from all sessions
    pub async fn pull_all_logs(&self) -> Result<Vec<SessionLog>, String> {
        self.git_pull().await?;

        let mut all_logs = Vec::new();

        if let Ok(entries) = fs::read_dir(&self.logs_dir) {
            for entry in entries.flatten() {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(entry.path()) {
                        if let Ok(logs) = serde_json::from_str::<Vec<SessionLog>>(&content) {
                            all_logs.extend(logs);
                        }
                    }
                }
            }
        }

        // Sort by timestamp
        all_logs.sort_by_key(|log| log.timestamp);

        Ok(all_logs)
    }

    /// Log a message and sync to GitHub
    pub async fn log(&self, level: LogLevel, message: String) -> Result<(), String> {
        let log_entry = SessionLog {
            timestamp: Self::current_timestamp(),
            session_id: self.session_id.clone(),
            level,
            message,
            metadata: HashMap::new(),
        };

        let mut logs = self.logs.lock().map_err(|e| e.to_string())?;
        logs.push(log_entry);

        // Write logs to file
        let log_file = self.logs_dir.join(format!("{}.json", self.session_id));
        let json = serde_json::to_string_pretty(&*logs)
            .map_err(|e| format!("Failed to serialize logs: {}", e))?;

        fs::write(&log_file, json)
            .map_err(|e| format!("Failed to write log file: {}", e))?;

        // Push logs (async, non-blocking)
        let coordinator = self.clone_for_async();
        let file_path = log_file.to_string_lossy().to_string();
        tokio::spawn(async move {
            let _ = coordinator.git_commit_push(
                &format!("Update logs: {}", coordinator.session_id),
                &[file_path]
            ).await;
        });

        Ok(())
    }

    /// Unregister this session
    pub async fn unregister(&self) -> Result<(), String> {
        let session_file = self.sessions_dir.join(format!("{}.json", self.session_id));

        if session_file.exists() {
            fs::remove_file(&session_file)
                .map_err(|e| format!("Failed to remove session file: {}", e))?;

            self.git_commit_push(
                &format!("Unregister session: {}", self.session_id),
                &[session_file.to_string_lossy().to_string()]
            ).await?;
        }

        Ok(())
    }

    // Helper functions

    async fn git_commit_push(&self, message: &str, files: &[String]) -> Result<(), String> {
        // Add files
        for file in files {
            let output = Command::new("git")
                .current_dir(&self.repo_path)
                .args(&["add", file])
                .output()
                .await
                .map_err(|e| format!("Failed to git add: {}", e))?;

            if !output.status.success() {
                return Err(format!("git add failed: {}", String::from_utf8_lossy(&output.stderr)));
            }
        }

        // Commit
        let output = Command::new("git")
            .current_dir(&self.repo_path)
            .args(&["commit", "-m", message])
            .output()
            .await
            .map_err(|e| format!("Failed to git commit: {}", e))?;

        // Ignore "nothing to commit" errors
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if !stderr.contains("nothing to commit") {
                return Err(format!("git commit failed: {}", stderr));
            }
        }

        // Push
        let branch = Self::get_current_branch(&self.repo_path)?;
        let output = Command::new("git")
            .current_dir(&self.repo_path)
            .args(&["push", "-u", "origin", &branch])
            .output()
            .await
            .map_err(|e| format!("Failed to git push: {}", e))?;

        if !output.status.success() {
            return Err(format!("git push failed: {}", String::from_utf8_lossy(&output.stderr)));
        }

        Ok(())
    }

    async fn git_pull(&self) -> Result<(), String> {
        let branch = Self::get_current_branch(&self.repo_path)?;

        let output = Command::new("git")
            .current_dir(&self.repo_path)
            .args(&["pull", "origin", &branch])
            .output()
            .await
            .map_err(|e| format!("Failed to git pull: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Ignore "Already up to date" messages
            if !stderr.contains("Already up to date") {
                return Err(format!("git pull failed: {}", stderr));
            }
        }

        Ok(())
    }

    fn get_current_branch(repo_path: &PathBuf) -> Result<String, String> {
        let output = std::process::Command::new("git")
            .current_dir(repo_path)
            .args(&["rev-parse", "--abbrev-ref", "HEAD"])
            .output()
            .map_err(|e| format!("Failed to get current branch: {}", e))?;

        if !output.status.success() {
            return Err("Failed to get current branch".to_string());
        }

        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    fn clone_for_async(&self) -> Self {
        ClaudeSessionCoordinator {
            session_id: self.session_id.clone(),
            repo_path: self.repo_path.clone(),
            sessions_dir: self.sessions_dir.clone(),
            actions_dir: self.actions_dir.clone(),
            logs_dir: self.logs_dir.clone(),
            current_session: Arc::clone(&self.current_session),
            active_sessions: Arc::clone(&self.active_sessions),
            pending_actions: Arc::clone(&self.pending_actions),
            logs: Arc::clone(&self.logs),
        }
    }

    pub fn get_session_id(&self) -> String {
        self.session_id.clone()
    }

    pub fn get_current_session(&self) -> Result<ClaudeSession, String> {
        let session = self.current_session.lock().map_err(|e| e.to_string())?;
        Ok(session.clone())
    }
}
