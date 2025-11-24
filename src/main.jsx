import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/TouchOptimization.css'

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  alert('Error: ' + event.error.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  alert('Promise error: ' + event.reason)
})

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Fatal error during render:', error)
  alert('Fatal error: ' + error.message)
  document.body.innerHTML = '<div style="color: white; padding: 20px;">ERROR: ' + error.message + '</div>'
}
