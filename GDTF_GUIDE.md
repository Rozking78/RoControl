# GDTF Integration Guide

## What is GDTF?

GDTF (General Device Type Format) is an open standard created by MA Lighting for describing entertainment lighting devices. It includes:

- **DMX channel layouts** for all fixture modes
- **3D geometry** and visualization data
- **Physical properties** (weight, power consumption)
- **Wheel definitions** (color, gobo wheels)
- **DMX protocol information**

## Getting GDTF Files

### Official GDTF Share
https://gdtf-share.com

**Popular Manufacturers Available:**
- Robe (Robin series, BMFL, Esprite)
- Martin by Harman (MAC series)
- Clay Paky (Sharpy, Mythos, Scenius)
- Chauvet Professional (Rogue, Maverick)
- Elation Professional (Platinum, Artiste)
- ADJ (Vizi, Hydro series)
- GLP (impression X4)
- Ayrton (MagicPanel, Mistral)

### How to Download

1. Visit https://gdtf-share.com
2. Search for your fixture
3. Select the correct model and manufacturer
4. Click "Download" to get the `.gdtf` file
5. Save to your computer/Steam Deck

## GDTF File Structure

A `.gdtf` file is actually a ZIP archive containing:

```
fixture-name.gdtf
├── description.xml          # Main fixture definition
├── thumbnail.png           # Fixture image
├── models/
│   └── fixture_model.3ds   # 3D model files
└── wheels/
    ├── color_wheel_1.png   # Wheel textures
    └── gobo_wheel_1.png
```

### Key XML Elements in description.xml

```xml
<GDTF>
  <FixtureType Name="..." Manufacturer="...">
    <AttributeDefinitions>
      <!-- Defines what each DMX channel controls -->
      <Attributes>
        <Attribute Name="Dimmer" />
        <Attribute Name="Pan" />
        <Attribute Name="Tilt" />
        <Attribute Name="ColorRGB_Red" />
      </Attributes>
    </AttributeDefinitions>
    
    <DMXModes>
      <!-- Different channel modes (Basic, Standard, Extended) -->
      <DMXMode Name="Standard" Geometry="...">
        <DMXChannels>
          <DMXChannel Offset="1" Highlight="255/1">
            <LogicalChannel Attribute="Dimmer" />
          </DMXChannel>
          <DMXChannel Offset="2">
            <LogicalChannel Attribute="ColorRGB_Red" />
          </DMXChannel>
          <!-- More channels... -->
        </DMXChannels>
      </DMXMode>
    </DMXModes>
  </FixtureType>
</GDTF>
```

## Using GDTF in the Application

### 1. Import a GDTF File

```javascript
// Via the UI
Top Menu → Setup → Import GDTF
Select your .gdtf file

// Programmatically (future API)
import { invoke } from '@tauri-apps/api/tauri'

const fixtureType = await invoke('parse_gdtf_file', {
  filePath: '/path/to/fixture.gdtf'
})
```

### 2. Patch a Fixture from Library

After importing GDTF files, they appear in your fixture library:

```javascript
// Add fixture from library
const fixture = {
  id: 'fx1',
  name: 'Robe Robin 600',
  fixture_type: 'Robe@Robin_600_LED_Wash-Standard',
  dmx_address: 1,
  universe: 0,
  channel_count: 16,
  gdtf_file: 'Robe@Robin_600_LED_Wash.gdtf'
}

await invoke('add_fixture', { fixture })
```

### 3. Control Fixture Channels

The GDTF parser maps logical attributes to DMX channels:

```javascript
// Set dimmer (channel mapped automatically)
await invoke('set_fixture_channel', {
  fixtureId: 'fx1',
  channelOffset: 0,  // Dimmer
  value: 255
})

// Set color
await invoke('set_fixture_channel', {
  fixtureId: 'fx1',
  channelOffset: 1,  // Red
  value: 255
})
```

## Common Fixture Modes

### LED PAR (7-channel RGB)
| Ch | Function | Range |
|----|----------|-------|
| 1  | Dimmer   | 0-255 |
| 2  | Red      | 0-255 |
| 3  | Green    | 0-255 |
| 4  | Blue     | 0-255 |
| 5  | Strobe   | 0-255 |
| 6  | Programs | 0-255 |
| 7  | Speed    | 0-255 |

### Moving Head Spot (16-channel)
| Ch | Function      | Range |
|----|---------------|-------|
| 1  | Pan           | 0-255 |
| 2  | Pan Fine      | 0-255 |
| 3  | Tilt          | 0-255 |
| 4  | Tilt Fine     | 0-255 |
| 5  | Pan/Tilt Speed| 0-255 |
| 6  | Dimmer        | 0-255 |
| 7  | Shutter       | 0-255 |
| 8  | Color Wheel   | 0-255 |
| 9  | Gobo Wheel 1  | 0-255 |
| 10 | Gobo Rotate   | 0-255 |
| 11 | Prism         | 0-255 |
| 12 | Focus         | 0-255 |
| 13 | Frost         | 0-255 |
| 14 | Iris          | 0-255 |
| 15 | Zoom          | 0-255 |
| 16 | Control       | 0-255 |

### Moving Head Wash (18-channel RGBW)
| Ch | Function      | Range |
|----|---------------|-------|
| 1  | Pan           | 0-255 |
| 2  | Pan Fine      | 0-255 |
| 3  | Tilt          | 0-255 |
| 4  | Tilt Fine     | 0-255 |
| 5  | Pan/Tilt Speed| 0-255 |
| 6  | Dimmer        | 0-255 |
| 7  | Dimmer Fine   | 0-255 |
| 8  | Shutter       | 0-255 |
| 9  | Red           | 0-255 |
| 10 | Red Fine      | 0-255 |
| 11 | Green         | 0-255 |
| 12 | Green Fine    | 0-255 |
| 13 | Blue          | 0-255 |
| 14 | Blue Fine     | 0-255 |
| 15 | White         | 0-255 |
| 16 | White Fine    | 0-255 |
| 17 | Color Macro   | 0-255 |
| 18 | Zoom          | 0-255 |

## Advanced: Creating Custom GDTF Files

For fixtures not in the library, you can create your own GDTF files:

### Using GDTF Builder
1. Download GDTF Builder from gdtf-share.com
2. Create new fixture profile
3. Define DMX modes and channels
4. Export as .gdtf

### Manual Creation (Advanced)
Create `description.xml` with your fixture definition and zip it:

```bash
zip -r MyFixture@MyModel.gdtf description.xml thumbnail.png
```

## GDTF Resources

**Official Documentation:**
- GDTF Specification: https://gdtf-share.com/wiki/
- GDTF Builder: https://gdtf-share.com/gdtf-builder/

**Community:**
- GDTF Forum: https://forum.gdtf-share.com/
- GitHub: https://github.com/mvrdevelopment/spec

**Compatible Software:**
- MA Lighting grandMA3
- MA Lighting dot2
- Vectorworks
- Capture
- WYSIWYG

## Troubleshooting

### GDTF File Won't Import
- Ensure file extension is `.gdtf`
- Check file isn't corrupted (try unzipping manually)
- Verify XML structure is valid
- Some very old GDTF files may not be compatible

### Fixture Not Responding Correctly
- Verify DMX mode matches what's patched
- Check address is correct (fixture starts at that address)
- Ensure fixture is in DMX mode (not standalone)
- Check DMX termination on your DMX line

### Missing Attributes
- Some fixtures have multiple DMX modes - try different mode
- Update to latest GDTF file from manufacturer
- Create custom fixture profile if needed

## Next Steps

Once you have GDTF fixtures imported:
1. Patch them to your universes
2. Group similar fixtures together
3. Create color/position palettes
4. Build cues and sequences
5. Assign to executor faders

The GDTF system ensures compatibility across all lighting control software and hardware!
