import React from 'react'
import '../../styles/views/FixturesView.css'

function FixturesView({ fixtures, selectedFixtures, toggleFixtureSelection }) {
  return (
    <div className="fixtures-view">
      <div className="fixture-grid">
        {fixtures.map((fixture) => {
          const isVideo = fixture.is_video || fixture.fixture_type === 'video'

          return (
            <div
              key={fixture.id}
              className={`fixture-item ${selectedFixtures.has(fixture.id) ? 'selected' : ''} ${isVideo ? 'video-fixture' : ''}`}
              onClick={() => toggleFixtureSelection(fixture.id)}
            >
              <div className="fixture-type-icon">
                {isVideo ? '🎬' : '💡'}
              </div>
              <div className="fixture-number">{fixture.channel_number || fixture.id}</div>
              <div className="fixture-name">{fixture.name}</div>
              <div className="fixture-address">
                {isVideo ? (
                  <span className="video-source">
                    {fixture.video_source_type === 'ndi' && '📡 NDI'}
                    {fixture.video_source_type === 'file' && '📁 FILE'}
                    {!fixture.video_source_type && '🎬 VIDEO'}
                  </span>
                ) : (
                  <span>U{fixture.universe}:{fixture.dmx_address}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FixturesView
