import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
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
 *
 * <LayoutGroup id="goals"> wraps every route (not just Dashboard/GoalDetail)
 * so the goal-card<->detail-page shared layoutId transition can bridge the
 * gap between them: a GoalCard and the GoalDetail page are never siblings in
 * the tree, only ever consecutive route renders, so the group needs to
 * outlive both. mode="popLayout" (rather than the previous "wait") is what
 * makes that bridge possible — it removes the exiting page from layout flow
 * immediately via position:absolute instead of waiting for its exit to
 * finish, so the entering page's shared element is already mounted while
 * Motion still has the exiting one's last measured rect to animate from.
 */
export function AnimatedRoutes() {
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <LayoutGroup id="goals">
      <AnimatePresence mode="popLayout" initial={false}>
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
    </LayoutGroup>
  )
}
