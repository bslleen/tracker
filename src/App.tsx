import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { AuthGate } from '@/components/AuthGate'
import { TooltipProvider } from '@/components/ui'

const Styleguide = lazy(() => import('./pages/Styleguide'))
const StyleguideGrid = lazy(() => import('./pages/StyleguideGrid'))
const StyleguideGoalCard = lazy(() => import('./pages/StyleguideGoalCard'))
const StyleguideFocus = lazy(() => import('./pages/StyleguideFocus'))
const StyleguideDashboard = lazy(() => import('./pages/StyleguideDashboard'))
const StyleguideMonthReview = lazy(() => import('./pages/StyleguideMonthReview'))
const StyleguideHeatmap = lazy(() => import('./pages/StyleguideHeatmap'))
const StyleguideSleep = lazy(() => import('./pages/StyleguideSleep'))
const StyleguideSpending = lazy(() => import('./pages/StyleguideSpending'))
const StyleguideReview = lazy(() => import('./pages/StyleguideReview'))

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
        {import.meta.env.DEV && (
          <Route
            path="/styleguide/goal-card/*"
            element={
              <Suspense fallback={null}>
                <StyleguideGoalCard />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path="/styleguide/focus"
            element={
              <Suspense fallback={null}>
                <StyleguideFocus />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path="/styleguide/dashboard"
            element={
              <Suspense fallback={null}>
                <StyleguideDashboard />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path="/styleguide/month"
            element={
              <Suspense fallback={null}>
                <StyleguideMonthReview />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path="/styleguide/heatmap"
            element={
              <Suspense fallback={null}>
                <StyleguideHeatmap />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path="/styleguide/sleep"
            element={
              <Suspense fallback={null}>
                <StyleguideSleep />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path="/styleguide/spending"
            element={
              <Suspense fallback={null}>
                <StyleguideSpending />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path="/styleguide/review"
            element={
              <Suspense fallback={null}>
                <StyleguideReview />
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
