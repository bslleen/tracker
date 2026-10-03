import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { AuthGate } from '@/components/AuthGate'
import { TooltipProvider } from '@/components/ui'

const Styleguide = lazy(() => import('./pages/Styleguide'))
const StyleguideGrid = lazy(() => import('./pages/StyleguideGrid'))

function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <Routes>
        {import.meta.env.DEV && (
          <Route
            path="/styleguide"
            element={
              <Suspense fallback={null}>
                <Styleguide />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path="/styleguide/grid"
            element={
              <Suspense fallback={null}>
                <StyleguideGrid />
              </Suspense>
            }
          />
        )}
        <Route
          path="/*"
          element={
            <AuthGate>
              <AppShell />
            </AuthGate>
          }
        />
      </Routes>
    </TooltipProvider>
  )
}

export default App
