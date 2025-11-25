import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import './App.css'
import GridLayout from './components/GridLayout'
import GamepadManager from './components/GamepadManager'
import OnScreenKeyboard from './components/OnScreenKeyboard'
import MasterFader from './components/MasterFader'
import ProgrammerBar from './components/ProgrammerBar'
import CLI from './components/CLI'
import { initializeAutoKeyboard } from './utils/autoKeyboard'
import { getDMXOutputManager } from './utils/dmxOutputManager'
import { CLIDispatcher } from './utils/cliDispatcher'
import VideoPlaybackManager from './utils/videoPlaybackManager'
import { ArtNetConfig } from './utils/artnet'
import { SACNConfig } from './utils/sacn'
import ProtocolSettings from './components/views/ProtocolSettings'

// New feature imports
import SteamDeckIntegration from './components/SteamDeckIntegration'
import ProgramTimeControl from './components/ProgramTimeControl'
import CueExecutorTimeControl from './components/CueExecutorTimeControl'
import ClocksConfigWindow from './components/ClocksConfigWindow'
import GroupHandleEditor from './components/GroupHandleEditor'
import { ClocksManager } from './utils/clocksManager'
import { GroupHandleManager } from './utils/groupHandleManager'

function App() {
  const [fixtures, setFixtures] = useState([])
  const [selectedFixtures, setSelectedFixtures] = useState(new Set())
  const [encoderValues, setEncoderValues] = useState({
    dimmer: 0,
    pan: 128,
    tilt: 128,
    red: 0,
    green: 0,
    blue: 0,
  })
  const [faderValues, setFaderValues] = useState(Array(6).fill(0))
  const [artnetConfig, setArtnetConfig] = useState(() => {
    const saved = localStorage.getItem('dmx_artnet_config')
    return saved ? ArtNetConfig.fromJSON(JSON.parse(saved)) : new ArtNetConfig()
  })
  const [sacnConfig, setSacnConfig] = useState(() => {
    const saved = localStorage.getItem('dmx_sacn_config')
    return saved ? SACNConfig.fromJSON(JSON.parse(saved)) : new SACNConfig()
  })
  const [dmxProtocol, setDmxProtocol] = useState('artnet')
  const [isBlackout, setIsBlackout] = useState(false)
  const [networkInterfaces, setNetworkInterfaces] = useState([])
  const [selectedInterface, setSelectedInterface] = useState(() => {
    const saved = localStorage.getItem('dmx_selected_interface')
    return saved || 'all'
  })
  const [showSetup, setShowSetup] = useState(false)
  const [setupTab, setSetupTab] = useState('artnet') // 'artnet', 'patch', 'gamepad', or 'backup'
  const [gamepadMappings, setGamepadMappings] = useState(() => {
    const saved = localStorage.getItem('dmx_gamepad_mappings')
    return saved ? JSON.parse(saved) : {
      leftTrigger: 'Red',
      rightTrigger: 'Dimmer',
      leftBumper: 'Green',
      rightBumper: 'Blue',
      leftStickX: 'Pan',
      leftStickY: 'Tilt',
      rightStickX: 'None',
      rightStickY: 'None',
      buttonA: 'Select First Fixture',
      buttonB: 'Blackout',
      buttonX: 'Clear Selection',
      buttonY: 'Locate',
      buttonSelect: 'None',
      buttonStart: 'None',
      buttonL3: 'None',
      buttonR3: 'None',
      buttonL4: 'None',
      buttonR4: 'None',
      buttonL5: 'None',
      buttonR5: 'None',
      dpadUp: 'Increment',
      dpadDown: 'Decrement',
      dpadLeft: 'Previous Channel',
      dpadRight: 'Next Channel'
    }
  })
  const [incrementSpeed, setIncrementSpeed] = useState('normal') // 'slow' or 'normal'
  const [focusedChannel, setFocusedChannel] = useState(0) // Index of currently focused channel
  const lastDpadPress = useRef({ up: 0, down: 0, left: 0, right: 0 })
  const dpadHoldStart = useRef({ up: 0, down: 0, left: 0, right: 0 })
  const [gamepadDebug, setGamepadDebug] = useState({ connected: false, buttons: [], axes: [] })
  const [showGamepadDebug, setShowGamepadDebug] = useState(true)
  const [savedShows, setSavedShows] = useState([])
  const [newShowName, setNewShowName] = useState('')
  const [recordedCues, setRecordedCues] = useState(() => {
    const saved = localStorage.getItem('dmx_recorded_cues')
    return saved ? JSON.parse(saved) : []
  })
  const [isRecording, setIsRecording] = useState(false)

  // New feature states for FlexWindow, Programmer Pro, etc.
  const [activeFeatureSet, setActiveFeatureSet] = useState('color')
  const [activeParameters, setActiveParameters] = useState(new Set())
  const [recordMode, setRecordMode] = useState(false)
  const [recordMessage, setRecordMessage] = useState('Ready to record - click target')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [keyboardMode, setKeyboardMode] = useState('keyboard')
  const [keyboardTarget, setKeyboardTarget] = useState(null)
  const [masterFaderValue, setMasterFaderValue] = useState(255)

  const [gridEditMode, setGridEditMode] = useState(false)
  const [currentGridLayout, setCurrentGridLayout] = useState(null)
  const [quickViews, setQuickViews] = useState(() => {
    const saved = localStorage.getItem('dmx_quick_views')
    return saved ? JSON.parse(saved) : [null, null, null, null]
  })

  // Refs for gamepad to access current state (fixes closure problem)
  const selectedFixturesRef = useRef(selectedFixtures)
  const fixturesRef = useRef(fixtures)
  const encoderValuesRef = useRef(encoderValues)
  const focusedChannelRef = useRef(focusedChannel)
  const gamepadMappingsRef = useRef(gamepadMappings)
  const incrementSpeedRef = useRef(incrementSpeed)
  const recordModeRef = useRef(recordMode)

  // Video playback manager instance
  const videoPlaybackManager = useRef(null)
  if (!videoPlaybackManager.current) {
    videoPlaybackManager.current = new VideoPlaybackManager()
  }

  // New feature managers
  const [clocksManager] = useState(() => new ClocksManager())
  const [groupHandleManager] = useState(() => new GroupHandleManager())

  // New feature states
  const [programTime, setProgramTime] = useState(0)
  const [cueTime, setCueTime] = useState(3)
  const [executorTime, setExecutorTime] = useState(3)
  const [showClocksWindow, setShowClocksWindow] = useState(false)
  const [showGroupHandleEditor, setShowGroupHandleEditor] = useState(false)
  const [editingGroupHandle, setEditingGroupHandle] = useState(null)
  const [activeWindow, setActiveWindow] = useState(4) // Current window ID for Steam Deck
  const [newFixture, setNewFixture] = useState({
    id: '',
    name: '',
    fixture_type: 'Tree Par',
    dmx_address: 1,
    universe: 0,
    channel_count: 6,
    quantity: 1
  })

  // Comprehensive gamepad command options
  const GAMEPAD_COMMAND_OPTIONS = [
    'None',
    // System Commands
    'Setup',
    'Blackout',
    'Clear',
    'Clear All',
    'Locate',
    'Highlight',
    // Selection Commands
    'Select First Fixture',
    'Previous Fixture',
    'Next Fixture',
    'Select All',
    'Clear Selection',
    // Recording Commands
    'Record Cue',
    'Record Preset',
    'Toggle Record',
    'Update',
    // Feature Set Commands
    'Intensity',
    'Position',
    'Color',
    'Focus',
    'Gobo',
    'Beam',
    // Preset Commands
    'At Full',
    'At 50',
    'At 0',
    // Fan Commands
    'Fan Left',
    'Fan Right',
    'Fan Center',
    // Cue Commands
    'Go Cue 1',
    'Go Cue 2',
    'Go Cue 3',
    'Go Cue 4',
    'Go Cue 5',
    // Executor Commands
    'Go Exec 1',
    'Go Exec 2',
    'Go Exec 3',
    // Time Commands
    'Time 0',
    'Time 1',
    'Time 3',
    'Time 5',
    // Group Commands
    'Group 1',
    'Group 2',
    'Group 3',
    // View Commands
    'Toggle Edit Mode',
    'Toggle Keyboard',
  ]

  // Fixture profiles with channel definitions
  const fixtureProfiles = {
    'Tree Par': {
      channels: [
        { name: 'Red', offset: 0, type: 'color' },
        { name: 'Green', offset: 1, type: 'color' },
        { name: 'Blue', offset: 2, type: 'color' },
        { name: 'White', offset: 3, type: 'color' },
        { name: 'Amber', offset: 4, type: 'color' },
        { name: 'UV', offset: 5, type: 'color' }
      ],
      count: 6
    },
    'LED PAR': {
      channels: [
        { name: 'Dimmer', offset: 0, type: 'intensity' },
        { name: 'Red', offset: 1, type: 'color' },
        { name: 'Green', offset: 2, type: 'color' },
        { name: 'Blue', offset: 3, type: 'color' },
        { name: 'Pan', offset: 4, type: 'position' },
        { name: 'Tilt', offset: 5, type: 'position' },
        { name: 'Strobe', offset: 6, type: 'effect' }
      ],
      count: 7
    },
    'Moving Head': {
      channels: [
        { name: 'Dimmer', offset: 0, type: 'intensity' },
        { name: 'Red', offset: 1, type: 'color' },
        { name: 'Green', offset: 2, type: 'color' },
        { name: 'Blue', offset: 3, type: 'color' },
        { name: 'Pan', offset: 4, type: 'position' },
        { name: 'Pan Fine', offset: 5, type: 'position' },
        { name: 'Tilt', offset: 6, type: 'position' },
        { name: 'Tilt Fine', offset: 7, type: 'position' },
        { name: 'Strobe', offset: 8, type: 'effect' },
        { name: 'Gobo', offset: 9, type: 'effect' },
        { name: 'Prism', offset: 10, type: 'effect' }
      ],
      count: 16
    },
    'Dimmer': {
      channels: [
        { name: 'Dimmer', offset: 0, type: 'intensity' }
      ],
      count: 1
    }
  }

  // Keep refs in sync with state for gamepad access
  useEffect(() => { selectedFixturesRef.current = selectedFixtures }, [selectedFixtures])
  useEffect(() => { fixturesRef.current = fixtures }, [fixtures])
  useEffect(() => { encoderValuesRef.current = encoderValues }, [encoderValues])
  useEffect(() => { focusedChannelRef.current = focusedChannel }, [focusedChannel])
  useEffect(() => { gamepadMappingsRef.current = gamepadMappings }, [gamepadMappings])
  useEffect(() => { incrementSpeedRef.current = incrementSpeed }, [incrementSpeed])
  useEffect(() => { recordModeRef.current = recordMode }, [recordMode])

  // Save protocol configs to localStorage
  useEffect(() => {
    if (artnetConfig) {
      localStorage.setItem('dmx_artnet_config', JSON.stringify(artnetConfig.toJSON()))
    }
  }, [artnetConfig])

  useEffect(() => {
    if (sacnConfig) {
      localStorage.setItem('dmx_sacn_config', JSON.stringify(sacnConfig.toJSON()))
    }
  }, [sacnConfig])

  // Protocol configs removed temporarily due to crash

  // Initialize auto-keyboard for touch input
  useEffect(() => {
    const autoKeyboard = initializeAutoKeyboard((show, mode, inputElement) => {
      if (show) {
        setKeyboardMode(mode)
        setShowKeyboard(true)
        setKeyboardTarget(inputElement)
      }
    })
    return () => autoKeyboard.destroy()
  }, [])

  // Keyboard shortcut for Record mode (R key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        if (recordMode) {
          exitRecordMode()
        } else {
          enterRecordMode()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [recordMode])

  // Initialize with no fixtures
  useEffect(() => {
    loadFixtures()
    setupGamepadListener()
    loadSavedShows()
    loadNetworkInterfaces()
  }, [])

  const loadNetworkInterfaces = async () => {
    try {
      const interfaces = await invoke('get_network_interfaces')
      setNetworkInterfaces(interfaces)
    } catch (error) {
      console.error('Error loading network interfaces:', error)
    }
  }

  const loadSavedShows = () => {
    try {
      const stored = localStorage.getItem('dmx_saved_shows')
      if (stored) {
        setSavedShows(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading saved shows:', error)
    }
  }

  const saveShow = () => {
    if (!newShowName.trim()) {
      alert('Please enter a show name')
      return
    }

    const show = {
      name: newShowName,
      timestamp: new Date().toISOString(),
      selectedFixtures: Array.from(selectedFixtures),
      encoderValues: { ...encoderValues },
      faderValues: [...faderValues]
    }

    const updated = [...savedShows.filter(s => s.name !== newShowName), show]
    setSavedShows(updated)
    localStorage.setItem('dmx_saved_shows', JSON.stringify(updated))
    setNewShowName('')
    alert(`Show "${newShowName}" saved successfully!`)
  }

  const recallShow = (show) => {
    setSelectedFixtures(new Set(show.selectedFixtures))
    setEncoderValues(show.encoderValues)
    setFaderValues(show.faderValues)

    // Apply the encoder values to fixtures
    for (const fixtureId of show.selectedFixtures) {
      const fixture = fixtures.find(f => f.id === fixtureId)
      if (!fixture) continue

      const profile = fixtureProfiles[fixture.fixture_type]
      if (!profile) continue

      // Apply all stored encoder values
      Object.entries(show.encoderValues).forEach(async ([param, value]) => {
        const channel = profile.channels.find(ch =>
          ch.name.toLowerCase().replace(/\s+/g, '_') === param
        )
        if (channel) {
          try {
            await invoke('set_fixture_channel', {
              fixtureId,
              channelOffset: channel.offset,
              value: Math.round(value),
            })
          } catch (error) {
            console.error('Error recalling fixture channel:', error)
          }
        }
      })
    }

    alert(`Show "${show.name}" recalled!`)
  }

  const deleteShow = (showName) => {
    if (confirm(`Delete show "${showName}"?`)) {
      const updated = savedShows.filter(s => s.name !== showName)
      setSavedShows(updated)
      localStorage.setItem('dmx_saved_shows', JSON.stringify(updated))
    }
  }

  const loadFixtures = async () => {
    try {
      const loadedFixtures = await invoke('get_fixtures')
      setFixtures(loadedFixtures)
    } catch (error) {
      console.error('Error loading fixtures:', error)
    }
  }

  const toggleFixtureSelection = (fixtureId) => {
    const newSelection = new Set(selectedFixtures)
    if (newSelection.has(fixtureId)) {
      newSelection.delete(fixtureId)
    } else {
      newSelection.add(fixtureId)
    }
    setSelectedFixtures(newSelection)
  }

  const setEncoderValue = async (param, value) => {
    setEncoderValues(prev => ({ ...prev, [param]: value }))

    // Apply to all selected fixtures
    for (const fixtureId of selectedFixtures) {
      try {
        const fixture = fixtures.find(f => f.id === fixtureId)
        if (!fixture) continue

        const profile = fixtureProfiles[fixture.fixture_type]
        if (!profile) continue

        // Find the channel by name
        const channel = profile.channels.find(ch =>
          ch.name.toLowerCase().replace(/\s+/g, '_') === param
        )

        if (channel) {
          await invoke('set_fixture_channel', {
            fixtureId,
            channelOffset: channel.offset,
            value: Math.round(value),
          })
        }
      } catch (error) {
        console.error('Error setting fixture channel:', error)
      }
    }
  }

  const handleBlackout = async () => {
    try {
      await invoke('blackout')
      setIsBlackout(true)
      setTimeout(() => setIsBlackout(false), 300)
    } catch (error) {
      console.error('Error triggering blackout:', error)
    }
  }

  const handleLocate = () => {
    // Set all selected fixtures to full white
    availableChannels.forEach(channel => {
      const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_')
      const nameLower = channel.name.toLowerCase()

      // Set color channels to full
      if (nameLower.includes('red') || nameLower.includes('green') ||
          nameLower.includes('blue') || nameLower.includes('white')) {
        setEncoderValue(channelKey, 255)
      }
      // Set dimmer/intensity to 50%
      else if (nameLower.includes('dimmer') || nameLower.includes('intensity')) {
        setEncoderValue(channelKey, 128)
      }
    })
  }

  const handleClear = () => {
    // Just clear selection, not all parameters
    setSelectedFixtures(new Set())
  }

  const handleClearAll = () => {
    // Clear everything - selection and all parameters
    setSelectedFixtures(new Set())
    setEncoderValues({
      dimmer: 0,
      pan: 128,
      tilt: 128,
      red: 0,
      green: 0,
      blue: 0,
    })
  }

  const applyColorPalette = (color) => {
    // Find and set RGB channels if they exist
    const findAndSetChannel = (name, value) => {
      const channel = availableChannels.find(ch =>
        ch.name.toLowerCase().includes(name.toLowerCase())
      )
      if (channel) {
        const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_')
        setEncoderValue(channelKey, value)
      }
    }

    findAndSetChannel('red', color.r)
    findAndSetChannel('green', color.g)
    findAndSetChannel('blue', color.b)
  }

  const applyPresetValues = (values) => {
    // Apply all preset values to encoder values
    Object.entries(values).forEach(([key, value]) => {
      setEncoderValue(key, value)
    })
  }

  // Get available channels for selected fixtures
  const getAvailableChannels = () => {
    if (selectedFixtures.size === 0) {
      return []
    }

    // Get all selected fixtures
    const selectedFixturesList = fixtures.filter(f => selectedFixtures.has(f.id))

    if (selectedFixturesList.length === 0) {
      return []
    }

    // Find common channels across all selected fixtures
    const firstFixture = selectedFixturesList[0]
    const firstProfile = fixtureProfiles[firstFixture.fixture_type]

    if (!firstProfile) {
      return []
    }

    // Start with channels from first fixture
    const commonChannels = firstProfile.channels.filter(channel => {
      // Check if this channel exists in all other selected fixtures
      return selectedFixturesList.every(fixture => {
        const profile = fixtureProfiles[fixture.fixture_type]
        return profile && profile.channels.some(ch => ch.name === channel.name)
      })
    })

    return commonChannels
  }

  const availableChannels = getAvailableChannels()

  const handleArtnetConfig = async () => {
    try {
      await invoke('configure_artnet', { broadcastAddress: artnetConfig })
      await invoke('set_protocol', { protocol: dmxProtocol })

      // Set network interface
      const interfaceIp = selectedInterface === 'all' ? null : selectedInterface
      await invoke('set_network_interface', { interfaceIp })

      // Save to localStorage
      localStorage.setItem('dmx_selected_interface', selectedInterface)

      alert(`Protocol set to ${dmxProtocol.toUpperCase()} with broadcast: ${artnetConfig}\nInterface: ${selectedInterface === 'all' ? 'All interfaces' : selectedInterface}`)
    } catch (error) {
      console.error('Error configuring network:', error)
      alert('Error configuring network: ' + error)
    }
  }

  const handleAddFixture = async () => {
    // Validation
    if (!newFixture.id || !newFixture.id.trim()) {
      alert('Please enter a Fixture ID')
      return
    }
    if (!newFixture.name || !newFixture.name.trim()) {
      alert('Please enter a Fixture Name')
      return
    }

    const quantity = parseInt(newFixture.quantity) || 1
    const universe = parseInt(newFixture.universe) || 0
    const dmxAddress = parseInt(newFixture.dmx_address) || 1
    const channelCount = parseInt(newFixture.channel_count) || 1

    // Validate numbers
    if (isNaN(universe) || universe < 0 || universe > 255) {
      alert('Universe must be between 0 and 255')
      return
    }
    if (isNaN(dmxAddress) || dmxAddress < 1 || dmxAddress > 512) {
      alert('DMX Address must be between 1 and 512')
      return
    }
    if (isNaN(channelCount) || channelCount < 1 || channelCount > 32) {
      alert('Channel Count must be between 1 and 32')
      return
    }
    if (isNaN(quantity) || quantity < 1 || quantity > 100) {
      alert('Quantity must be between 1 and 100')
      return
    }

    try {
      // Add multiple fixtures with auto-incrementing addresses
      for (let i = 0; i < quantity; i++) {
        const fixtureToAdd = {
          id: quantity > 1 ? `${newFixture.id}${i + 1}` : newFixture.id,
          name: quantity > 1 ? `${newFixture.name} ${i + 1}` : newFixture.name,
          fixture_type: newFixture.fixture_type,
          dmx_address: dmxAddress + (i * channelCount),
          universe: universe,
          channel_count: channelCount
        }

        await invoke('add_fixture', { fixture: fixtureToAdd })
      }

      await loadFixtures()
      setNewFixture({
        id: '',
        name: '',
        fixture_type: 'Tree Par',
        dmx_address: 1,
        universe: 0,
        channel_count: 6,
        quantity: 1
      })

      if (quantity > 1) {
        alert(`${quantity} fixtures added successfully!`)
      } else {
        alert(`Fixture ${newFixture.name} added successfully!`)
      }
    } catch (error) {
      console.error('Error adding fixture:', error)
      const errorMsg = error.toString ? error.toString() : JSON.stringify(error)
      alert('Error patching fixture: ' + errorMsg)
    }
  }

  const handleDeleteFixture = async (fixtureId) => {
    if (confirm(`Delete fixture ${fixtureId}?`)) {
      // Note: Backend doesn't have delete yet, just remove from state
      setFixtures(fixtures.filter(f => f.id !== fixtureId))
      setSelectedFixtures(prev => {
        const newSet = new Set(prev)
        newSet.delete(fixtureId)
        return newSet
      })
    }
  }

  // Record a cue
  const handleRecordCue = () => {
    if (selectedFixtures.size === 0) {
      alert('Select fixtures before recording a cue')
      return
    }

    const cueName = prompt(`Enter cue name (Cue ${recordedCues.length + 1}):`, `Cue ${recordedCues.length + 1}`)
    if (!cueName) return

    const newCue = {
      name: cueName,
      timestamp: Date.now(),
      selectedFixtures: Array.from(selectedFixtures),
      encoderValues: { ...encoderValues },
      faderValues: [...faderValues]
    }

    const updated = [...recordedCues, newCue]
    setRecordedCues(updated)
    localStorage.setItem('dmx_recorded_cues', JSON.stringify(updated))

    setIsRecording(true)
    setTimeout(() => setIsRecording(false), 500) // Flash record indicator
    alert(`Cue "${cueName}" recorded!`)
  }

  // Recall a cue
  const handleRecallCue = (cue) => {
    // Restore selection
    setSelectedFixtures(new Set(cue.selectedFixtures))

    // Restore encoder values
    setEncoderValues(cue.encoderValues)
    Object.entries(cue.encoderValues).forEach(([key, value]) => {
      setEncoderValue(key, value)
    })

    // Restore fader values
    setFaderValues(cue.faderValues)
  }

  // Delete a cue
  const handleDeleteCue = (cueName) => {
    const updated = recordedCues.filter(c => c.name !== cueName)
    setRecordedCues(updated)
    localStorage.setItem('dmx_recorded_cues', JSON.stringify(updated))
  }

  // Execute gamepad action based on mapping
  const executeGamepadAction = (actionName) => {
    const fixtures = fixturesRef.current
    const selected = selectedFixturesRef.current

    switch (actionName) {
      // System Commands
      case 'Setup':
        setSetupTab('patch')
        setShowSetup(true)
        break
      case 'Blackout':
        handleBlackout()
        break
      case 'Clear':
      case 'Clear Selection':
        handleClear()
        break
      case 'Clear All':
        handleClear()
        setEncoderValues({
          dimmer: 0,
          pan: 128,
          tilt: 128,
          red: 0,
          green: 0,
          blue: 0,
        })
        break
      case 'Locate':
        handleLocate()
        break
      case 'Highlight':
        // Toggle highlight mode
        setActiveFeatureSet(prev => prev === 'highlight' ? 'intensity' : 'highlight')
        break

      // Selection Commands
      case 'Select First Fixture':
        if (fixtures.length > 0) {
          toggleFixtureSelection(fixtures[0].id)
        }
        break
      case 'Previous Fixture':
        if (fixtures.length > 0 && selected.size > 0) {
          const selectedArray = Array.from(selected)
          const currentId = selectedArray[0]
          const currentIndex = fixtures.findIndex(f => f.id === currentId)
          if (currentIndex > 0) {
            setSelectedFixtures(new Set([fixtures[currentIndex - 1].id]))
          }
        }
        break
      case 'Next Fixture':
        if (fixtures.length > 0 && selected.size > 0) {
          const selectedArray = Array.from(selected)
          const currentId = selectedArray[0]
          const currentIndex = fixtures.findIndex(f => f.id === currentId)
          if (currentIndex < fixtures.length - 1) {
            setSelectedFixtures(new Set([fixtures[currentIndex + 1].id]))
          }
        }
        break
      case 'Select All':
        setSelectedFixtures(new Set(fixtures.map(f => f.id)))
        break

      // Recording Commands
      case 'Record Cue':
        handleRecordCue()
        break
      case 'Record Preset':
        // Record to preset - default to color preset 1
        if (handleCLICommand) {
          handleCLICommand('record 3.1')
        }
        break
      case 'Toggle Record':
        if (recordModeRef.current) {
          exitRecordMode()
        } else {
          enterRecordMode()
        }
        break
      case 'Update':
        // Update current preset/cue
        if (handleCLICommand) {
          handleCLICommand('update')
        }
        break

      // Feature Set Commands
      case 'Intensity':
        setActiveFeatureSet('intensity')
        break
      case 'Position':
        setActiveFeatureSet('position')
        break
      case 'Color':
        setActiveFeatureSet('color')
        break
      case 'Focus':
        setActiveFeatureSet('focus')
        break
      case 'Gobo':
        setActiveFeatureSet('gobo')
        break
      case 'Beam':
        setActiveFeatureSet('beam')
        break

      // Preset Commands
      case 'At Full':
        if (handleCLICommand) {
          handleCLICommand('at 255')
        }
        break
      case 'At 50':
        if (handleCLICommand) {
          handleCLICommand('at 128')
        }
        break
      case 'At 0':
        if (handleCLICommand) {
          handleCLICommand('at 0')
        }
        break

      // Fan Commands
      case 'Fan Left':
        if (handleCLICommand) {
          handleCLICommand('fan left')
        }
        break
      case 'Fan Right':
        if (handleCLICommand) {
          handleCLICommand('fan right')
        }
        break
      case 'Fan Center':
        if (handleCLICommand) {
          handleCLICommand('fan center')
        }
        break

      // Cue Commands
      case 'Go Cue 1':
        if (handleCLICommand) {
          handleCLICommand('go cue 1')
        }
        break
      case 'Go Cue 2':
        if (handleCLICommand) {
          handleCLICommand('go cue 2')
        }
        break
      case 'Go Cue 3':
        if (handleCLICommand) {
          handleCLICommand('go cue 3')
        }
        break
      case 'Go Cue 4':
        if (handleCLICommand) {
          handleCLICommand('go cue 4')
        }
        break
      case 'Go Cue 5':
        if (handleCLICommand) {
          handleCLICommand('go cue 5')
        }
        break

      // Executor Commands
      case 'Go Exec 1':
        if (handleCLICommand) {
          handleCLICommand('go exec 1')
        }
        break
      case 'Go Exec 2':
        if (handleCLICommand) {
          handleCLICommand('go exec 2')
        }
        break
      case 'Go Exec 3':
        if (handleCLICommand) {
          handleCLICommand('go exec 3')
        }
        break

      // Time Commands
      case 'Time 0':
        setProgramTime(0)
        break
      case 'Time 1':
        setProgramTime(1)
        break
      case 'Time 3':
        setProgramTime(3)
        break
      case 'Time 5':
        setProgramTime(5)
        break

      // Group Commands
      case 'Group 1':
        if (handleCLICommand) {
          handleCLICommand('group 1')
        }
        break
      case 'Group 2':
        if (handleCLICommand) {
          handleCLICommand('group 2')
        }
        break
      case 'Group 3':
        if (handleCLICommand) {
          handleCLICommand('group 3')
        }
        break

      // View Commands
      case 'Toggle Edit Mode':
        setGridEditMode(prev => !prev)
        break
      case 'Toggle Keyboard':
        setShowKeyboard(prev => !prev)
        break

      case 'None':
        // Do nothing
        break
      default:
        break
    }
  }

  const setupGamepadListener = () => {
    // Steam Deck gamepad support
    let gamepadIndex = null
    const lastButtonPress = { time: 0, button: -1 }
    const buttonDebounceTime = 300 // milliseconds
    let lastDebugUpdate = 0
    const debugUpdateInterval = 100 // Update debug display every 100ms instead of every frame

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads()

      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          gamepadIndex = i
          const gamepad = gamepads[i]

          // Update debug info (throttled to prevent crashes)
          const now = Date.now()
          if (now - lastDebugUpdate > debugUpdateInterval) {
            lastDebugUpdate = now
            setGamepadDebug({
              connected: true,
              buttons: gamepad.buttons.map((btn, idx) => ({ index: idx, pressed: btn.pressed, value: btn.value })),
              axes: gamepad.axes.map((val, idx) => ({ index: idx, value: val }))
            })
          }

          // Get fresh available channels using refs (fixes closure problem)
          const getCurrentAvailableChannels = () => {
            if (selectedFixturesRef.current.size === 0) {
              return []
            }
            const selectedFixturesList = fixturesRef.current.filter(f => selectedFixturesRef.current.has(f.id))
            if (selectedFixturesList.length === 0) {
              return []
            }
            const firstFixture = selectedFixturesList[0]
            const firstProfile = fixtureProfiles[firstFixture.fixture_type]
            if (!firstProfile) {
              return []
            }
            return firstProfile.channels.filter(channel => {
              return selectedFixturesList.every(fixture => {
                const profile = fixtureProfiles[fixture.fixture_type]
                return profile && profile.channels.some(ch => ch.name === channel.name)
              })
            })
          }

          const currentAvailableChannels = getCurrentAvailableChannels()

          // Map gamepad controls to available channels using mappings
          const findChannel = (mappedName) => {
            if (!mappedName || mappedName === 'None') return null
            return currentAvailableChannels.find(ch =>
              ch.name.toLowerCase().includes(mappedName.toLowerCase())
            )
          }

          // Left trigger (L2)
          const leftTriggerChannel = findChannel(gamepadMappingsRef.current.leftTrigger)
          if (leftTriggerChannel && gamepad.buttons[6].value > 0.1) {
            const channelKey = leftTriggerChannel.name.toLowerCase().replace(/\s+/g, '_')
            setEncoderValue(channelKey, gamepad.buttons[6].value * 255)
          }

          // Right trigger (R2)
          const rightTriggerChannel = findChannel(gamepadMappingsRef.current.rightTrigger)
          if (rightTriggerChannel && gamepad.buttons[7].value > 0.1) {
            const channelKey = rightTriggerChannel.name.toLowerCase().replace(/\s+/g, '_')
            setEncoderValue(channelKey, gamepad.buttons[7].value * 255)
          }

          // Left bumper (L1)
          const leftBumperChannel = findChannel(gamepadMappingsRef.current.leftBumper)
          if (leftBumperChannel && gamepad.buttons[4].value > 0.1) {
            const channelKey = leftBumperChannel.name.toLowerCase().replace(/\s+/g, '_')
            setEncoderValue(channelKey, gamepad.buttons[4].value * 255)
          }

          // Right bumper (R1)
          const rightBumperChannel = findChannel(gamepadMappingsRef.current.rightBumper)
          if (rightBumperChannel && gamepad.buttons[5].value > 0.1) {
            const channelKey = rightBumperChannel.name.toLowerCase().replace(/\s+/g, '_')
            setEncoderValue(channelKey, gamepad.buttons[5].value * 255)
          }

          // Left Joystick
          const leftStickXChannel = findChannel(gamepadMappingsRef.current.leftStickX)
          const leftStickYChannel = findChannel(gamepadMappingsRef.current.leftStickY)

          if (leftStickXChannel && Math.abs(gamepad.axes[0]) > 0.1) {
            const channelKey = leftStickXChannel.name.toLowerCase().replace(/\s+/g, '_')
            setEncoderValue(channelKey, (gamepad.axes[0] + 1) * 127.5)
          }
          if (leftStickYChannel && Math.abs(gamepad.axes[1]) > 0.1) {
            const channelKey = leftStickYChannel.name.toLowerCase().replace(/\s+/g, '_')
            setEncoderValue(channelKey, (gamepad.axes[1] + 1) * 127.5)
          }

          // D-Pad controls with acceleration and wrap-around
          const dpadDebounceTime = 150 // milliseconds for initial press
          const dpadAccelerationThreshold = 500 // ms to hold before acceleration kicks in

          // Calculate increment based on hold duration (acceleration)
          const getAcceleratedIncrement = (holdDuration) => {
            const baseIncrement = incrementSpeedRef.current === 'slow' ? 1 : 5
            if (holdDuration < dpadAccelerationThreshold) {
              return baseIncrement
            } else if (holdDuration < 1000) {
              return baseIncrement * 2
            } else if (holdDuration < 2000) {
              return baseIncrement * 4
            } else {
              return baseIncrement * 8
            }
          }

          // Smart D-Pad mode: Only control programmer when no modal/menu is open
          // Check if any modal or menu is active by looking for open overlays
          const hasOpenModal = document.querySelector('.modal-overlay, .context-menu, .view-confirm-modal')
          const shouldControlProgrammer = !hasOpenModal && currentAvailableChannels.length > 0

          // D-Pad Up (button 12) - Increment focused channel
          // Also check axes for D-pad (some controllers use axes 9 for D-pad)
          const dpadUpPressed = (gamepad.buttons[12] && gamepad.buttons[12].pressed) ||
                                 (gamepad.axes[9] !== undefined && gamepad.axes[9] < -0.5)
          if (dpadUpPressed && shouldControlProgrammer) {
            // Track when button was first pressed
            if (dpadHoldStart.current.up === 0) {
              dpadHoldStart.current.up = now
            }

            const holdDuration = now - dpadHoldStart.current.up

            if (now - lastDpadPress.current.up > dpadDebounceTime) {
              lastDpadPress.current.up = now
              const channel = currentAvailableChannels[focusedChannelRef.current]
              const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_')
              const currentValue = encoderValuesRef.current[channelKey] || 0
              const increment = getAcceleratedIncrement(holdDuration)
              const newValue = Math.min(255, currentValue + increment)
              setEncoderValue(channelKey, newValue)
            }
          } else if (!dpadUpPressed) {
            dpadHoldStart.current.up = 0
          }

          // D-Pad Down (button 13) - Decrement focused channel
          const dpadDownPressed = (gamepad.buttons[13] && gamepad.buttons[13].pressed) ||
                                   (gamepad.axes[9] !== undefined && gamepad.axes[9] > 0.5)
          if (dpadDownPressed && shouldControlProgrammer) {
            if (dpadHoldStart.current.down === 0) {
              dpadHoldStart.current.down = now
            }

            const holdDuration = now - dpadHoldStart.current.down

            if (now - lastDpadPress.current.down > dpadDebounceTime) {
              lastDpadPress.current.down = now
              const channel = currentAvailableChannels[focusedChannelRef.current]
              const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_')
              const currentValue = encoderValuesRef.current[channelKey] || 0
              const decrement = getAcceleratedIncrement(holdDuration)
              const newValue = Math.max(0, currentValue - decrement)
              setEncoderValue(channelKey, newValue)
            }
          } else if (!dpadDownPressed) {
            dpadHoldStart.current.down = 0
          }

          // D-Pad Left (button 14) - Previous channel (with wrap-around)
          const dpadLeftPressed = (gamepad.buttons[14] && gamepad.buttons[14].pressed)
          if (dpadLeftPressed && shouldControlProgrammer) {
            if (now - lastDpadPress.current.left > dpadDebounceTime) {
              lastDpadPress.current.left = now
              setFocusedChannel(prev => {
                const newIndex = prev - 1
                return newIndex < 0 ? currentAvailableChannels.length - 1 : newIndex
              })
            }
          }

          // D-Pad Right (button 15) - Next channel (with wrap-around)
          const dpadRightPressed = (gamepad.buttons[15] && gamepad.buttons[15].pressed)
          if (dpadRightPressed && shouldControlProgrammer) {
            if (now - lastDpadPress.current.right > dpadDebounceTime) {
              lastDpadPress.current.right = now
              setFocusedChannel(prev => {
                const newIndex = prev + 1
                return newIndex >= currentAvailableChannels.length ? 0 : newIndex
              })
            }
          }

          // A button (button 0) - Mapped action
          if (gamepad.buttons[0] && gamepad.buttons[0].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 0) {
              lastButtonPress.time = now
              lastButtonPress.button = 0
              executeGamepadAction(gamepadMappingsRef.current.buttonA)
            }
          }

          // B button (button 1) - Mapped action
          if (gamepad.buttons[1] && gamepad.buttons[1].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 1) {
              lastButtonPress.time = now
              lastButtonPress.button = 1
              executeGamepadAction(gamepadMappingsRef.current.buttonB)
            }
          }

          // X button (button 2) - Mapped action
          if (gamepad.buttons[2] && gamepad.buttons[2].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 2) {
              lastButtonPress.time = now
              lastButtonPress.button = 2
              executeGamepadAction(gamepadMappingsRef.current.buttonX)
            }
          }

          // Y button (button 3) - Mapped action
          if (gamepad.buttons[3] && gamepad.buttons[3].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 3) {
              lastButtonPress.time = now
              lastButtonPress.button = 3
              executeGamepadAction(gamepadMappingsRef.current.buttonY)
            }
          }

          // Select button (button 8) - Mapped action
          if (gamepad.buttons[8] && gamepad.buttons[8].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 8) {
              lastButtonPress.time = now
              lastButtonPress.button = 8
              executeGamepadAction(gamepadMappingsRef.current.buttonSelect)
            }
          }

          // Start button (button 9) - Mapped action
          if (gamepad.buttons[9] && gamepad.buttons[9].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 9) {
              lastButtonPress.time = now
              lastButtonPress.button = 9
              executeGamepadAction(gamepadMappingsRef.current.buttonStart)
            }
          }

          // L3 button (button 10) - Left Stick Click
          if (gamepad.buttons[10] && gamepad.buttons[10].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 10) {
              lastButtonPress.time = now
              lastButtonPress.button = 10
              executeGamepadAction(gamepadMappingsRef.current.buttonL3)
            }
          }

          // R3 button (button 11) - Right Stick Click
          if (gamepad.buttons[11] && gamepad.buttons[11].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 11) {
              lastButtonPress.time = now
              lastButtonPress.button = 11
              executeGamepadAction(gamepadMappingsRef.current.buttonR3)
            }
          }

          // L4 button (back paddle - button index may vary, try 16)
          if (gamepad.buttons[16] && gamepad.buttons[16].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 16) {
              lastButtonPress.time = now
              lastButtonPress.button = 16
              executeGamepadAction(gamepadMappingsRef.current.buttonL4)
            }
          }

          // R4 button (back paddle - button index may vary, try 17)
          if (gamepad.buttons[17] && gamepad.buttons[17].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 17) {
              lastButtonPress.time = now
              lastButtonPress.button = 17
              executeGamepadAction(gamepadMappingsRef.current.buttonR4)
            }
          }

          // L5 button (additional grip button - button 18)
          if (gamepad.buttons[18] && gamepad.buttons[18].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 18) {
              lastButtonPress.time = now
              lastButtonPress.button = 18
              executeGamepadAction(gamepadMappingsRef.current.buttonL5)
            }
          }

          // R5 button (additional grip button - button 19)
          if (gamepad.buttons[19] && gamepad.buttons[19].pressed) {
            if (now - lastButtonPress.time > buttonDebounceTime || lastButtonPress.button !== 19) {
              lastButtonPress.time = now
              lastButtonPress.button = 19
              executeGamepadAction(gamepadMappingsRef.current.buttonR5)
            }
          }

          // Right Joystick (Axes 2 and 3)
          const rightStickXChannel = findChannel(gamepadMappingsRef.current.rightStickX)
          const rightStickYChannel = findChannel(gamepadMappingsRef.current.rightStickY)

          if (rightStickXChannel && Math.abs(gamepad.axes[2]) > 0.1) {
            const channelKey = rightStickXChannel.name.toLowerCase().replace(/\s+/g, '_')
            setEncoderValue(channelKey, (gamepad.axes[2] + 1) * 127.5)
          }
          if (rightStickYChannel && Math.abs(gamepad.axes[3]) > 0.1) {
            const channelKey = rightStickYChannel.name.toLowerCase().replace(/\s+/g, '_')
            setEncoderValue(channelKey, (gamepad.axes[3] + 1) * 127.5)
          }
        }
      }

      requestAnimationFrame(pollGamepad)
    }

    // Check for gamepad connection
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id)
      pollGamepad()
    })

    // Start polling if gamepad already connected
    const gamepads = navigator.getGamepads()
    if (gamepads[0]) {
      pollGamepad()
    }
  }

  const handleQuickViewClick = (index) => {
    if (recordMode) {
      // Save current grid layout to this slot (MA3-style view save)
      if (!currentGridLayout) {
        setRecordMessage('No grid layout to save!')
        return
      }

      const viewData = {
        gridLayout: currentGridLayout, // Save entire grid configuration
        timestamp: Date.now(),
        name: `View ${index + 1}`
      }
      const newQuickViews = [...quickViews]
      newQuickViews[index] = viewData
      setQuickViews(newQuickViews)
      localStorage.setItem('dmx_quick_views', JSON.stringify(newQuickViews))
      setRecordMessage(`View ${index + 1} saved!`)
    } else if (quickViews[index]) {
      // Recall saved view (MA3-style view recall)
      const view = quickViews[index]
      if (view.gridLayout) {
        // Tell GridLayout to load this layout
        setCurrentGridLayout(view.gridLayout)
      }
    }
  }

  // Callback from GridLayout to update current grid state
  const handleGridLayoutChange = (newLayout) => {
    setCurrentGridLayout(newLayout)
  }

  const enterRecordMode = () => {
    setRecordMode(true)
    setRecordMessage('RECORD: Click View, Cue, Preset, Executor, or Group target')
  }

  const exitRecordMode = () => {
    setRecordMode(false)
    setRecordMessage('Ready to record - click target')
  }

  const colorPalettes = [
    { name: 'Red', r: 255, g: 0, b: 0 },
    { name: 'Green', r: 0, g: 255, b: 0 },
    { name: 'Blue', r: 0, g: 0, b: 255 },
    { name: 'White', r: 255, g: 255, b: 255 },
    { name: 'Cyan', r: 0, g: 255, b: 255 },
    { name: 'Magenta', r: 255, g: 0, b: 255 },
    { name: 'Yellow', r: 255, g: 255, b: 0 },
    { name: 'Orange', r: 255, g: 128, b: 0 },
    { name: 'Pink', r: 255, g: 128, b: 192 },
  ]

  // Bulk encoder values setter for ViewButtons
  const setEncoderValuesAll = (newValues) => {
    setEncoderValues(newValues)
    // Apply all values to selected fixtures
    for (const fixtureId of selectedFixtures) {
      const fixture = fixtures.find(f => f.id === fixtureId)
      if (!fixture) continue

      const profile = fixtureProfiles[fixture.fixture_type]
      if (!profile) continue

      Object.entries(newValues).forEach(async ([param, value]) => {
        const channel = profile.channels.find(ch =>
          ch.name.toLowerCase().replace(/\s+/g, '_') === param
        )
        if (channel) {
          try {
            await invoke('set_fixture_channel', {
              fixtureId,
              channelOffset: channel.offset,
              value: Math.round(value),
            })
          } catch (error) {
            console.error('Error setting fixture channel:', error)
          }
        }
      })
    }
  }

  // Window Management Functions
  const handleOpenWindow = (windowId) => {
    // Import window ID mapping
    const { getViewFromId, getLabelFromId, isValidWindowId } = require('./utils/windowIds')

    // Validate window ID
    if (!isValidWindowId(windowId)) {
      return {
        success: false,
        message: `Invalid window ID: ${windowId}`
      }
    }

    const viewType = getViewFromId(windowId)
    const windowName = getLabelFromId(windowId)

    // Get current layout
    const currentLayout = currentGridLayout || { name: 'Default', windows: [] }

    // Check if window already exists
    const existingWindow = currentLayout.windows?.find(w => w.view === viewType)
    if (existingWindow) {
      return {
        success: false,
        message: `${windowName} is already open`
      }
    }

    // Calculate position (cascade from top-left)
    const windowCount = currentLayout.windows?.length || 0
    const offsetX = (windowCount * 30) % 300
    const offsetY = (windowCount * 30) % 200

    // Create new window
    const newWindow = {
      x: 50 + offsetX,
      y: 50 + offsetY,
      width: 400,
      height: 300,
      view: viewType,
      id: Date.now()
    }

    // Add window to layout
    const newLayout = {
      ...currentLayout,
      windows: [...(currentLayout.windows || []), newWindow]
    }

    setCurrentGridLayout(newLayout)

    return {
      success: true,
      windowName
    }
  }

  const handleCloseWindow = (windowId) => {
    const { getViewFromId, getLabelFromId, isValidWindowId } = require('./utils/windowIds')

    // Validate window ID
    if (!isValidWindowId(windowId)) {
      return {
        success: false,
        message: `Invalid window ID: ${windowId}`
      }
    }

    const viewType = getViewFromId(windowId)
    const windowName = getLabelFromId(windowId)

    // Get current layout
    const currentLayout = currentGridLayout || { name: 'Default', windows: [] }

    // Find window index
    const windowIndex = currentLayout.windows?.findIndex(w => w.view === viewType)
    if (windowIndex === -1 || windowIndex === undefined) {
      return {
        success: false,
        message: `${windowName} is not open`
      }
    }

    // Remove window
    const newLayout = {
      ...currentLayout,
      windows: currentLayout.windows.filter((_, idx) => idx !== windowIndex)
    }

    setCurrentGridLayout(newLayout)

    return {
      success: true,
      windowName
    }
  }

  // Video Control Handlers
  const handleVideoPlay = (videoInput, videoOutput) => {
    return videoPlaybackManager.current.play(videoInput, videoOutput)
  }

  const handleVideoPause = (videoInput) => {
    return videoPlaybackManager.current.pause(videoInput)
  }

  const handleVideoStop = (videoInput) => {
    return videoPlaybackManager.current.stop(videoInput)
  }

  const handleVideoRestart = (videoInput) => {
    return videoPlaybackManager.current.restart(videoInput)
  }

  const handleVideoLoop = (videoInput, enabled) => {
    return videoPlaybackManager.current.setLoop(videoInput, enabled)
  }

  const handleVideoSpeed = (videoInput, speed) => {
    return videoPlaybackManager.current.setSpeed(videoInput, speed)
  }

  const handleVideoRoute = (videoInput, videoOutput) => {
    return videoPlaybackManager.current.route(videoInput, videoOutput)
  }

  // CLI Command Handler
  const handleCLICommand = (command) => {
    const appActions = {
      fixtures,
      selectedFixtures,
      setSelectedFixtures,
      setEncoderValue,
      availableChannels,
      handleClear,
      handleBlackout,
      handleLocate,
      handleRecordCue,
      recordedCues,
      handleRecallCue,
      setActiveFeatureSet,
      openWindow: handleOpenWindow,
      closeWindow: handleCloseWindow,
      videoPlay: handleVideoPlay,
      videoPause: handleVideoPause,
      videoStop: handleVideoStop,
      videoRestart: handleVideoRestart,
      videoLoop: handleVideoLoop,
      videoSpeed: handleVideoSpeed,
      videoRoute: handleVideoRoute
    }

    const dispatcher = new CLIDispatcher(appState, appActions)
    return dispatcher.execute(command)
  }

  // Prepare app state for views
  const appState = {
    fixtures,
    selectedFixtures,
    setSelectedFixtures,
    toggleFixtureSelection,
    encoderValues,
    setEncoderValue,
    setEncoderValues: setEncoderValuesAll,
    focusedChannel,
    setFocusedChannel,
    availableChannels,
    applyColorPalette,
    applyPresetValues,
    faderValues,
    setFaderValues,
    handleBlackout,
    handleLocate,
    handleClear,
    handleRecordCue,
    isRecording,
    recordedCues,
    handleRecallCue,
    handleDeleteCue,
    // New feature set and parameter tracking
    activeFeatureSet,
    setActiveFeatureSet,
    activeParameters,
    setActiveParameters,
    recordMode,
    setRecordMode,
    toggleRecordMode: () => setRecordMode(!recordMode),
    enterRecordMode,
    exitRecordMode,
    recordMessage,
    setRecordMessage,
    handleClearProgrammer: handleClear,
    masterFaderValue,
    setMasterFaderValue,
    colorPalettes
  }

  // Start clocks manager
  useEffect(() => {
    clocksManager.start()
    return () => clocksManager.stop()
  }, [clocksManager])

  // Handle right-click configuration
  const handleRightClick = (e, type, item) => {
    e.preventDefault()
    if (type === 'clock') {
      setShowClocksWindow(true)
    } else if (type === 'group') {
      setEditingGroupHandle(item)
      setShowGroupHandleEditor(true)
    }
  }

  return (
    <>
      {/* Steam Deck Integration */}
      <SteamDeckIntegration
        appState={{
          ...appState,
          activeWindow,
          setActiveWindow,
          setCurrentView: (view) => {
            // Handle view changes from Steam Deck
            console.log('[SteamDeck] Navigate to:', view)
          }
        }}
      />

      <GamepadManager appState={appState}>
        <div
          className={`app-container ${recordMode ? 'record-mode' : ''}`}
          data-record-message={recordMessage}
        >
      {/* Top Bar - MA dot2 style */}
      <div className="top-bar">
        <div className="top-bar-left">
          <div className="top-bar-title">RoControl</div>
          {/* Quick View Buttons */}
          <div className="quick-view-buttons">
            {[1, 2, 3, 4].map((num, index) => (
              <button
                key={num}
                className={`quick-view-btn ${quickViews[index] ? 'filled' : 'empty'} ${recordMode ? 'record-target' : ''}`}
                onClick={() => handleQuickViewClick(index)}
                title={quickViews[index]
                  ? `View ${num} - Click to recall${recordMode ? ' or overwrite' : ''}`
                  : `View ${num} - ${recordMode ? 'Click to save current view' : 'Empty'}`}
              >
                {num}
              </button>
            ))}
          </div>
          <button className="top-bar-button" onClick={loadFixtures}>
            Refresh
          </button>
          <button className="top-bar-button" onClick={() => { console.log('Setup clicked, setting showSetup to true'); setSetupTab('patch'); setShowSetup(true); }}>
            Setup
          </button>
          <button
            className={`top-bar-button ${gridEditMode ? 'active' : ''}`}
            onClick={() => setGridEditMode(!gridEditMode)}
            title="Toggle Edit Mode (right-click to change views, drag to move, click handles to resize)"
          >
            ✏️ Edit
          </button>
          <button
            className={`top-bar-button record-button ${recordMode ? 'active recording' : ''}`}
            onClick={() => recordMode ? exitRecordMode() : enterRecordMode()}
            title="Toggle Record Mode (R) - Save views and presets"
          >
            {recordMode ? '● REC' : '○ Rec'}
          </button>
        </div>
        <div className="top-bar-right">
          {gamepadDebug.connected && !document.documentElement.classList.contains('steam-deck-gaming') && (
            <span style={{ fontSize: '11px', color: '#00ff88', marginRight: '10px' }}>
              🎮 Gamepad OK
            </span>
          )}
          {availableChannels.length > 0 && (
            <span style={{ fontSize: '11px', color: '#4a9eff', marginRight: '10px' }}>
              Ch {focusedChannel + 1}/{availableChannels.length}
            </span>
          )}
          <span style={{ fontSize: '12px', color: '#666' }}>
            {dmxProtocol.toUpperCase()}: {artnetConfig}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ height: 'calc(100vh - 50px - 80px)', overflow: 'auto', paddingBottom: '0' }}>
        <GridLayout
          appState={appState}
          editMode={gridEditMode}
          onLayoutChange={handleGridLayoutChange}
          externalLayout={currentGridLayout}
        />
      </div>

      {/* Gamepad Debug Display - Hidden in gaming mode */}
      {showGamepadDebug && !document.documentElement.classList.contains('steam-deck-gaming') && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#0f0',
          padding: '10px',
          fontSize: '10px',
          fontFamily: 'monospace',
          maxWidth: '400px',
          maxHeight: '300px',
          overflow: 'auto',
          zIndex: 999,
          borderRadius: '4px',
          border: '1px solid #0f0'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
            <strong>GAMEPAD DEBUG</strong>
            <button onClick={() => setShowGamepadDebug(false)} style={{background: 'none', border: 'none', color: '#0f0', cursor: 'pointer'}}>✕</button>
          </div>
          <div>Status: {gamepadDebug.connected ? 'CONNECTED' : 'DISCONNECTED'}</div>
          <div style={{marginTop: '5px'}}>
            <strong>Buttons:</strong>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', marginTop: '2px'}}>
              {gamepadDebug.buttons.map(btn => (
                <div key={btn.index} style={{
                  background: btn.pressed ? '#0f0' : '#333',
                  color: btn.pressed ? '#000' : '#0f0',
                  padding: '2px',
                  textAlign: 'center',
                  fontSize: '9px'
                }}>
                  {btn.index}: {btn.value.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
          <div style={{marginTop: '5px'}}>
            <strong>Axes:</strong>
            {gamepadDebug.axes.map(axis => (
              <div key={axis.index}>Axis {axis.index}: {axis.value.toFixed(3)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Modal */}
      {showSetup && console.log('Rendering Setup Modal, showSetup =', showSetup)}
      {showSetup && (
        <div className="modal-overlay" onClick={() => setShowSetup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {setupTab === 'artnet' ? 'Network Configuration' :
                 setupTab === 'patch' ? 'Patch Fixtures' :
                 setupTab === 'backup' ? 'Show Backup & Recall' :
                 'Gamepad Mapping'}
              </h2>
              <button className="modal-close" onClick={() => setShowSetup(false)}>✕</button>
            </div>

            <div className="modal-tabs">
              <button
                className={`modal-tab ${setupTab === 'artnet' ? 'active' : ''}`}
                onClick={() => setSetupTab('artnet')}
              >
                Network
              </button>
              <button
                className={`modal-tab ${setupTab === 'patch' ? 'active' : ''}`}
                onClick={() => setSetupTab('patch')}
              >
                Patch
              </button>
              <button
                className={`modal-tab ${setupTab === 'backup' ? 'active' : ''}`}
                onClick={() => setSetupTab('backup')}
              >
                Backup
              </button>
              <button
                className={`modal-tab ${setupTab === 'gamepad' ? 'active' : ''}`}
                onClick={() => setSetupTab('gamepad')}
              >
                Gamepad
              </button>
            </div>

            <div className="modal-body">
              {setupTab === 'artnet' ? (
                <ProtocolSettings
                  artnetConfig={artnetConfig}
                  sacnConfig={sacnConfig}
                  setArtnetConfig={setArtnetConfig}
                  setSacnConfig={setSacnConfig}
                />
              ) : setupTab === 'patch' ? (
                <div className="setup-section">
                  <h3>Add New Fixture</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Fixture ID:</label>
                      <input
                        type="text"
                        inputMode="text"
                        value={newFixture.id}
                        onChange={(e) => setNewFixture({...newFixture, id: e.target.value})}
                        placeholder="fx7"
                      />
                    </div>
                    <div className="form-group">
                      <label>Fixture Name:</label>
                      <input
                        type="text"
                        inputMode="text"
                        value={newFixture.name}
                        onChange={(e) => setNewFixture({...newFixture, name: e.target.value})}
                        placeholder="Wash 5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Type:</label>
                      <select
                        value={newFixture.fixture_type}
                        onChange={(e) => {
                          const profile = fixtureProfiles[e.target.value]
                          setNewFixture({
                            ...newFixture,
                            fixture_type: e.target.value,
                            channel_count: profile ? profile.count : 1
                          })
                        }}
                      >
                        {Object.keys(fixtureProfiles).map(profileName => (
                          <option key={profileName}>{profileName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Universe:</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={newFixture.universe}
                        onChange={(e) => setNewFixture({...newFixture, universe: parseInt(e.target.value)})}
                        min="0" max="255"
                      />
                    </div>
                    <div className="form-group">
                      <label>DMX Address:</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={newFixture.dmx_address}
                        onChange={(e) => setNewFixture({...newFixture, dmx_address: parseInt(e.target.value)})}
                        min="1" max="512"
                      />
                    </div>
                    <div className="form-group">
                      <label>Channel Count:</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={newFixture.channel_count}
                        onChange={(e) => setNewFixture({...newFixture, channel_count: parseInt(e.target.value)})}
                        min="1" max="32"
                      />
                    </div>
                    <div className="form-group">
                      <label>Quantity:</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={newFixture.quantity}
                        onChange={(e) => setNewFixture({...newFixture, quantity: parseInt(e.target.value)})}
                        min="1" max="100"
                        placeholder="1"
                      />
                    </div>
                  </div>
                  {newFixture.quantity > 1 && (
                    <div className="form-help" style={{marginTop: '-10px'}}>
                      <p><strong>Batch Add:</strong> Will create {newFixture.quantity} fixtures:</p>
                      <ul>
                        <li>IDs: {newFixture.id}1, {newFixture.id}2, {newFixture.id}3...</li>
                        <li>Names: {newFixture.name} 1, {newFixture.name} 2, {newFixture.name} 3...</li>
                        <li>Addresses: {newFixture.dmx_address}, {newFixture.dmx_address + newFixture.channel_count}, {newFixture.dmx_address + (newFixture.channel_count * 2)}...</li>
                      </ul>
                    </div>
                  )}
                  <div style={{marginTop: '5px'}}></div>
                  {fixtureProfiles[newFixture.fixture_type] && (
                    <div className="form-help">
                      <p><strong>Channel Layout for {newFixture.fixture_type}:</strong></p>
                      <ul>
                        {fixtureProfiles[newFixture.fixture_type].channels.map((ch, idx) => (
                          <li key={idx}>Ch {ch.offset + 1}: {ch.name} ({ch.type})</li>
                        ))}
                      </ul>
                      <p>Total: {fixtureProfiles[newFixture.fixture_type].count} channels</p>
                    </div>
                  )}

                  <button className="btn-primary" onClick={handleAddFixture}>
                    Add Fixture
                  </button>

                  <h3 style={{ marginTop: '30px' }}>Current Fixtures</h3>
                  <div className="fixture-list">
                    {fixtures.map((fixture) => (
                      <div key={fixture.id} className="fixture-list-item">
                        <div>
                          <strong>{fixture.name}</strong> ({fixture.id})
                          <br />
                          <small>{fixture.fixture_type} - U{fixture.universe}:{fixture.dmx_address} - {fixture.channel_count}ch</small>
                        </div>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteFixture(fixture.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : setupTab === 'gamepad' ? (
                <div className="setup-section">
                  <h3>Steam Input Configuration</h3>
                  <div className="form-help" style={{marginBottom: '25px'}}>
                    <p><strong>Using Steam Deck Controls:</strong></p>
                    <ul>
                      <li>This app works natively with Steam Input - no special configuration needed!</li>
                      <li>When added to Steam as a non-Steam game, configure controls in Steam's controller settings</li>
                      <li>Recommended: Set Steam Input to "Gamepad" template for best compatibility</li>
                      <li>The app uses browser Gamepad API which works seamlessly with Steam Input</li>
                      <li>You can customize button layouts in Steam's per-game controller configuration</li>
                    </ul>
                  </div>

                  <h3>Button Mapping</h3>
                  <p style={{color: '#aaa', fontSize: '13px', marginBottom: '20px'}}>
                    Map gamepad buttons to functions. Changes are saved automatically.
                  </p>

                  <div className="form-grid" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
                    <div className="form-group">
                      <label>A Button:</label>
                      <select
                        value={gamepadMappings.buttonA}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonA: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>B Button:</label>
                      <select
                        value={gamepadMappings.buttonB}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonB: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>X Button:</label>
                      <select
                        value={gamepadMappings.buttonX}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonX: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Y Button:</label>
                      <select
                        value={gamepadMappings.buttonY}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonY: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <h3 style={{marginTop: '30px'}}>Additional Button Mapping (Steam Deck)</h3>
                  <p style={{color: '#aaa', fontSize: '13px', marginBottom: '20px'}}>
                    Map additional Steam Deck buttons. Select/Start (buttons 8/9), Stick Clicks (L3/R3), and Back Paddles (L4/R4).
                  </p>

                  <div className="form-grid" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
                    <div className="form-group">
                      <label>Select Button (Button 8):</label>
                      <select
                        value={gamepadMappings.buttonSelect || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonSelect: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Start Button (Button 9):</label>
                      <select
                        value={gamepadMappings.buttonStart || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonStart: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>L3 (Left Stick Click):</label>
                      <select
                        value={gamepadMappings.buttonL3 || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonL3: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>R3 (Right Stick Click):</label>
                      <select
                        value={gamepadMappings.buttonR3 || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonR3: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>L4 (Left Back Paddle):</label>
                      <select
                        value={gamepadMappings.buttonL4 || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonL4: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>R4 (Right Back Paddle):</label>
                      <select
                        value={gamepadMappings.buttonR4 || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonR4: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>L5 (Left Grip 2):</label>
                      <select
                        value={gamepadMappings.buttonL5 || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonL5: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>R5 (Right Grip 2):</label>
                      <select
                        value={gamepadMappings.buttonR5 || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, buttonR5: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        {GAMEPAD_COMMAND_OPTIONS.map(cmd => (
                          <option key={cmd}>{cmd}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <h3 style={{marginTop: '30px'}}>Trigger & Bumper Mapping</h3>
                  <p style={{color: '#aaa', fontSize: '13px', marginBottom: '20px'}}>
                    Map triggers and bumpers to fixture attributes. Controls will only work when fixtures with matching attributes are selected.
                  </p>

                  <div className="form-grid" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
                    <div className="form-group">
                      <label>L2 (Left Trigger):</label>
                      <select
                        value={gamepadMappings.leftTrigger}
                        onChange={(e) => setGamepadMappings({...gamepadMappings, leftTrigger: e.target.value})}
                      >
                        <option>None</option>
                        <option>Red</option>
                        <option>Green</option>
                        <option>Blue</option>
                        <option>White</option>
                        <option>Amber</option>
                        <option>UV</option>
                        <option>Dimmer</option>
                        <option>Intensity</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>R2 (Right Trigger):</label>
                      <select
                        value={gamepadMappings.rightTrigger}
                        onChange={(e) => setGamepadMappings({...gamepadMappings, rightTrigger: e.target.value})}
                      >
                        <option>None</option>
                        <option>Red</option>
                        <option>Green</option>
                        <option>Blue</option>
                        <option>White</option>
                        <option>Amber</option>
                        <option>UV</option>
                        <option>Dimmer</option>
                        <option>Intensity</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>L1 (Left Bumper):</label>
                      <select
                        value={gamepadMappings.leftBumper}
                        onChange={(e) => setGamepadMappings({...gamepadMappings, leftBumper: e.target.value})}
                      >
                        <option>None</option>
                        <option>Red</option>
                        <option>Green</option>
                        <option>Blue</option>
                        <option>White</option>
                        <option>Amber</option>
                        <option>UV</option>
                        <option>Dimmer</option>
                        <option>Intensity</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>R1 (Right Bumper):</label>
                      <select
                        value={gamepadMappings.rightBumper}
                        onChange={(e) => setGamepadMappings({...gamepadMappings, rightBumper: e.target.value})}
                      >
                        <option>None</option>
                        <option>Red</option>
                        <option>Green</option>
                        <option>Blue</option>
                        <option>White</option>
                        <option>Amber</option>
                        <option>UV</option>
                        <option>Dimmer</option>
                        <option>Intensity</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Left Stick X-Axis:</label>
                      <select
                        value={gamepadMappings.leftStickX}
                        onChange={(e) => setGamepadMappings({...gamepadMappings, leftStickX: e.target.value})}
                      >
                        <option>None</option>
                        <option>Pan</option>
                        <option>Tilt</option>
                        <option>Red</option>
                        <option>Green</option>
                        <option>Blue</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Left Stick Y-Axis:</label>
                      <select
                        value={gamepadMappings.leftStickY}
                        onChange={(e) => setGamepadMappings({...gamepadMappings, leftStickY: e.target.value})}
                      >
                        <option>None</option>
                        <option>Pan</option>
                        <option>Tilt</option>
                        <option>Red</option>
                        <option>Green</option>
                        <option>Blue</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Right Stick X-Axis:</label>
                      <select
                        value={gamepadMappings.rightStickX || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, rightStickX: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        <option>None</option>
                        <option>Pan</option>
                        <option>Tilt</option>
                        <option>Red</option>
                        <option>Green</option>
                        <option>Blue</option>
                        <option>White</option>
                        <option>Amber</option>
                        <option>UV</option>
                        <option>Dimmer</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Right Stick Y-Axis:</label>
                      <select
                        value={gamepadMappings.rightStickY || 'None'}
                        onChange={(e) => {
                          const newMappings = {...gamepadMappings, rightStickY: e.target.value}
                          setGamepadMappings(newMappings)
                          localStorage.setItem('dmx_gamepad_mappings', JSON.stringify(newMappings))
                        }}
                      >
                        <option>None</option>
                        <option>Pan</option>
                        <option>Tilt</option>
                        <option>Red</option>
                        <option>Green</option>
                        <option>Blue</option>
                        <option>White</option>
                        <option>Amber</option>
                        <option>UV</option>
                        <option>Dimmer</option>
                      </select>
                    </div>
                  </div>

                  <h3 style={{marginTop: '25px'}}>D-Pad Increment/Decrement Speed</h3>
                  <div className="form-group">
                    <label>D-Pad Speed:</label>
                    <select
                      value={incrementSpeed}
                      onChange={(e) => setIncrementSpeed(e.target.value)}
                    >
                      <option value="slow">Slow (±1 per press)</option>
                      <option value="normal">Normal (±5 per press)</option>
                    </select>
                  </div>
                  <div className="form-help">
                    <p><strong>D-Pad Controls:</strong></p>
                    <ul>
                      <li><strong>D-Pad Up</strong>: Increment focused channel value</li>
                      <li><strong>D-Pad Down</strong>: Decrement focused channel value</li>
                      <li><strong>D-Pad Left</strong>: Select previous channel (wraps around)</li>
                      <li><strong>D-Pad Right</strong>: Select next channel (wraps around)</li>
                    </ul>
                    <p style={{marginTop: '10px'}}>
                      <strong>Pro Tip:</strong> Hold Up/Down longer for acceleration! Speed increases at 0.5s, 1s, and 2s.
                      The currently focused channel will be highlighted in the Programmer section.
                    </p>
                  </div>

                  <div className="form-help">
                    <p><strong>Current Mapping:</strong></p>
                    <ul>
                      <li><strong>L2</strong>: {gamepadMappings.leftTrigger || 'None'}</li>
                      <li><strong>L1</strong>: {gamepadMappings.leftBumper || 'None'}</li>
                      <li><strong>R1</strong>: {gamepadMappings.rightBumper || 'None'}</li>
                      <li><strong>R2</strong>: {gamepadMappings.rightTrigger || 'None'}</li>
                      <li><strong>Left Stick</strong>: X={gamepadMappings.leftStickX || 'None'}, Y={gamepadMappings.leftStickY || 'None'}</li>
                    </ul>
                    <p style={{marginTop: '10px', fontSize: '12px'}}>
                      <strong>Note:</strong> Mappings are case-insensitive and will match any channel with the selected name.
                      Fixed buttons: A=Select Fixture 1, B=Blackout, X=Clear Selection, Y=Locate
                    </p>
                  </div>
                </div>
              ) : setupTab === 'backup' ? (
                <div className="setup-section">
                  <h3>Save Current Show</h3>
                  <div className="form-group">
                    <label>Show Name:</label>
                    <input
                      type="text"
                      value={newShowName}
                      onChange={(e) => setNewShowName(e.target.value)}
                      placeholder="My Awesome Show"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          saveShow()
                        }
                      }}
                    />
                  </div>
                  <div className="form-help">
                    <p>Current state to save:</p>
                    <ul>
                      <li><strong>{selectedFixtures.size}</strong> fixture{selectedFixtures.size !== 1 ? 's' : ''} selected</li>
                      <li><strong>{Object.keys(encoderValues).filter(k => encoderValues[k] > 0).length}</strong> encoder values set</li>
                      <li><strong>{faderValues.filter(v => v > 0).length}</strong> faders active</li>
                    </ul>
                  </div>
                  <button className="btn-primary" onClick={saveShow}>
                    Save Show
                  </button>

                  <h3 style={{ marginTop: '30px' }}>Saved Shows ({savedShows.length})</h3>
                  {savedShows.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No saved shows yet. Create one above!</p>
                  ) : (
                    <div className="fixture-list">
                      {savedShows.map((show) => (
                        <div key={show.name} className="fixture-list-item">
                          <div>
                            <strong>{show.name}</strong>
                            <br />
                            <small style={{ color: '#888' }}>
                              {show.selectedFixtures.length} fixture{show.selectedFixtures.length !== 1 ? 's' : ''} •
                              Saved {new Date(show.timestamp).toLocaleString()}
                            </small>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              className="btn-primary"
                              onClick={() => recallShow(show)}
                              style={{ fontSize: '12px', padding: '5px 15px' }}
                            >
                              Recall
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => deleteShow(show.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="form-help" style={{ marginTop: '30px' }}>
                    <p><strong>About Show Backup:</strong></p>
                    <ul>
                      <li>Saves all selected fixtures and their current values</li>
                      <li>Includes encoder settings and fader positions</li>
                      <li>Shows are stored in browser localStorage</li>
                      <li>Recall instantly restores the entire show state</li>
                      <li>Perfect for saving looks, scenes, or entire setlists</li>
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Programmer Bar - Always visible, shows active parameters */}
      <ProgrammerBar appState={appState} />

      {/* Program Time Control */}
      <div style={{ position: 'fixed', bottom: '120px', left: '20px', zIndex: 1000 }}>
        <ProgramTimeControl
          programTime={programTime}
          setProgramTime={setProgramTime}
        />
      </div>

      {/* Cue/Executor Time Control */}
      <div style={{ position: 'fixed', bottom: '120px', right: '20px', zIndex: 1000 }}>
        <CueExecutorTimeControl
          cueExecutorTime={cueTime}
          setCueExecutorTime={(time) => setCueTime(time)}
          targetType="cue"
        />
      </div>

      {/* Master Fader - Fixed floating control */}
      <MasterFader
        value={masterFaderValue}
        onChange={setMasterFaderValue}
      />

      {/* On-Screen Keyboard - Appears on input focus */}
      {showKeyboard && (
        <OnScreenKeyboard
          mode={keyboardMode}
          target={keyboardTarget}
          onInput={(value) => {
            if (keyboardTarget) {
              // Get the native input value setter
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
              ).set;

              // Call the native setter with the new value
              nativeInputValueSetter.call(keyboardTarget, value);

              // Create a new 'input' event that React will recognize
              const event = new Event('input', { bubbles: true });

              // Dispatch the event
              keyboardTarget.dispatchEvent(event);
            }
          }}
          onClose={() => setShowKeyboard(false)}
        />
      )}

      {/* CLI - Command Line Interface (MA3/Hog style) */}
      <CLI onCommand={handleCLICommand} appState={appState} />
    </div>
    </GamepadManager>

    {/* Clocks Configuration Window */}
    {showClocksWindow && (
      <ClocksConfigWindow
        clocksManager={clocksManager}
        onClose={() => setShowClocksWindow(false)}
      />
    )}

    {/* Group Handle Editor */}
    {showGroupHandleEditor && editingGroupHandle && (
      <GroupHandleEditor
        groupHandle={editingGroupHandle}
        groupHandleManager={groupHandleManager}
        fixtures={fixtures}
        onClose={() => {
          setShowGroupHandleEditor(false)
          setEditingGroupHandle(null)
        }}
        onSave={(groupHandle) => {
          console.log('[GroupHandle] Saved:', groupHandle)
          setFixtures([...fixtures]) // Force refresh
        }}
      />
    )}
    </>
  )
}

export default App
