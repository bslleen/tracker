import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const GoalDetail = lazy(() => import('@/pages/GoalDetail'))
const MonthReview = lazy(() => import('@/pages/MonthReview'))
const Heatmap = lazy(() => import('@/pages/Heatmap'))
const Sleep = lazy(() => import('@/pages/Sleep'))
const Spending = lazy(() => import('@/pages/Spending'))
const YearInReview = lazy(() => import('@/pages/YearInReview'))
const Settings = lazy(() => import('@/pages/Settings'))

/**
 * The location is frozen and passed explicitly to <Routes> so the OLD page
 * keeps rendering through its exit animation instead of being swapped out
 * the instant the URL changes. Only the content region animates — this
 * component is mounted inside <main>, never wrapping navigation or portals
 * (CLAUDE.md LAYERING RULES #5-6).
 */
export function AnimatedRoutes() {
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={null}>
          <Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/goals/:id" element={<GoalDetail />} />
            <Route path="/month" element={<MonthReview />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/sleep" element={<Sleep />} />
            <Route path="/spending" element={<Spending />} />
            <Route path="/review" element={<YearInReview />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}
