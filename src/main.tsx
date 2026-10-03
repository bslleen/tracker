import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { ToastPortal } from './components/ToastPortal.tsx'
import { LenisProvider } from './lib/lenis.tsx'
import './index.css'

const container = document.getElementById('app-root')
if (!container) {
  throw new Error('#app-root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <LenisProvider>
        <App />
      </LenisProvider>
    </BrowserRouter>
    <ToastPortal />
  </StrictMode>,
)
