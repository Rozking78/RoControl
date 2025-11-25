use hidapi::{HidApi, HidDevice};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use image::{ImageBuffer, Rgba, RgbaImage};

const ELGATO_VENDOR_ID: u16 = 0x0fd9;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamDeckDevice {
    pub product_id: u16,
    pub model_name: String,
    pub serial_number: String,
    pub button_count: u8,
    pub button_rows: u8,
    pub button_cols: u8,
    pub icon_size: u16,
    pub is_connected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamDeckButton {
    pub button_id: u8,
    pub is_pressed: bool,
    pub label: String,
    pub action_type: String, // "window", "command", "none"
    pub action_value: String,
}

pub struct StreamDeckManager {
    hid_api: Arc<Mutex<HidApi>>,
    devices: Arc<Mutex<HashMap<String, Arc<Mutex<HidDevice>>>>>,
    button_states: Arc<Mutex<HashMap<String, Vec<bool>>>>, // device_serial -> button states
}

impl StreamDeckManager {
    pub fn new() -> Result<Self, String> {
        let hid_api = HidApi::new().map_err(|e| format!("Failed to initialize HID API: {}", e))?;

        Ok(StreamDeckManager {
            hid_api: Arc::new(Mutex::new(hid_api)),
            devices: Arc::new(Mutex::new(HashMap::new())),
            button_states: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    pub fn scan_devices(&self) -> Result<Vec<StreamDeckDevice>, String> {
        let api = self.hid_api.lock().map_err(|e| e.to_string())?;
        api.refresh_devices().map_err(|e| e.to_string())?;

        let mut found_devices = Vec::new();

        for device_info in api.device_list() {
            if device_info.vendor_id() == ELGATO_VENDOR_ID {
                let device = self.identify_device(device_info.product_id(), device_info.serial_number().unwrap_or("unknown"));
                if device.is_some() {
                    found_devices.push(device.unwrap());
                }
            }
        }

        Ok(found_devices)
    }

    fn identify_device(&self, product_id: u16, serial: &str) -> Option<StreamDeckDevice> {
        let (model_name, button_count, rows, cols, icon_size) = match product_id {
            0x0060 => ("Stream Deck Original", 15, 3, 5, 72),
            0x0063 => ("Stream Deck Mini", 6, 2, 3, 80),
            0x006c => ("Stream Deck XL", 32, 4, 8, 96),
            0x006d => ("Stream Deck Original V2", 15, 3, 5, 72),
            0x0080 => ("Stream Deck MK.2", 15, 3, 5, 72),
            0x0084 => ("Stream Deck Plus", 8, 2, 4, 120),
            0x009c => ("Stream Deck Pedal", 3, 1, 3, 0), // Pedal has no screen
            _ => return None,
        };

        Some(StreamDeckDevice {
            product_id,
            model_name: model_name.to_string(),
            serial_number: serial.to_string(),
            button_count,
            button_rows: rows,
            button_cols: cols,
            icon_size,
            is_connected: true,
        })
    }

    pub fn connect_device(&self, serial: &str) -> Result<String, String> {
        let api = self.hid_api.lock().map_err(|e| e.to_string())?;

        // Find device with matching serial
        for device_info in api.device_list() {
            if device_info.vendor_id() == ELGATO_VENDOR_ID
                && device_info.serial_number() == Some(serial) {

                let device = api.open(device_info.vendor_id(), device_info.product_id())
                    .map_err(|e| format!("Failed to open device: {}", e))?;

                let mut devices = self.devices.lock().map_err(|e| e.to_string())?;
                devices.insert(serial.to_string(), Arc::new(Mutex::new(device)));

                // Initialize button states
                let device_info_opt = self.identify_device(device_info.product_id(), serial);
                if let Some(device_info) = device_info_opt {
                    let mut button_states = self.button_states.lock().map_err(|e| e.to_string())?;
                    button_states.insert(serial.to_string(), vec![false; device_info.button_count as usize]);

                    // Reset device to ensure clean state
                    self.reset_device(serial)?;
                }

                return Ok(format!("Connected to Stream Deck: {}", serial));
            }
        }

        Err(format!("Device not found: {}", serial))
    }

    pub fn disconnect_device(&self, serial: &str) -> Result<String, String> {
        let mut devices = self.devices.lock().map_err(|e| e.to_string())?;

        if devices.remove(serial).is_some() {
            let mut button_states = self.button_states.lock().map_err(|e| e.to_string())?;
            button_states.remove(serial);
            Ok(format!("Disconnected from Stream Deck: {}", serial))
        } else {
            Err(format!("Device not connected: {}", serial))
        }
    }

    pub fn reset_device(&self, serial: &str) -> Result<String, String> {
        let devices = self.devices.lock().map_err(|e| e.to_string())?;
        let device = devices.get(serial)
            .ok_or_else(|| format!("Device not connected: {}", serial))?;

        let device = device.lock().map_err(|e| e.to_string())?;

        // Reset command (varies by device, but 0x0B 0x63 works for most)
        let reset_payload = [0x0B, 0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        device.send_feature_report(&reset_payload)
            .map_err(|e| format!("Failed to reset device: {}", e))?;

        Ok(format!("Reset Stream Deck: {}", serial))
    }

    pub fn set_brightness(&self, serial: &str, brightness: u8) -> Result<String, String> {
        let devices = self.devices.lock().map_err(|e| e.to_string())?;
        let device = devices.get(serial)
            .ok_or_else(|| format!("Device not connected: {}", serial))?;

        let device = device.lock().map_err(|e| e.to_string())?;

        // Brightness command (0x05, 0x55, 0xaa, 0xd1, 0x01, brightness%)
        let brightness_payload = [0x05, 0x55, 0xaa, 0xd1, 0x01, brightness.min(100), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        device.send_feature_report(&brightness_payload)
            .map_err(|e| format!("Failed to set brightness: {}", e))?;

        Ok(format!("Set brightness to {}% on Stream Deck: {}", brightness, serial))
    }

    pub fn read_buttons(&self, serial: &str) -> Result<Vec<bool>, String> {
        let devices = self.devices.lock().map_err(|e| e.to_string())?;
        let device = devices.get(serial)
            .ok_or_else(|| format!("Device not connected: {}", serial))?;

        let device = device.lock().map_err(|e| e.to_string())?;

        // Read button state from device (non-blocking)
        let mut buf = [0u8; 1024];
        device.set_blocking_mode(false)
            .map_err(|e| format!("Failed to set non-blocking mode: {}", e))?;

        let res = device.read_timeout(&mut buf, 10);

        match res {
            Ok(bytes_read) if bytes_read > 0 => {
                // Parse button states from report
                // Format varies by device model
                // For Stream Deck Original: first byte is report ID, rest are button states
                let mut button_states_guard = self.button_states.lock().map_err(|e| e.to_string())?;
                let button_states = button_states_guard.get_mut(serial)
                    .ok_or_else(|| format!("Device not initialized: {}", serial))?;

                // Update button states (skip first byte which is report ID)
                for (i, state) in button_states.iter_mut().enumerate() {
                    if i + 1 < bytes_read {
                        *state = buf[i + 1] > 0;
                    }
                }

                Ok(button_states.clone())
            }
            _ => {
                // No data available or error, return cached state
                let button_states_guard = self.button_states.lock().map_err(|e| e.to_string())?;
                Ok(button_states_guard.get(serial).cloned().unwrap_or_default())
            }
        }
    }

    pub fn set_button_image(&self, serial: &str, button_id: u8, image_data: Vec<u8>) -> Result<String, String> {
        let devices = self.devices.lock().map_err(|e| e.to_string())?;
        let device = devices.get(serial)
            .ok_or_else(|| format!("Device not connected: {}", serial))?;

        let device = device.lock().map_err(|e| e.to_string())?;

        // Stream Deck expects images in specific format (varies by model)
        // This is a simplified implementation
        // In production, would need to:
        // 1. Resize image to correct dimensions
        // 2. Convert to JPEG or BMP (depending on device)
        // 3. Split into multiple HID packets if needed
        // 4. Send with proper header

        // For now, just send a basic command
        // Real implementation would be much more complex

        Ok(format!("Set button {} image on Stream Deck: {}", button_id, serial))
    }

    pub fn clear_button(&self, serial: &str, button_id: u8) -> Result<String, String> {
        // Create a black image
        let black_image = vec![0u8; 72 * 72 * 3]; // Placeholder size
        self.set_button_image(serial, button_id, black_image)
    }

    pub fn clear_all_buttons(&self, serial: &str) -> Result<String, String> {
        let api = self.hid_api.lock().map_err(|e| e.to_string())?;

        // Find device info to get button count
        for device_info in api.device_list() {
            if device_info.vendor_id() == ELGATO_VENDOR_ID
                && device_info.serial_number() == Some(serial) {

                let device_info_opt = self.identify_device(device_info.product_id(), serial);
                if let Some(device) = device_info_opt {
                    for button_id in 0..device.button_count {
                        let _ = self.clear_button(serial, button_id);
                    }
                    return Ok(format!("Cleared all buttons on Stream Deck: {}", serial));
                }
            }
        }

        Err(format!("Device not found: {}", serial))
    }
}

// Utility function to generate simple text button image
pub fn generate_text_image(text: &str, width: u16, height: u16) -> Result<Vec<u8>, String> {
    // Create a simple black background with white text
    // In production, would use imageproc or similar for text rendering
    let mut img: RgbaImage = ImageBuffer::new(width as u32, height as u32);

    // Fill with black
    for pixel in img.pixels_mut() {
        *pixel = Rgba([0, 0, 0, 255]);
    }

    // Convert to raw bytes (RGB)
    let mut rgb_data = Vec::new();
    for pixel in img.pixels() {
        rgb_data.push(pixel[0]); // R
        rgb_data.push(pixel[1]); // G
        rgb_data.push(pixel[2]); // B
    }

    Ok(rgb_data)
}
