use axum::{
    extract::{Multipart, Path, State, ws::{Message, WebSocket, WebSocketUpgrade}},
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};
use std::path::PathBuf;
use std::fs;
use futures::{StreamExt, SinkExt};
use crate::ndi_support::{NdiManager, NdiSource};

#[derive(Clone)]
pub struct AppState {
    pub tx: broadcast::Sender<String>,
    pub video_dir: PathBuf,
    pub ndi_manager: Arc<NdiManager>,
}

#[derive(Serialize, Deserialize)]
pub struct CommandRequest {
    pub command: String,
}

#[derive(Serialize, Deserialize)]
pub struct CommandResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct VideoFile {
    pub name: String,
    pub size: u64,
    pub path: String,
}

#[derive(Serialize, Deserialize)]
pub struct SteamDeckButtonEvent {
    pub button: String,
    pub pressed: bool,
    pub timestamp: u64,
}

#[derive(Serialize, Deserialize)]
pub struct WindowNavigationRequest {
    pub window_id: u32,
}

#[derive(Serialize, Deserialize)]
pub struct CueExecutionRequest {
    pub cue_number: Option<u32>,
    pub action: String, // "go", "pause", "resume", "stop"
}

#[derive(Serialize, Deserialize)]
pub struct ExecutorRequest {
    pub executor_number: Option<u32>,
    pub action: String, // "go", "pause", "resume", "stop", "flash"
}

/// Start the web server on port 8080
pub async fn start_server(video_dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let (tx, _rx) = broadcast::channel(100);

    // Initialize NDI manager
    let ndi_manager = Arc::new(NdiManager::new());

    // Start NDI discovery
    ndi_manager.start_discovery().await?;

    let state = AppState {
        tx,
        video_dir,
        ndi_manager,
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/api/command", post(command_handler))
        .route("/api/status", get(status_handler))
        .route("/api/videos", get(list_videos))
        .route("/api/video/upload", post(upload_video))
        .route("/api/video/:name", get(get_video))
        // Steam Deck integration endpoints
        .route("/api/steamdeck/button", post(steamdeck_button_handler))
        .route("/api/steamdeck/window", post(navigate_window_handler))
        .route("/api/steamdeck/cue", post(cue_handler))
        .route("/api/steamdeck/executor", post(executor_handler))
        // NDI endpoints
        .route("/api/ndi/sources", get(ndi_list_sources))
        .route("/api/ndi/discover", post(ndi_start_discovery))
        .route("/api/ndi/add", post(ndi_add_manual_source))
        .route("/api/ndi/remove/:name", post(ndi_remove_source))
        .route("/api/ndi/test/:name", get(ndi_test_connection))
        .route("/ws", get(ws_handler))
        .layer(cors)
        .with_state(state);

    let addr = "0.0.0.0:8080".parse::<std::net::SocketAddr>().unwrap();
    println!("Web Remote Server starting on http://{}", addr);

    // axum 0.6 API - use hyper::Server
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}

/// Serve the web remote interface
async fn index_handler() -> Html<&'static str> {
    Html(include_str!("../web_remote/index.html"))
}

/// Handle CLI commands via REST API
async fn command_handler(
    State(state): State<AppState>,
    Json(payload): Json<CommandRequest>,
) -> Json<CommandResponse> {
    println!("Received command: {}", payload.command);

    // Broadcast command to WebSocket clients
    let _ = state.tx.send(payload.command.clone());

    // TODO: Actually execute the command via Tauri IPC
    // For now, return success
    Json(CommandResponse {
        success: true,
        message: format!("Command '{}' queued", payload.command),
    })
}

/// Get system status
async fn status_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "online",
        "version": "0.1.0",
        "features": ["cli", "video_patch", "websocket"]
    }))
}

/// List all video files
async fn list_videos(State(state): State<AppState>) -> Json<Vec<VideoFile>> {
    let mut videos = Vec::new();

    if let Ok(entries) = fs::read_dir(&state.video_dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    if let Some(name) = entry.file_name().to_str() {
                        videos.push(VideoFile {
                            name: name.to_string(),
                            size: metadata.len(),
                            path: entry.path().to_string_lossy().to_string(),
                        });
                    }
                }
            }
        }
    }

    Json(videos)
}

/// Upload video file
async fn upload_video(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<CommandResponse>, StatusCode> {
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.file_name().unwrap_or("unnamed").to_string();
        let data = field.bytes().await.unwrap();

        let file_path = state.video_dir.join(&name);

        if let Err(e) = fs::write(&file_path, &data) {
            return Ok(Json(CommandResponse {
                success: false,
                message: format!("Failed to save file: {}", e),
            }));
        }

        println!("Uploaded video: {} ({} bytes)", name, data.len());

        return Ok(Json(CommandResponse {
            success: true,
            message: format!("Video '{}' uploaded successfully", name),
        }));
    }

    Ok(Json(CommandResponse {
        success: false,
        message: "No file received".to_string(),
    }))
}

/// Get video file metadata
async fn get_video(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Result<Json<VideoFile>, StatusCode> {
    let file_path = state.video_dir.join(&name);

    if let Ok(metadata) = fs::metadata(&file_path) {
        Ok(Json(VideoFile {
            name,
            size: metadata.len(),
            path: file_path.to_string_lossy().to_string(),
        }))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

/// WebSocket handler for real-time updates
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    // Send initial connection message
    let _ = sender.send(Message::Text("Connected to RoControl".to_string())).await;

    // Spawn a task to forward broadcasts to this WebSocket
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming WebSocket messages
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                println!("WebSocket received: {}", text);
                // TODO: Handle incoming commands from WebSocket
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }
}

/// Handle Steam Deck button events from web remote
async fn steamdeck_button_handler(
    State(state): State<AppState>,
    Json(payload): Json<SteamDeckButtonEvent>,
) -> Json<CommandResponse> {
    println!("Steam Deck button: {} ({})", payload.button, if payload.pressed { "pressed" } else { "released" });

    // Broadcast button event to WebSocket clients
    let event_msg = serde_json::to_string(&payload).unwrap_or_default();
    let _ = state.tx.send(format!("steamdeck:button:{}", event_msg));

    Json(CommandResponse {
        success: true,
        message: format!("Button '{}' event processed", payload.button),
    })
}

/// Handle window navigation from web remote
async fn navigate_window_handler(
    State(state): State<AppState>,
    Json(payload): Json<WindowNavigationRequest>,
) -> Json<CommandResponse> {
    println!("Navigate to window: {}", payload.window_id);

    // Broadcast window navigation to WebSocket clients
    let _ = state.tx.send(format!("navigate:window:{}", payload.window_id));

    Json(CommandResponse {
        success: true,
        message: format!("Navigated to window {}", payload.window_id),
    })
}

/// Handle cue execution from web remote
async fn cue_handler(
    State(state): State<AppState>,
    Json(payload): Json<CueExecutionRequest>,
) -> Json<CommandResponse> {
    let command = if let Some(cue_num) = payload.cue_number {
        format!("{} cue {}", payload.action, cue_num)
    } else {
        format!("{} cue", payload.action)
    };

    println!("Cue command: {}", command);

    // Broadcast cue command
    let _ = state.tx.send(format!("command:{}", command));

    Json(CommandResponse {
        success: true,
        message: format!("Cue command '{}' executed", command),
    })
}

/// Handle executor commands from web remote
async fn executor_handler(
    State(state): State<AppState>,
    Json(payload): Json<ExecutorRequest>,
) -> Json<CommandResponse> {
    let command = if let Some(exec_num) = payload.executor_number {
        format!("{} exec {}", payload.action, exec_num)
    } else {
        format!("{} exec", payload.action)
    };

    println!("Executor command: {}", command);

    // Broadcast executor command
    let _ = state.tx.send(format!("command:{}", command));

    Json(CommandResponse {
        success: true,
        message: format!("Executor command '{}' executed", command),
    })
}

/// List all NDI sources
async fn ndi_list_sources(
    State(state): State<AppState>,
) -> Json<Vec<NdiSource>> {
    let sources = state.ndi_manager.get_sources();
    println!("[NDI] Listed {} sources", sources.len());
    Json(sources)
}

/// Start NDI discovery
async fn ndi_start_discovery(
    State(state): State<AppState>,
) -> Json<CommandResponse> {
    match state.ndi_manager.start_discovery().await {
        Ok(_) => Json(CommandResponse {
            success: true,
            message: "NDI discovery started".to_string(),
        }),
        Err(e) => Json(CommandResponse {
            success: false,
            message: format!("Failed to start NDI discovery: {}", e),
        }),
    }
}

/// Manually add an NDI source
#[derive(Serialize, Deserialize)]
struct NdiAddRequest {
    name: String,
    address: String,
    port: u16,
}

async fn ndi_add_manual_source(
    State(state): State<AppState>,
    Json(payload): Json<NdiAddRequest>,
) -> Json<NdiSource> {
    let source = state.ndi_manager.add_manual_source(
        payload.name,
        payload.address,
        payload.port
    );

    // Broadcast new source to WebSocket clients
    if let Ok(source_json) = serde_json::to_string(&source) {
        let _ = state.tx.send(format!("ndi:source:added:{}", source_json));
    }

    Json(source)
}

/// Remove an NDI source
async fn ndi_remove_source(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Json<CommandResponse> {
    let success = state.ndi_manager.remove_source(&name);

    if success {
        // Broadcast source removal to WebSocket clients
        let _ = state.tx.send(format!("ndi:source:removed:{}", name));

        Json(CommandResponse {
            success: true,
            message: format!("NDI source '{}' removed", name),
        })
    } else {
        Json(CommandResponse {
            success: false,
            message: format!("NDI source '{}' not found", name),
        })
    }
}

/// Test connection to an NDI source
async fn ndi_test_connection(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Json<CommandResponse> {
    match state.ndi_manager.test_connection(&name).await {
        Ok(connected) => Json(CommandResponse {
            success: connected,
            message: if connected {
                format!("Connection to '{}' successful", name)
            } else {
                format!("Connection to '{}' failed", name)
            },
        }),
        Err(e) => Json(CommandResponse {
            success: false,
            message: format!("Error testing connection: {}", e),
        }),
    }
}
