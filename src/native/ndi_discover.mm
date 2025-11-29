#include <cstddef>
#include <Processing.NDI.Lib.h>
#include <iostream>
#include <chrono>
#include <thread>

int main() {
    if (!NDIlib_initialize()) {
        std::cerr << "Failed to initialize NDI\n";
        return 1;
    }

    // Create finder
    NDIlib_find_create_t find_create_desc = {0};
    find_create_desc.show_local_sources = true;
    find_create_desc.p_groups = nullptr;

    NDIlib_find_instance_t ndi_find = NDIlib_find_create_v2(&find_create_desc);
    if (!ndi_find) {
        std::cerr << "Failed to create NDI finder\n";
        NDIlib_destroy();
        return 1;
    }

    // Wait for sources (5 seconds)
    std::this_thread::sleep_for(std::chrono::seconds(5));

    // Get sources
    uint32_t no_sources = 0;
    const NDIlib_source_t* p_sources = NDIlib_find_get_current_sources(ndi_find, &no_sources);

    // Output as JSON array
    std::cout << "[";
    for (uint32_t i = 0; i < no_sources; i++) {
        if (i > 0) std::cout << ",";
        std::cout << "\n  {";
        std::cout << "\n    \"name\": \"" << p_sources[i].p_ndi_name << "\",";
        std::cout << "\n    \"url\": \"" << (p_sources[i].p_url_address ? p_sources[i].p_url_address : "") << "\"";
        std::cout << "\n  }";
    }
    std::cout << "\n]\n";

    NDIlib_find_destroy(ndi_find);
    NDIlib_destroy();
    return 0;
}
