import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './kid-skin.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { initKidSidebar } from './lib/kidSidebar'
import { registerServiceWorker } from './lib/registerServiceWorker'
import './lib/pwaInstall'

initKidSidebar()
// PWA: install support + offline shell (production builds only)
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
