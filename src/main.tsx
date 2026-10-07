import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { LazyAmbientBackgroundPortal } from './components/LazyAmbientBackgroundPortal.tsx'
import { ToastPortal } from './components/ToastPortal.tsx'
import { LenisProvider } from './lib/lenis.tsx'
import { preloadFonts } from './lib/preloadFonts.ts'
import './index.css'

preloadFonts()

const container = document.getElementById('app-root')
if (!container) {
  throw new Error('#app-root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <LazyAmbientBackgroundPortal />
      <BrowserRouter>
        <LenisProvider>
          <App />
        </LenisProvider>
      </BrowserRouter>
      <ToastPortal />
    </ErrorBoundary>
  </StrictMode>,
)
