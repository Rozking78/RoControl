use axum::{
    extract::{State, ws::{Message, WebSocket, WebSocketUpgrade}},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};
use tower_http::cors::{Any, CorsLayer};
use futures::{StreamExt, SinkExt};
use crate::node_manager::{
    NodeManager, NodeRegistration, NodeHeartbeat, NodeCommand,
    NodeCommandAck, NodeInfo, NodeConfig, NodeEvent
};

#[derive(Clone)]
pub struct NodeApiState {
    pub node_manager: Arc<Mutex<NodeManager>>,
    pub command_tx: broadcast::Sender<NodeCommand>,
    pub time_manager: Option<Arc<Mutex<crate::time_manager::TimeManager>>>,
}

#[derive(Serialize, Deserialize)]
pub struct ApiResponse {
    pub success: bool,
    pub message: String,
}

/// Start the node API server on port 9000
pub async fn start_node_api(
    node_manager: Arc<Mutex<NodeManager>>,
    time_manager: Arc<Mutex<crate::time_manager::TimeManager>>,
) -> Result<(), Box<dyn std::error::Error>> {
    let (command_tx, _) = broadcast::channel(100);

    let state = NodeApiState {
        node_manager,
        command_tx,
        time_manager: Some(time_manager),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Node registration and management
        .route("/api/nodes/register", post(register_node_handler))
        .route("/api/nodes/:node_id/unregister", post(unregister_node_handler))
        .route("/api/nodes", get(list_nodes_handler))
        .route("/api/nodes/:node_id/status", get(node_status_handler))

        // Commands
        .route("/api/nodes/:node_id/command", post(send_command_handler))

        // Heartbeat
        .route("/api/master/heartbeat", post(heartbeat_handler))

        // Command acknowledgment
        .route("/api/master/ack", post(command_ack_handler))

        // WebSocket for real-time communication
        .route("/ws/node", get(node_ws_handler))

        // WebSocket for streaming time states
        .route("/ws/time", get(time_stream_handler))

        .layer(cors)
        .with_state(state);

    let addr = "0.0.0.0:9000".parse::<std::net::SocketAddr>().unwrap();
    println!("Node API Server starting on http://{}", addr);

    // axum 0.6 API - use hyper::Server
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}

/// Register a new receiver node
async fn register_node_handler(
    State(state): State<NodeApiState>,
    Json(registration): Json<NodeRegistration>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let manager = state.node_manager.lock().await;

    match manager.register_node(registration) {
        Ok(msg) => Ok(Json(ApiResponse {
            success: true,
            message: msg,
        })),
        Err(e) => Ok(Json(ApiResponse {
            success: false,
            message: e,
        })),
    }
}

/// Unregister a node
async fn unregister_node_handler(
    State(state): State<NodeApiState>,
    axum::extract::Path(node_id): axum::extract::Path<String>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let manager = state.node_manager.lock().await;

    match manager.unregister_node(&node_id) {
        Ok(msg) => Ok(Json(ApiResponse {
            success: true,
            message: msg,
        })),
        Err(e) => Ok(Json(ApiResponse {
            success: false,
            message: e,
        })),
    }
}

/// List all nodes
async fn list_nodes_handler(
    State(state): State<NodeApiState>,
) -> Result<Json<Vec<NodeInfo>>, StatusCode> {
    let manager = state.node_manager.lock().await;

    match manager.get_all_nodes() {
        Ok(nodes) => Ok(Json(nodes)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// Get status of a specific node
async fn node_status_handler(
    State(state): State<NodeApiState>,
    axum::extract::Path(node_id): axum::extract::Path<String>,
) -> Result<Json<NodeInfo>, StatusCode> {
    let manager = state.node_manager.lock().await;

    match manager.get_node(&node_id) {
        Ok(node) => Ok(Json(node)),
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}

/// Send a command to a specific node
async fn send_command_handler(
    State(state): State<NodeApiState>,
    axum::extract::Path(node_id): axum::extract::Path<String>,
    Json(command): Json<NodeCommand>,
) -> Result<Json<ApiResponse>, StatusCode> {
    // Broadcast command via WebSocket
    let mut cmd = command.clone();
    cmd.target_node = Some(node_id);

    if state.command_tx.send(cmd).is_ok() {
        Ok(Json(ApiResponse {
            success: true,
            message: "Command sent".to_string(),
        }))
    } else {
        Ok(Json(ApiResponse {
            success: false,
            message: "Failed to send command".to_string(),
        }))
    }
}

/// Receive heartbeat from receiver node
async fn heartbeat_handler(
    State(state): State<NodeApiState>,
    Json(heartbeat): Json<NodeHeartbeat>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let manager = state.node_manager.lock().await;

    match manager.update_heartbeat(heartbeat) {
        Ok(_) => Ok(Json(ApiResponse {
            success: true,
            message: "Heartbeat received".to_string(),
        })),
        Err(e) => Ok(Json(ApiResponse {
            success: false,
            message: e,
        })),
    }
}

/// Receive command acknowledgment from node
async fn command_ack_handler(
    State(_state): State<NodeApiState>,
    Json(ack): Json<NodeCommandAck>,
) -> Result<Json<ApiResponse>, StatusCode> {
    println!("Command {} acknowledged by {} with status: {}",
        ack.command_id, ack.node_id, ack.status);

    Ok(Json(ApiResponse {
        success: true,
        message: "Acknowledgment received".to_string(),
    }))
}

/// WebSocket handler for real-time node communication
async fn node_ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<NodeApiState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_node_socket(socket, state))
}

async fn handle_node_socket(socket: WebSocket, state: NodeApiState) {
    let (mut sender, mut receiver) = socket.split();

    // Subscribe to command broadcasts
    let mut command_rx = state.command_tx.subscribe();

    // Spawn task to forward commands to this WebSocket client
    let mut send_task = tokio::spawn(async move {
        while let Ok(command) = command_rx.recv().await {
            if let Ok(json) = serde_json::to_string(&command) {
                if sender.send(Message::Text(json)).await.is_err() {
                    break;
                }
            }
        }
    });

    // Handle incoming messages from this WebSocket client
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    println!("Received node message: {}", text);

                    // Parse and handle different message types
                    // This could be heartbeats, acknowledgments, or status updates
                }
                Message::Close(_) => {
                    println!("Node WebSocket connection closed");
                    break;
                }
                _ => {}
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }
}

/// WebSocket handler for streaming time states
async fn time_stream_handler(
    ws: WebSocketUpgrade,
    State(state): State<NodeApiState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_time_stream(socket, state))
}

async fn handle_time_stream(socket: WebSocket, state: NodeApiState) {
    let (mut sender, mut receiver) = socket.split();

    // Spawn task to continuously send time state updates
    let send_task = tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(100));

        loop {
            interval.tick().await;

            // Get all time states from manager
            if let Some(time_manager) = &state.time_manager {
                if let Ok(manager) = time_manager.lock() {
                    if let Ok(states) = manager.get_all_states() {
                        // Serialize and send as JSON
                        if let Ok(json) = serde_json::to_string(&states) {
                            if sender.send(Message::Text(json)).await.is_err() {
                                break;
                            }
                        }
                    }
                }
            }
        }
    });

    // Handle incoming messages (close, ping, etc)
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => {
                    println!("Time stream WebSocket closed");
                    break;
                }
                _ => {}
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = send_task => recv_task.abort(),
        _ = recv_task => {},
    }
}
