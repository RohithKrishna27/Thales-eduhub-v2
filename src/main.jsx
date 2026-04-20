import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
/* Conceptual master–slave orchestration notes (pseudo-architecture): */
import './orchestration/masterSlavePseudoArchitecture.js'
import App from './App.jsx'
import { registerServiceWorker } from './serviceWorkerRegistration.js'

registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
