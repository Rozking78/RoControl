use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH, Duration as StdDuration};

/// Timecode format (SMPTE)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Timecode {
    pub hours: u8,
    pub minutes: u8,
    pub seconds: u8,
    pub frames: u8,
    pub framerate: Framerate,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Framerate {
    Fps24,
    Fps25,
    Fps30,
    Fps29_97,  // Drop-frame
    Fps60,
}

impl Framerate {
    pub fn to_fps(&self) -> f64 {
        match self {
            Framerate::Fps24 => 24.0,
            Framerate::Fps25 => 25.0,
            Framerate::Fps30 => 30.0,
            Framerate::Fps29_97 => 29.97,
            Framerate::Fps60 => 60.0,
        }
    }

    pub fn frames_per_second(&self) -> u8 {
        match self {
            Framerate::Fps24 => 24,
            Framerate::Fps25 => 25,
            Framerate::Fps30 => 30,
            Framerate::Fps29_97 => 30,
            Framerate::Fps60 => 60,
        }
    }
}

impl Timecode {
    pub fn new(hours: u8, minutes: u8, seconds: u8, frames: u8, framerate: Framerate) -> Self {
        Timecode { hours, minutes, seconds, frames, framerate }
    }

    pub fn zero(framerate: Framerate) -> Self {
        Timecode { hours: 0, minutes: 0, seconds: 0, frames: 0, framerate }
    }

    pub fn from_milliseconds(ms: u64, framerate: Framerate) -> Self {
        let total_seconds = ms / 1000;
        let remaining_ms = ms % 1000;

        let hours = (total_seconds / 3600) as u8;
        let minutes = ((total_seconds % 3600) / 60) as u8;
        let seconds = (total_seconds % 60) as u8;
        let frames = ((remaining_ms as f64 / 1000.0) * framerate.to_fps()) as u8;

        Timecode { hours, minutes, seconds, frames, framerate }
    }

    pub fn to_milliseconds(&self) -> u64 {
        let total_seconds = (self.hours as u64 * 3600) + (self.minutes as u64 * 60) + self.seconds as u64;
        let frame_ms = (self.frames as f64 / self.framerate.to_fps() * 1000.0) as u64;
        total_seconds * 1000 + frame_ms
    }

    pub fn to_string(&self) -> String {
        format!("{:02}:{:02}:{:02}:{:02}", self.hours, self.minutes, self.seconds, self.frames)
    }

    pub fn add_frames(&mut self, frames: i32) {
        let fps = self.framerate.frames_per_second();
        let mut total_frames = self.to_total_frames() as i32 + frames;

        if total_frames < 0 {
            total_frames = 0;
        }

        self.from_total_frames(total_frames as u64);
    }

    fn to_total_frames(&self) -> u64 {
        let total_seconds = (self.hours as u64 * 3600) + (self.minutes as u64 * 60) + self.seconds as u64;
        total_seconds * self.framerate.frames_per_second() as u64 + self.frames as u64
    }

    fn from_total_frames(&mut self, total_frames: u64) {
        let fps = self.framerate.frames_per_second() as u64;

        self.frames = (total_frames % fps) as u8;
        let total_seconds = total_frames / fps;

        self.seconds = (total_seconds % 60) as u8;
        let total_minutes = total_seconds / 60;

        self.minutes = (total_minutes % 60) as u8;
        self.hours = (total_minutes / 60) as u8;
    }
}

/// Run state for outputs/inputs/playbacks
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RunState {
    Stopped,
    Playing,
    Paused,
    Cueing,    // Pre-roll, loading
    Error,
}

/// Duration type - finite or indefinite
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DurationType {
    Finite { duration_ms: u64 },      // Fixed-length (video file, cue)
    Indefinite,                        // Live stream, continuous output
}

/// Source type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SourceType {
    VideoPlayback,
    AudioPlayback,
    NdiStream,
    ArtNetInput,
    SacnInput,
    DmxOutput,
    CueList,
    Executor,
}

/// Time-aware state for any source
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeState {
    pub id: String,
    pub name: String,
    pub source_type: SourceType,
    pub run_state: RunState,
    pub duration_type: DurationType,

    // Timing
    pub start_time: Option<u64>,       // Unix timestamp in ms
    pub elapsed_ms: u64,               // Elapsed time since start
    pub timecode: Option<Timecode>,    // Current timecode position

    // Progress (for finite sources)
    pub progress_percent: f64,         // 0.0 - 100.0

    // Health monitoring
    pub last_update: u64,              // Last state update timestamp
    pub frame_count: u64,              // Total frames processed
    pub dropped_frames: u64,           // Dropped frames (for streams)
    pub latency_ms: f64,               // Current latency

    // Metadata
    pub metadata: HashMap<String, String>,
}

impl TimeState {
    pub fn new(id: String, name: String, source_type: SourceType, duration_type: DurationType) -> Self {
        TimeState {
            id,
            name,
            source_type,
            run_state: RunState::Stopped,
            duration_type,
            start_time: None,
            elapsed_ms: 0,
            timecode: None,
            progress_percent: 0.0,
            last_update: Self::current_timestamp_ms(),
            frame_count: 0,
            dropped_frames: 0,
            latency_ms: 0.0,
            metadata: HashMap::new(),
        }
    }

    pub fn start(&mut self, timecode_framerate: Option<Framerate>) {
        let now = Self::current_timestamp_ms();
        self.start_time = Some(now);
        self.run_state = RunState::Playing;
        self.last_update = now;

        if let Some(fps) = timecode_framerate {
            self.timecode = Some(Timecode::zero(fps));
        }
    }

    pub fn pause(&mut self) {
        self.run_state = RunState::Paused;
        self.last_update = Self::current_timestamp_ms();
    }

    pub fn stop(&mut self) {
        self.run_state = RunState::Stopped;
        self.start_time = None;
        self.elapsed_ms = 0;
        self.progress_percent = 0.0;
        self.last_update = Self::current_timestamp_ms();

        if let Some(tc) = &mut self.timecode {
            *tc = Timecode::zero(tc.framerate);
        }
    }

    pub fn update(&mut self) {
        let now = Self::current_timestamp_ms();
        self.last_update = now;

        if self.run_state == RunState::Playing {
            if let Some(start) = self.start_time {
                self.elapsed_ms = now - start;

                // Update timecode
                if let Some(tc) = &mut self.timecode {
                    *tc = Timecode::from_milliseconds(self.elapsed_ms, tc.framerate);
                }

                // Update progress for finite sources
                if let DurationType::Finite { duration_ms } = self.duration_type {
                    if duration_ms > 0 {
                        self.progress_percent = (self.elapsed_ms as f64 / duration_ms as f64) * 100.0;
                        self.progress_percent = self.progress_percent.min(100.0);

                        // Auto-stop at end
                        if self.elapsed_ms >= duration_ms {
                            self.stop();
                        }
                    }
                }
            }
        }
    }

    pub fn is_alive(&self) -> bool {
        let now = Self::current_timestamp_ms();
        let time_since_update = now - self.last_update;

        // Consider dead if no update in 5 seconds
        time_since_update < 5000
    }

    pub fn remaining_ms(&self) -> Option<u64> {
        match self.duration_type {
            DurationType::Finite { duration_ms } => {
                if self.elapsed_ms < duration_ms {
                    Some(duration_ms - self.elapsed_ms)
                } else {
                    Some(0)
                }
            }
            DurationType::Indefinite => None,
        }
    }

    fn current_timestamp_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64
    }
}

/// Timeline - collection of time-aware states
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Timeline {
    pub id: String,
    pub name: String,
    pub master_timecode: Timecode,
    pub states: Vec<String>,  // IDs of TimeStates in this timeline
    pub sync_enabled: bool,
    pub created_at: u64,
}

/// Time Manager - manages all time-aware states
pub struct TimeManager {
    states: Arc<Mutex<HashMap<String, TimeState>>>,
    timelines: Arc<Mutex<HashMap<String, Timeline>>>,
    master_framerate: Framerate,
}

impl TimeManager {
    pub fn new(master_framerate: Framerate) -> Self {
        TimeManager {
            states: Arc::new(Mutex::new(HashMap::new())),
            timelines: Arc::new(Mutex::new(HashMap::new())),
            master_framerate,
        }
    }

    pub fn register_state(&self, state: TimeState) -> Result<(), String> {
        let mut states = self.states.lock().map_err(|e| e.to_string())?;
        states.insert(state.id.clone(), state);
        Ok(())
    }

    pub fn start_state(&self, id: &str) -> Result<(), String> {
        let mut states = self.states.lock().map_err(|e| e.to_string())?;

        if let Some(state) = states.get_mut(id) {
            state.start(Some(self.master_framerate));
            Ok(())
        } else {
            Err(format!("State {} not found", id))
        }
    }

    pub fn pause_state(&self, id: &str) -> Result<(), String> {
        let mut states = self.states.lock().map_err(|e| e.to_string())?;

        if let Some(state) = states.get_mut(id) {
            state.pause();
            Ok(())
        } else {
            Err(format!("State {} not found", id))
        }
    }

    pub fn stop_state(&self, id: &str) -> Result<(), String> {
        let mut states = self.states.lock().map_err(|e| e.to_string())?;

        if let Some(state) = states.get_mut(id) {
            state.stop();
            Ok(())
        } else {
            Err(format!("State {} not found", id))
        }
    }

    pub fn update_all_states(&self) -> Result<(), String> {
        let mut states = self.states.lock().map_err(|e| e.to_string())?;

        for state in states.values_mut() {
            state.update();
        }

        Ok(())
    }

    pub fn get_state(&self, id: &str) -> Result<TimeState, String> {
        let states = self.states.lock().map_err(|e| e.to_string())?;

        states.get(id)
            .cloned()
            .ok_or_else(|| format!("State {} not found", id))
    }

    pub fn get_all_states(&self) -> Result<Vec<TimeState>, String> {
        let states = self.states.lock().map_err(|e| e.to_string())?;
        Ok(states.values().cloned().collect())
    }

    pub fn get_playing_states(&self) -> Result<Vec<TimeState>, String> {
        let states = self.states.lock().map_err(|e| e.to_string())?;

        Ok(states.values()
            .filter(|s| s.run_state == RunState::Playing)
            .cloned()
            .collect())
    }

    pub fn get_states_by_type(&self, source_type: SourceType) -> Result<Vec<TimeState>, String> {
        let states = self.states.lock().map_err(|e| e.to_string())?;

        Ok(states.values()
            .filter(|s| s.source_type == source_type)
            .cloned()
            .collect())
    }

    pub fn create_timeline(&self, name: String, state_ids: Vec<String>) -> Result<String, String> {
        let timeline_id = uuid::Uuid::new_v4().to_string();

        let timeline = Timeline {
            id: timeline_id.clone(),
            name,
            master_timecode: Timecode::zero(self.master_framerate),
            states: state_ids,
            sync_enabled: true,
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        };

        let mut timelines = self.timelines.lock().map_err(|e| e.to_string())?;
        timelines.insert(timeline_id.clone(), timeline);

        Ok(timeline_id)
    }

    pub fn get_timeline(&self, id: &str) -> Result<Timeline, String> {
        let timelines = self.timelines.lock().map_err(|e| e.to_string())?;

        timelines.get(id)
            .cloned()
            .ok_or_else(|| format!("Timeline {} not found", id))
    }

    pub fn get_all_timelines(&self) -> Result<Vec<Timeline>, String> {
        let timelines = self.timelines.lock().map_err(|e| e.to_string())?;
        Ok(timelines.values().cloned().collect())
    }

    pub fn remove_state(&self, id: &str) -> Result<(), String> {
        let mut states = self.states.lock().map_err(|e| e.to_string())?;
        states.remove(id);
        Ok(())
    }

    pub fn update_state_metadata(&self, id: &str, key: String, value: String) -> Result<(), String> {
        let mut states = self.states.lock().map_err(|e| e.to_string())?;

        if let Some(state) = states.get_mut(id) {
            state.metadata.insert(key, value);
            Ok(())
        } else {
            Err(format!("State {} not found", id))
        }
    }

    pub fn report_frame(&self, id: &str, dropped: bool) -> Result<(), String> {
        let mut states = self.states.lock().map_err(|e| e.to_string())?;

        if let Some(state) = states.get_mut(id) {
            state.frame_count += 1;
            if dropped {
                state.dropped_frames += 1;
            }
            state.last_update = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64;
            Ok(())
        } else {
            Err(format!("State {} not found", id))
        }
    }

    pub fn set_latency(&self, id: &str, latency_ms: f64) -> Result<(), String> {
        let mut states = self.states.lock().map_err(|e| e.to_string())?;

        if let Some(state) = states.get_mut(id) {
            state.latency_ms = latency_ms;
            Ok(())
        } else {
            Err(format!("State {} not found", id))
        }
    }
}

impl Default for TimeManager {
    fn default() -> Self {
        Self::new(Framerate::Fps30)
    }
}
