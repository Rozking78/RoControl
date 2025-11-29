#include <cstddef>
#include <Processing.NDI.Lib.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreMedia/CoreMedia.h>
#import <CoreVideo/CoreVideo.h>
#import <Foundation/Foundation.h>

#include <atomic>
#include <chrono>
#include <csignal>
#include <iostream>
#include <string>
#include <thread>
#include <cmath>

enum class StreamMode {
    VIDEO,
    TEST_PATTERN,
    TEST_GRID,
    NDI_SOURCE,
    BLANK
};

enum class PlaybackState {
    PLAYING,
    PAUSED,
    STOPPED
};

struct StreamOptions {
    std::string name = "RocKontrol Media";
    StreamMode mode = StreamMode::VIDEO;
    std::string file;
    bool loop = true;
    int width = 1920;
    int height = 1080;
    double fps = 30.0;

    // Test pattern options
    std::string pattern_type = "gradient"; // gradient, grid, smpte, checkerboard

    // NDI source options
    std::string ndi_source_name; // Source NDI stream to receive and re-transmit

    // Blank/solid color options (RGBA 0-255)
    uint8_t blank_r = 0;
    uint8_t blank_g = 0;
    uint8_t blank_b = 0;
    uint8_t blank_a = 255;

    // Screen blend options
    double blend_left = 0.0;   // 0.0 to 1.0
    double blend_right = 0.0;
    double blend_top = 0.0;
    double blend_bottom = 0.0;
};

static std::atomic<bool> g_should_stop{false};
static std::atomic<PlaybackState> g_playback_state{PlaybackState::PLAYING};

static void handle_signal(int) {
    g_should_stop.store(true);
}

// Generate test pattern frame
static void generate_test_pattern(uint8_t* buffer, int width, int height, int stride,
                                  const std::string& pattern_type, uint64_t frame_num) {
    if (pattern_type == "gradient") {
        // Moving gradient pattern
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                uint8_t *pixel = buffer + y * stride + x * 4;
                pixel[0] = static_cast<uint8_t>((x + frame_num) % 256);        // B
                pixel[1] = static_cast<uint8_t>((y + frame_num/2) % 256);      // G
                pixel[2] = static_cast<uint8_t>((x + y + frame_num) % 256);    // R
                pixel[3] = 255;                                                  // A
            }
        }
    } else if (pattern_type == "grid") {
        // Test grid with crosshairs
        int grid_size = 100;
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                uint8_t *pixel = buffer + y * stride + x * 4;
                bool is_grid = (x % grid_size == 0) || (y % grid_size == 0);
                bool is_center = (abs(x - width/2) < 2) || (abs(y - height/2) < 2);

                if (is_center) {
                    pixel[0] = pixel[1] = 0; pixel[2] = 255; // Red center
                } else if (is_grid) {
                    pixel[0] = pixel[1] = pixel[2] = 255; // White grid
                } else {
                    pixel[0] = pixel[1] = pixel[2] = 0; // Black background
                }
                pixel[3] = 255;
            }
        }
    } else if (pattern_type == "smpte") {
        // SMPTE color bars
        int bar_width = width / 7;
        uint8_t colors[7][3] = {
            {192, 192, 192}, // White
            {192, 192,   0}, // Yellow
            {  0, 192, 192}, // Cyan
            {  0, 192,   0}, // Green
            {192,   0, 192}, // Magenta
            {192,   0,   0}, // Red
            {  0,   0, 192}  // Blue
        };

        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                uint8_t *pixel = buffer + y * stride + x * 4;
                int bar_idx = std::min(x / bar_width, 6);
                pixel[0] = colors[bar_idx][2]; // B
                pixel[1] = colors[bar_idx][1]; // G
                pixel[2] = colors[bar_idx][0]; // R
                pixel[3] = 255;
            }
        }
    } else if (pattern_type == "checkerboard") {
        // Checkerboard pattern
        int check_size = 64;
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                uint8_t *pixel = buffer + y * stride + x * 4;
                bool is_white = ((x / check_size) + (y / check_size)) % 2;
                uint8_t val = is_white ? 255 : 0;
                pixel[0] = pixel[1] = pixel[2] = val;
                pixel[3] = 255;
            }
        }
    }
}

// Apply screen blend/edge feathering
static void apply_screen_blend(uint8_t* buffer, int width, int height, int stride,
                               const StreamOptions& options) {
    if (options.blend_left == 0.0 && options.blend_right == 0.0 &&
        options.blend_top == 0.0 && options.blend_bottom == 0.0) {
        return; // No blending needed
    }

    int blend_left_px = static_cast<int>(options.blend_left * width);
    int blend_right_px = static_cast<int>(options.blend_right * width);
    int blend_top_px = static_cast<int>(options.blend_top * height);
    int blend_bottom_px = static_cast<int>(options.blend_bottom * height);

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            uint8_t *pixel = buffer + y * stride + x * 4;
            float alpha = 1.0f;

            // Left edge
            if (x < blend_left_px) {
                alpha *= static_cast<float>(x) / blend_left_px;
            }
            // Right edge
            if (x > width - blend_right_px) {
                alpha *= static_cast<float>(width - x) / blend_right_px;
            }
            // Top edge
            if (y < blend_top_px) {
                alpha *= static_cast<float>(y) / blend_top_px;
            }
            // Bottom edge
            if (y > height - blend_bottom_px) {
                alpha *= static_cast<float>(height - y) / blend_bottom_px;
            }

            pixel[0] = static_cast<uint8_t>(pixel[0] * alpha);
            pixel[1] = static_cast<uint8_t>(pixel[1] * alpha);
            pixel[2] = static_cast<uint8_t>(pixel[2] * alpha);
        }
    }
}

static bool stream_blank(const StreamOptions& options) {
    NDIlib_send_create_t create_desc = {0};
    create_desc.p_ndi_name = options.name.c_str();
    create_desc.p_groups = nullptr;
    create_desc.clock_video = true;
    create_desc.clock_audio = false;

    if (!NDIlib_initialize()) {
        std::cerr << "NDIlib_initialize failed.\n";
        return false;
    }

    NDIlib_send_instance_t ndi_sender = NDIlib_send_create(&create_desc);
    if (!ndi_sender) {
        std::cerr << "NDIlib_send_create failed.\n";
        NDIlib_destroy();
        return false;
    }

    std::cout << "Streaming blank/solid color (R:" << (int)options.blank_r
              << " G:" << (int)options.blank_g << " B:" << (int)options.blank_b << ") as \""
              << options.name << "\" at " << options.width << "x" << options.height
              << " @ " << options.fps << " fps\n";

    int stride = options.width * 4;
    size_t buffer_size = stride * options.height;
    auto buffer = std::make_unique<uint8_t[]>(buffer_size);

    // Fill buffer with solid color (BGRA format)
    for (int y = 0; y < options.height; ++y) {
        for (int x = 0; x < options.width; ++x) {
            uint8_t *pixel = buffer.get() + y * stride + x * 4;
            pixel[0] = options.blank_b; // B
            pixel[1] = options.blank_g; // G
            pixel[2] = options.blank_r; // R
            pixel[3] = options.blank_a; // A
        }
    }

    // Apply edge blending if configured
    apply_screen_blend(buffer.get(), options.width, options.height, stride, options);

    auto frame_duration = std::chrono::microseconds(static_cast<long long>(1000000.0 / options.fps));
    auto next_frame_time = std::chrono::steady_clock::now();

    while (!g_should_stop.load()) {
        if (g_playback_state.load() == PlaybackState::PLAYING) {
            NDIlib_video_frame_v2_t ndi_frame;
            ndi_frame.xres = options.width;
            ndi_frame.yres = options.height;
            ndi_frame.FourCC = NDIlib_FourCC_type_BGRA;
            ndi_frame.frame_rate_N = static_cast<int>(options.fps * 1000.0);
            ndi_frame.frame_rate_D = 1000;
            ndi_frame.picture_aspect_ratio = static_cast<float>(options.width) / options.height;
            ndi_frame.frame_format_type = NDIlib_frame_format_type_progressive;
            ndi_frame.p_data = buffer.get();
            ndi_frame.line_stride_in_bytes = stride;
            ndi_frame.timecode = NDIlib_send_timecode_synthesize;
            ndi_frame.p_metadata = nullptr;
            ndi_frame.timestamp = NDIlib_send_timecode_synthesize;

            NDIlib_send_send_video_v2(ndi_sender, &ndi_frame);
        }

        next_frame_time += frame_duration;
        std::this_thread::sleep_until(next_frame_time);
    }

    std::cout << "Stopping blank stream...\n";
    NDIlib_send_destroy(ndi_sender);
    NDIlib_destroy();
    return true;
}

static bool stream_test_pattern(const StreamOptions& options) {
    NDIlib_send_create_t create_desc = {0};
    create_desc.p_ndi_name = options.name.c_str();
    create_desc.p_groups = nullptr;
    create_desc.clock_video = true;
    create_desc.clock_audio = false;

    if (!NDIlib_initialize()) {
        std::cerr << "NDIlib_initialize failed.\n";
        return false;
    }

    NDIlib_send_instance_t ndi_sender = NDIlib_send_create(&create_desc);
    if (!ndi_sender) {
        std::cerr << "NDIlib_send_create failed.\n";
        NDIlib_destroy();
        return false;
    }

    std::cout << "Streaming " << options.pattern_type << " test pattern as \""
              << options.name << "\" at " << options.width << "x" << options.height
              << " @ " << options.fps << " fps\n";

    int stride = options.width * 4;
    size_t buffer_size = stride * options.height;
    auto buffer = std::make_unique<uint8_t[]>(buffer_size);

    uint64_t frame_num = 0;
    auto frame_duration = std::chrono::microseconds(static_cast<long long>(1000000.0 / options.fps));
    auto next_frame_time = std::chrono::steady_clock::now();

    while (!g_should_stop.load()) {
        if (g_playback_state.load() == PlaybackState::PLAYING) {
            generate_test_pattern(buffer.get(), options.width, options.height,
                                stride, options.pattern_type, frame_num);
            apply_screen_blend(buffer.get(), options.width, options.height, stride, options);

            NDIlib_video_frame_v2_t ndi_frame;
            ndi_frame.xres = options.width;
            ndi_frame.yres = options.height;
            ndi_frame.FourCC = NDIlib_FourCC_type_BGRA;
            ndi_frame.frame_rate_N = static_cast<int>(options.fps * 1000.0);
            ndi_frame.frame_rate_D = 1000;
            ndi_frame.picture_aspect_ratio = static_cast<float>(options.width) / options.height;
            ndi_frame.frame_format_type = NDIlib_frame_format_type_progressive;
            ndi_frame.p_data = buffer.get();
            ndi_frame.line_stride_in_bytes = stride;
            ndi_frame.timecode = NDIlib_send_timecode_synthesize;
            ndi_frame.p_metadata = nullptr;
            ndi_frame.timestamp = NDIlib_send_timecode_synthesize;

            NDIlib_send_send_video_v2(ndi_sender, &ndi_frame);
            ++frame_num;
        }

        next_frame_time += frame_duration;
        std::this_thread::sleep_until(next_frame_time);
    }

    std::cout << "Stopping test pattern sender...\n";
    NDIlib_send_destroy(ndi_sender);
    NDIlib_destroy();
    return true;
}

static bool stream_video(const StreamOptions& options) {
    @autoreleasepool {
        NSString *filePath = [NSString stringWithUTF8String:options.file.c_str()];
        if (![[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
            std::cerr << "File not found: " << options.file << "\n";
            return false;
        }

        NSURL *fileURL = [NSURL fileURLWithPath:filePath];
        AVURLAsset *asset = [AVURLAsset URLAssetWithURL:fileURL options:nil];
        NSArray<AVAssetTrack *> *videoTracks = [asset tracksWithMediaType:AVMediaTypeVideo];
        if ([videoTracks count] == 0) {
            std::cerr << "No video track found in file.\n";
            return false;
        }

        AVAssetTrack *videoTrack = videoTracks[0];
        double nominalFps = videoTrack.nominalFrameRate;
        if (nominalFps <= 0.0) {
            nominalFps = options.fps;
        }

        auto transformedSize = ^CGSize(AVAssetTrack *track) {
            CGSize natural = track.naturalSize;
            CGAffineTransform t = track.preferredTransform;
            CGRect r = CGRectApplyAffineTransform(CGRectMake(0, 0, natural.width, natural.height), t);
            return CGSizeMake(fabs(r.size.width), fabs(r.size.height));
        };

        auto buildComposition = ^AVMutableVideoComposition *() {
            CGSize srcSize = transformedSize(videoTrack);
            CGFloat scale = std::min(static_cast<CGFloat>(options.width) / srcSize.width,
                                    static_cast<CGFloat>(options.height) / srcSize.height);
            CGFloat newW = srcSize.width * scale;
            CGFloat newH = srcSize.height * scale;
            CGFloat tx = (options.width - newW) / 2.0;
            CGFloat ty = (options.height - newH) / 2.0;

            CGAffineTransform t = videoTrack.preferredTransform;
            CGAffineTransform scaled = CGAffineTransformScale(t, scale, scale);
            CGAffineTransform translated = CGAffineTransformTranslate(scaled, tx / scale, ty / scale);

            AVMutableVideoCompositionLayerInstruction *layerInstruction =
                [AVMutableVideoCompositionLayerInstruction videoCompositionLayerInstructionWithAssetTrack:videoTrack];
            [layerInstruction setTransform:translated atTime:kCMTimeZero];

            AVMutableVideoCompositionInstruction *instruction = [AVMutableVideoCompositionInstruction videoCompositionInstruction];
            instruction.timeRange = CMTimeRangeMake(kCMTimeZero, asset.duration);
            instruction.layerInstructions = @[ layerInstruction ];

            AVMutableVideoComposition *composition = [AVMutableVideoComposition videoComposition];
            composition.renderSize = CGSizeMake(options.width, options.height);
            composition.frameDuration = CMTimeMake(1, static_cast<int32_t>(std::round(nominalFps)));
            composition.instructions = @[ instruction ];
            return composition;
        };

        NDIlib_send_create_t create_desc = {0};
        create_desc.p_ndi_name = options.name.c_str();
        create_desc.p_groups = nullptr;
        create_desc.clock_video = true;
        create_desc.clock_audio = false;

        if (!NDIlib_initialize()) {
            std::cerr << "NDIlib_initialize failed.\n";
            return false;
        }

        NDIlib_send_instance_t ndi_sender = NDIlib_send_create(&create_desc);
        if (!ndi_sender) {
            std::cerr << "NDIlib_send_create failed.\n";
            NDIlib_destroy();
            return false;
        }

        std::cout << "Streaming \"" << options.file << "\" as NDI source \"" << options.name << "\""
                  << (options.loop ? " (looping)" : "") << "...\n";

        bool success = true;
        int stride = options.width * 4;
        size_t buffer_size = stride * options.height;
        auto blend_buffer = std::make_unique<uint8_t[]>(buffer_size);

        auto send_video_frame = [&](CVPixelBufferRef pixelBuffer, double fps) {
            CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

            int width = static_cast<int>(CVPixelBufferGetWidth(pixelBuffer));
            int height = static_cast<int>(CVPixelBufferGetHeight(pixelBuffer));
            int src_stride = static_cast<int>(CVPixelBufferGetBytesPerRow(pixelBuffer));
            void *src_data = CVPixelBufferGetBaseAddress(pixelBuffer);

            // Copy to blend buffer if blending is needed
            uint8_t *frame_data = static_cast<uint8_t *>(src_data);
            if (options.blend_left > 0.0 || options.blend_right > 0.0 ||
                options.blend_top > 0.0 || options.blend_bottom > 0.0) {
                memcpy(blend_buffer.get(), src_data, std::min(buffer_size, (size_t)(src_stride * height)));
                apply_screen_blend(blend_buffer.get(), width, height, src_stride, options);
                frame_data = blend_buffer.get();
            }

            NDIlib_video_frame_v2_t ndi_frame;
            ndi_frame.xres = width;
            ndi_frame.yres = height;
            ndi_frame.FourCC = NDIlib_FourCC_type_BGRA;
            ndi_frame.frame_rate_N = static_cast<int>(fps * 1000.0);
            ndi_frame.frame_rate_D = 1000;
            ndi_frame.picture_aspect_ratio = static_cast<float>(width) / static_cast<float>(height);
            ndi_frame.frame_format_type = NDIlib_frame_format_type_progressive;
            ndi_frame.p_data = frame_data;
            ndi_frame.line_stride_in_bytes = src_stride;
            ndi_frame.timecode = NDIlib_send_timecode_synthesize;
            ndi_frame.p_metadata = nullptr;
            ndi_frame.timestamp = NDIlib_send_timecode_synthesize;

            NDIlib_send_send_video_v2(ndi_sender, &ndi_frame);

            CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
        };

        while (!g_should_stop.load()) {
            NSError *error = nil;
            AVAssetReader *reader = [AVAssetReader assetReaderWithAsset:asset error:&error];
            if (!reader) {
                std::cerr << "Failed to create AVAssetReader: "
                          << (error ? [[error localizedDescription] UTF8String] : "unknown error") << "\n";
                success = false;
                break;
            }

            AVMutableVideoComposition *composition = buildComposition();

            NSDictionary *outputSettings = @{
                (id)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_32BGRA)
            };
            AVAssetReaderVideoCompositionOutput *output =
                [AVAssetReaderVideoCompositionOutput assetReaderVideoCompositionOutputWithVideoTracks:@[ videoTrack ]
                                                                                    videoSettings:outputSettings];
            output.videoComposition = composition;
            output.alwaysCopiesSampleData = NO;

            if (![reader canAddOutput:output]) {
                std::cerr << "Cannot add reader output.\n";
                success = false;
                break;
            }
            [reader addOutput:output];

            if (![reader startReading]) {
                NSError *readerError = reader.error;
                const char *errStr = readerError ? readerError.localizedDescription.UTF8String : "unknown";
                std::cerr << "Failed to start reading: " << errStr << "\n";
                success = false;
                break;
            }

            double lastPts = -1.0;
            while (!g_should_stop.load() && reader.status == AVAssetReaderStatusReading) {
                @autoreleasepool {
                    // Handle pause state
                    while (g_playback_state.load() == PlaybackState::PAUSED && !g_should_stop.load()) {
                        std::this_thread::sleep_for(std::chrono::milliseconds(100));
                    }

                    if (g_should_stop.load()) break;

                    CMSampleBufferRef sample = [output copyNextSampleBuffer];
                    if (!sample) {
                        break; // EOF
                    }

                    CMTime pts = CMSampleBufferGetOutputPresentationTimeStamp(sample);
                    double ptsSeconds = CMTimeGetSeconds(pts);
                    if (lastPts >= 0.0) {
                        double delta = ptsSeconds - lastPts;
                        if (delta > 0.0 && delta < 5.0) {
                            std::this_thread::sleep_for(std::chrono::duration<double>(delta));
                        }
                    }
                    lastPts = ptsSeconds;

                    CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(sample);
                    if (imageBuffer) {
                        send_video_frame(imageBuffer, nominalFps);
                    }

                    CFRelease(sample);
                }
            }

            if (g_should_stop.load()) {
                break;
            }

            if (reader.status == AVAssetReaderStatusFailed) {
                NSError *readerError = reader.error;
                const char *errStr = readerError ? readerError.localizedDescription.UTF8String : "unknown";
                std::cerr << "Reader failed: " << errStr << "\n";
                success = false;
                break;
            }

            if (!options.loop) {
                break;
            }
        }

        std::cout << "Stopping video sender...\n";
        NDIlib_send_destroy(ndi_sender);
        NDIlib_destroy();
        return success;
    }
}

static bool stream_ndi_source(const StreamOptions& options) {
    if (!NDIlib_initialize()) {
        std::cerr << "NDIlib_initialize failed.\n";
        return false;
    }

    // Create finder to locate NDI sources
    NDIlib_find_create_t find_create_desc = {0};
    find_create_desc.show_local_sources = true;
    find_create_desc.p_groups = nullptr;

    NDIlib_find_instance_t ndi_find = NDIlib_find_create_v2(&find_create_desc);
    if (!ndi_find) {
        std::cerr << "NDIlib_find_create_v2 failed.\n";
        NDIlib_destroy();
        return false;
    }

    std::cout << "Searching for NDI source: \"" << options.ndi_source_name << "\"...\n";

    // Wait for sources (up to 10 seconds)
    const NDIlib_source_t* p_sources = nullptr;
    uint32_t no_sources = 0;
    bool found = false;
    NDIlib_source_t selected_source;

    for (int i = 0; i < 100 && !found; i++) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        p_sources = NDIlib_find_get_current_sources(ndi_find, &no_sources);

        for (uint32_t j = 0; j < no_sources; j++) {
            std::string source_name = p_sources[j].p_ndi_name;
            if (source_name.find(options.ndi_source_name) != std::string::npos) {
                selected_source = p_sources[j];
                found = true;
                std::cout << "Found NDI source: " << p_sources[j].p_ndi_name << "\n";
                break;
            }
        }
    }

    if (!found) {
        std::cerr << "NDI source \"" << options.ndi_source_name << "\" not found.\n";
        std::cerr << "Available sources:\n";
        p_sources = NDIlib_find_get_current_sources(ndi_find, &no_sources);
        for (uint32_t i = 0; i < no_sources; i++) {
            std::cerr << "  - " << p_sources[i].p_ndi_name << "\n";
        }
        NDIlib_find_destroy(ndi_find);
        NDIlib_destroy();
        return false;
    }

    // Create receiver
    NDIlib_recv_create_v3_t recv_create_desc = {0};
    recv_create_desc.source_to_connect_to = selected_source;
    recv_create_desc.color_format = NDIlib_recv_color_format_BGRX_BGRA;
    recv_create_desc.bandwidth = NDIlib_recv_bandwidth_highest;

    NDIlib_recv_instance_t ndi_recv = NDIlib_recv_create_v3(&recv_create_desc);
    if (!ndi_recv) {
        std::cerr << "NDIlib_recv_create_v3 failed.\n";
        NDIlib_find_destroy(ndi_find);
        NDIlib_destroy();
        return false;
    }

    // Create sender for output
    NDIlib_send_create_t send_create_desc = {0};
    send_create_desc.p_ndi_name = options.name.c_str();
    send_create_desc.p_groups = nullptr;
    send_create_desc.clock_video = true;
    send_create_desc.clock_audio = false;

    NDIlib_send_instance_t ndi_sender = NDIlib_send_create(&send_create_desc);
    if (!ndi_sender) {
        std::cerr << "NDIlib_send_create failed.\n";
        NDIlib_recv_destroy(ndi_recv);
        NDIlib_find_destroy(ndi_find);
        NDIlib_destroy();
        return false;
    }

    std::cout << "Receiving from \"" << selected_source.p_ndi_name << "\"\n";
    std::cout << "Re-transmitting as \"" << options.name << "\"\n";

    // Allocate buffer for edge blending
    int stride = options.width * 4;
    size_t buffer_size = stride * options.height;
    auto blend_buffer = std::make_unique<uint8_t[]>(buffer_size);
    bool needs_blend = (options.blend_left > 0.0 || options.blend_right > 0.0 ||
                       options.blend_top > 0.0 || options.blend_bottom > 0.0);

    // Receive and retransmit loop
    while (!g_should_stop.load()) {
        NDIlib_video_frame_v2_t video_frame;
        NDIlib_audio_frame_v2_t audio_frame;
        NDIlib_metadata_frame_t metadata_frame;

        switch (NDIlib_recv_capture_v2(ndi_recv, &video_frame, &audio_frame, &metadata_frame, 1000)) {
            case NDIlib_frame_type_video: {
                if (g_playback_state.load() == PlaybackState::PLAYING) {
                    // Apply edge blending if needed
                    if (needs_blend) {
                        // Copy frame data to blend buffer
                        size_t copy_size = std::min(buffer_size, (size_t)(video_frame.line_stride_in_bytes * video_frame.yres));
                        memcpy(blend_buffer.get(), video_frame.p_data, copy_size);

                        // Apply blend
                        apply_screen_blend(blend_buffer.get(), video_frame.xres, video_frame.yres,
                                         video_frame.line_stride_in_bytes, options);

                        // Update frame pointer
                        video_frame.p_data = blend_buffer.get();
                    }

                    // Send frame
                    NDIlib_send_send_video_v2(ndi_sender, &video_frame);
                }

                // Free the frame
                NDIlib_recv_free_video_v2(ndi_recv, &video_frame);
                break;
            }

            case NDIlib_frame_type_audio:
                NDIlib_recv_free_audio_v2(ndi_recv, &audio_frame);
                break;

            case NDIlib_frame_type_metadata:
                NDIlib_recv_free_metadata(ndi_recv, &metadata_frame);
                break;

            case NDIlib_frame_type_none:
                // No data
                break;

            case NDIlib_frame_type_error:
                std::cerr << "NDI receiver error\n";
                break;
        }
    }

    std::cout << "Stopping NDI source retransmit...\n";
    NDIlib_send_destroy(ndi_sender);
    NDIlib_recv_destroy(ndi_recv);
    NDIlib_find_destroy(ndi_find);
    NDIlib_destroy();
    return true;
}

static void print_usage(const char *argv0) {
    std::cerr << "Usage: " << argv0 << " [options]\n"
              << "Options:\n"
              << "  --name <name>          NDI source name (default: RocKontrol Media)\n"
              << "  --mode <type>          Stream mode: video, pattern, grid, ndi_source, blank\n"
              << "  --file <path>          Video file path (for video mode)\n"
              << "  --pattern <type>       Pattern type: gradient, grid, smpte, checkerboard\n"
              << "  --ndi-source <name>    NDI source to receive and retransmit\n"
              << "  --color <R,G,B>        Solid color RGB 0-255 (for blank mode, default: 0,0,0)\n"
              << "  --width <n>            Output width (default: 1920)\n"
              << "  --height <n>           Output height (default: 1080)\n"
              << "  --fps <n>              Frame rate (default: 30.0)\n"
              << "  --loop                 Loop video (default: true)\n"
              << "  --no-loop              Disable looping\n"
              << "  --blend-left <0-1>     Left edge blend amount\n"
              << "  --blend-right <0-1>    Right edge blend amount\n"
              << "  --blend-top <0-1>      Top edge blend amount\n"
              << "  --blend-bottom <0-1>   Bottom edge blend amount\n";
}

static bool parse_args(int argc, char *argv[], StreamOptions &out) {
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--name" && i + 1 < argc) {
            out.name = argv[++i];
        } else if (arg == "--mode" && i + 1 < argc) {
            std::string mode = argv[++i];
            if (mode == "video") out.mode = StreamMode::VIDEO;
            else if (mode == "pattern") out.mode = StreamMode::TEST_PATTERN;
            else if (mode == "grid") out.mode = StreamMode::TEST_GRID;
            else if (mode == "ndi_source") out.mode = StreamMode::NDI_SOURCE;
            else if (mode == "blank") out.mode = StreamMode::BLANK;
        } else if (arg == "--file" && i + 1 < argc) {
            out.file = argv[++i];
        } else if (arg == "--pattern" && i + 1 < argc) {
            out.pattern_type = argv[++i];
        } else if (arg == "--ndi-source" && i + 1 < argc) {
            out.ndi_source_name = argv[++i];
        } else if (arg == "--color" && i + 1 < argc) {
            // Parse R,G,B format
            std::string color_str = argv[++i];
            int r, g, b;
            if (sscanf(color_str.c_str(), "%d,%d,%d", &r, &g, &b) == 3) {
                out.blank_r = static_cast<uint8_t>(std::clamp(r, 0, 255));
                out.blank_g = static_cast<uint8_t>(std::clamp(g, 0, 255));
                out.blank_b = static_cast<uint8_t>(std::clamp(b, 0, 255));
            }
        } else if (arg == "--width" && i + 1 < argc) {
            out.width = std::atoi(argv[++i]);
        } else if (arg == "--height" && i + 1 < argc) {
            out.height = std::atoi(argv[++i]);
        } else if (arg == "--fps" && i + 1 < argc) {
            out.fps = std::atof(argv[++i]);
        } else if (arg == "--loop") {
            out.loop = true;
        } else if (arg == "--no-loop") {
            out.loop = false;
        } else if (arg == "--blend-left" && i + 1 < argc) {
            out.blend_left = std::atof(argv[++i]);
        } else if (arg == "--blend-right" && i + 1 < argc) {
            out.blend_right = std::atof(argv[++i]);
        } else if (arg == "--blend-top" && i + 1 < argc) {
            out.blend_top = std::atof(argv[++i]);
        } else if (arg == "--blend-bottom" && i + 1 < argc) {
            out.blend_bottom = std::atof(argv[++i]);
        } else {
            std::cerr << "Unknown argument: " << arg << "\n";
            return false;
        }
    }

    if (out.mode == StreamMode::VIDEO && out.file.empty()) {
        std::cerr << "Video mode requires --file argument\n";
        return false;
    }

    if (out.mode == StreamMode::NDI_SOURCE && out.ndi_source_name.empty()) {
        std::cerr << "NDI source mode requires --ndi-source argument\n";
        return false;
    }

    return true;
}

int main(int argc, char *argv[]) {
    std::signal(SIGINT, handle_signal);
    std::signal(SIGTERM, handle_signal);

    StreamOptions options;
    if (!parse_args(argc, argv, options)) {
        print_usage(argv[0]);
        return 1;
    }

    bool success = false;
    if (options.mode == StreamMode::VIDEO) {
        success = stream_video(options);
    } else if (options.mode == StreamMode::NDI_SOURCE) {
        success = stream_ndi_source(options);
    } else if (options.mode == StreamMode::BLANK) {
        success = stream_blank(options);
    } else {
        success = stream_test_pattern(options);
    }

    return success ? 0 : 1;
}
