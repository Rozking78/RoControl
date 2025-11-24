import React, { useState } from 'react'
import '../../styles/views/VideoFixturePatch.css'

/**
 * Video Fixture Patch Component
 * Allows patching video sources (File or NDI) as fixtures
 * Video fixtures have channel numbers but no DMX address
 */
function VideoFixturePatch({ onAddVideoFixture, onClose }) {
  const [fixtureName, setFixtureName] = useState('')
  const [channelNumber, setChannelNumber] = useState('')
  const [sourceType, setSourceType] = useState('file') // 'file' or 'ndi'
  const [sourcePath, setSourcePath] = useState('')
  const [ndiStreams, setNdiStreams] = useState([
    // Placeholder - in real implementation, would discover NDI sources
    { name: 'NDI Source 1', id: 'ndi1' },
    { name: 'NDI Source 2', id: 'ndi2' },
  ])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!fixtureName || !channelNumber) {
      alert('Please fill in fixture name and channel number')
      return
    }

    if (sourceType === 'file' && !sourcePath) {
      alert('Please select a video file')
      return
    }

    if (sourceType === 'ndi' && !sourcePath) {
      alert('Please select an NDI stream')
      return
    }

    const videoFixture = {
      id: `video_${Date.now()}`,
      name: fixtureName,
      fixture_type: 'video',
      channel_number: parseInt(channelNumber),
      is_video: true,
      video_source_type: sourceType,
      video_source_path: sourcePath,
      // No DMX address for video fixtures
      dmx_address: 0,
      universe: 0,
      channel_count: 1,
    }

    if (onAddVideoFixture) {
      onAddVideoFixture(videoFixture)
    }

    // Reset form
    setFixtureName('')
    setChannelNumber('')
    setSourcePath('')
  }

  const handleFileSelect = async () => {
    // In real implementation, would use Tauri file picker
    // For now, simulate file selection
    const filePath = prompt('Enter video file path:')
    if (filePath) {
      setSourcePath(filePath)
    }
  }

  return (
    <div className="video-fixture-patch">
      <div className="patch-header">
        <h2>Patch Video Fixture</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="patch-form">
        <div className="form-section">
          <label>Fixture Name</label>
          <input
            type="text"
            value={fixtureName}
            onChange={(e) => setFixtureName(e.target.value)}
            placeholder="e.g., Video 1"
            className="patch-input"
          />
        </div>

        <div className="form-section">
          <label>Channel Number</label>
          <input
            type="number"
            value={channelNumber}
            onChange={(e) => setChannelNumber(e.target.value)}
            placeholder="e.g., 1"
            min="1"
            className="patch-input"
          />
          <div className="field-hint">
            Video fixtures have channel numbers but no DMX address
          </div>
        </div>

        <div className="form-section">
          <label>Source Type</label>
          <div className="source-type-selector">
            <button
              type="button"
              className={`source-type-btn ${sourceType === 'file' ? 'active' : ''}`}
              onClick={() => {
                setSourceType('file')
                setSourcePath('')
              }}
            >
              <span className="source-icon">📁</span>
              Video File
            </button>
            <button
              type="button"
              className={`source-type-btn ${sourceType === 'ndi' ? 'active' : ''}`}
              onClick={() => {
                setSourceType('ndi')
                setSourcePath('')
              }}
            >
              <span className="source-icon">📡</span>
              NDI Stream
            </button>
          </div>
        </div>

        {sourceType === 'file' && (
          <div className="form-section">
            <label>Video File</label>
            <div className="file-selector">
              <input
                type="text"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder="Select or enter file path..."
                className="patch-input"
              />
              <button
                type="button"
                onClick={handleFileSelect}
                className="browse-btn"
              >
                Browse
              </button>
            </div>
            <div className="field-hint">
              Supported formats: MP4, MOV, AVI, MKV
            </div>
          </div>
        )}

        {sourceType === 'ndi' && (
          <div className="form-section">
            <label>NDI Stream</label>
            <select
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              className="patch-select"
            >
              <option value="">Select NDI stream...</option>
              {ndiStreams.map((stream) => (
                <option key={stream.id} value={stream.name}>
                  {stream.name}
                </option>
              ))}
            </select>
            <div className="field-hint">
              Available NDI sources on the network
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="patch-btn primary">
            Add Video Fixture
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="patch-btn secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="patch-info">
        <h3>About Video Fixtures</h3>
        <ul>
          <li>Video fixtures don't use DMX addresses</li>
          <li>They have channel numbers for control</li>
          <li>Can be controlled via intensity, position, and effects</li>
          <li>Support both file playback and live NDI streams</li>
          <li>Output to NDI for projection/LED walls</li>
        </ul>
      </div>
    </div>
  )
}

export default VideoFixturePatch
