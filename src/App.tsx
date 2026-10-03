import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui'

const Styleguide = lazy(() => import('./pages/Styleguide'))

function Home() {
  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-bg text-text"
      style={{ paddingInline: 'var(--gutter)' }}
    >
      <p className="text-[length:var(--text-body)] text-text-2">Chunks</p>
    </main>
  )
}

function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <Routes>
        <Route path="/" element={<Home />} />
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
      </Routes>
    </TooltipProvider>
  )
}

export default App
