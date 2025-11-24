import React, { useState, useRef, useEffect } from 'react'
import '../styles/CLI.css'
import { CLIParser } from '../utils/cliParser'

/**
 * Command Line Interface - MA3/Hog style
 * Serves as the backbone for all show control operations
 */
function CLI({ onCommand, appState }) {
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState('') // 'success', 'error', 'info'
  const inputRef = useRef(null)
  const parserRef = useRef(new CLIParser())

  // Auto-focus CLI on mount and when escape is pressed
  useEffect(() => {
    const handleGlobalKeyPress = (e) => {
      // Focus CLI when user starts typing (not in another input)
      if (
        !e.target.matches('input, textarea, select') &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        inputRef.current?.focus()
      }

      // Escape focuses CLI
      if (e.key === 'Escape') {
        inputRef.current?.focus()
        setInput('')
      }
    }

    window.addEventListener('keydown', handleGlobalKeyPress)
    return () => window.removeEventListener('keydown', handleGlobalKeyPress)
  }, [])

  const showFeedback = (message, type = 'info') => {
    setFeedback(message)
    setFeedbackType(type)
    setTimeout(() => {
      setFeedback('')
      setFeedbackType('')
    }, 3000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const parser = parserRef.current

    // If empty command, add "BAM!" to history
    if (!input.trim()) {
      parser.addToHistory('BAM!')
      showFeedback('BAM!', 'info')
      return
    }

    const command = parser.parse(input)

    // Execute command via callback
    if (onCommand) {
      const result = onCommand(command)

      // Show feedback
      if (result) {
        if (result.success) {
          showFeedback(result.message || 'Command executed', 'success')
        } else {
          showFeedback(result.message || 'Command failed', 'error')
        }
      }
    }

    // Clear input
    setInput('')
  }

  const handleKeyDown = (e) => {
    const parser = parserRef.current

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = parser.historyUp()
      if (prev !== null) {
        setInput(prev)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = parser.historyDown()
      if (next !== null) {
        setInput(next)
      }
    } else if (e.key === 'Escape') {
      setInput('')
    }
  }

  const { selectedFixtures = new Set(), fixtures = [] } = appState || {}
  const selectedCount = selectedFixtures.size
  const selectedNames = fixtures
    .filter(f => selectedFixtures.has(f.id))
    .map(f => f.name)
    .slice(0, 2)
    .join(', ')

  return (
    <div className="cli-container">
      <form onSubmit={handleSubmit} className="cli-form">
        <div className="cli-status">
          <span className="cli-prompt">CMD</span>
          {selectedCount > 0 && (
            <span className="cli-selection">
              {selectedCount} selected
              {selectedNames && ` (${selectedNames}${selectedCount > 2 ? '...' : ''})`}
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          className="cli-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command (e.g., 'fixture 1', 'red at 255', 'clear')..."
          autoComplete="off"
          spellCheck="false"
        />
        {feedback && (
          <div className={`cli-feedback ${feedbackType}`}>
            {feedback}
          </div>
        )}
      </form>
    </div>
  )
}

export default CLI
