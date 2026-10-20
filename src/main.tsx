import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, getSavedTheme } from './utils/theme.utils'
import { startAuthTabSync } from './utils/auth-tab-sync'

applyTheme(getSavedTheme())
const stopAuthTabSync = startAuthTabSync()
if (import.meta.hot) import.meta.hot.dispose(stopAuthTabSync)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
