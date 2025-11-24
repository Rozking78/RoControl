import React, { useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import '../../styles/views/ChannelGridView.css'

function ChannelGridView() {
  const [universe, setUniverse] = useState(0)
  const [startChannel, setStartChannel] = useState(1)
  const [channelValues, setChannelValues] = useState(Array(16).fill(0))

  const handleChannelChange = async (index, value) => {
    const newValues = [...channelValues]
    newValues[index] = value
    setChannelValues(newValues)

    const channel = startChannel + index
    try {
      await invoke('set_dmx_channel', {
        universe,
        channel,
        value: parseInt(value)
      })
    } catch (error) {
      console.error('Error setting DMX channel:', error)
    }
  }

  return (
    <div className="channel-grid-view">
      <div className="channel-grid-controls">
        <div className="control-group">
          <label>Universe:</label>
          <input
            type="number"
            inputMode="numeric"
            value={universe}
            onChange={(e) => setUniverse(parseInt(e.target.value))}
            min="0"
            max="255"
          />
        </div>
        <div className="control-group">
          <label>Start Channel:</label>
          <input
            type="number"
            inputMode="numeric"
            value={startChannel}
            onChange={(e) => setStartChannel(parseInt(e.target.value))}
            min="1"
            max="497"
          />
        </div>
      </div>

      <div className="channel-grid">
        {channelValues.map((value, index) => (
          <div key={index} className="channel-item">
            <label className="channel-label">
              Ch {startChannel + index}
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={value}
              onChange={(e) => handleChannelChange(index, e.target.value)}
              className="channel-slider"
            />
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="255"
              value={value}
              onChange={(e) => handleChannelChange(index, e.target.value)}
              className="channel-value"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChannelGridView
