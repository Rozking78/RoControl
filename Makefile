SDK_ROOT=/Library/NDI SDK for Apple
NDI_INCLUDE=$(SDK_ROOT)/include
NDI_LIB=$(SDK_ROOT)/lib/macOS

CXX=clang++
CXXFLAGS=-std=c++17 -Wall -Wextra -fobjc-arc -I"$(NDI_INCLUDE)"
LDFLAGS=-L"$(NDI_LIB)" -lndi \
	-framework AVFoundation -framework CoreMedia -framework CoreVideo -framework Foundation -framework CoreGraphics \
	-Wl,-rpath,"$(NDI_LIB)"

BIN_DIR=bin
SRC_DIR=src/native

all: $(BIN_DIR)/media_sender $(BIN_DIR)/ndi_discover

$(BIN_DIR):
	mkdir -p $(BIN_DIR)

$(BIN_DIR)/media_sender: $(SRC_DIR)/media_sender.mm | $(BIN_DIR)
	$(CXX) $(CXXFLAGS) $< -o $@ $(LDFLAGS)

$(BIN_DIR)/ndi_discover: $(SRC_DIR)/ndi_discover.mm | $(BIN_DIR)
	$(CXX) $(CXXFLAGS) $< -o $@ $(LDFLAGS)

clean:
	rm -rf $(BIN_DIR)

.PHONY: all clean
