import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useState } from 'react'
import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatedNumber } from '@/components/ui'
import type { Goal } from '@/data/types'
import { GoalCard } from '@/features/goals/GoalCard'
import { ChunkGrid } from '@/features/goals/ChunkGrid'
import { chunkCount, formatHoursMinutes, percentComplete, remainingMinutes } from '@/lib/chunks'

const FAKE_TIMESTAMP = {} as Goal['createdAt']

const FIXTURE_GOALS: Goal[] = [
  {
    id: 'french',
    name: 'French',
    month: '2026-10',
    totalMinutes: 2400,
    chunkMinutes: 15,
    completedChunks: 80,
    carryMinutes: 5,
    status: 'active',
    hue: 0,
    createdAt: FAKE_TIMESTAMP,
    updatedAt: FAKE_TIMESTAMP,
  },
  {
    id: 'chess',
    name: 'Chess openings',
    month: '2026-10',
    totalMinutes: 1200,
    chunkMinutes: 10,
    completedChunks: 40,
    carryMinutes: 0,
    status: 'active',
    hue: 18,
    createdAt: FAKE_TIMESTAMP,
    updatedAt: FAKE_TIMESTAMP,
  },
]

/**
 * Dev-only harness for the card<->detail shared layout transition, using
 * fixture data instead of real Firestore goals. GoalCard itself is the real
 * production component (it takes `goal` as a plain prop, so no Firebase
 * mocking is needed); the "detail" side is a stand-in that mirrors
 * GoalDetail.tsx's shell/progress/grid structure and layoutIds exactly,
 * since that structure — not the sessions list or kebab menu — is what
 * actually needs exercising here. This exists specifically so the morph
 * can be driven by a real browser (Playwright) without needing seeded data.
 */
export default function StyleguideGoalCard() {
  return (
    <main className="min-h-dvh bg-bg p-[var(--gutter)] text-text">
      <LayoutGroup id="goals">
        <AnimatePresence mode="popLayout" initial={false}>
          <RoutedContent />
        </AnimatePresence>
      </LayoutGroup>
    </main>
  )
}

function RoutedContent() {
  const location = useLocation()
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
    >
      {/* Relative to the already-consumed "/styleguide/goal-card" prefix from
          the parent "/styleguide/goal-card/*" route in App.tsx — unlike
          AnimatedRoutes.tsx's absolute-looking children, which work because
          their parent is mounted at the bare "/*" (an empty consumed prefix). */}
      <Routes location={location}>
        <Route path="/" element={<FixtureDashboard />} />
        <Route path="/:id" element={<FixtureDetail />} />
      </Routes>
    </motion.div>
  )
}

function FixtureDashboard() {
  return (
    <div className="isolate grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="fixture-dashboard">
      {FIXTURE_GOALS.map((goal) => (
        <GoalCard key={goal.id} goal={goal} linkTo={`/styleguide/goal-card/${goal.id}`} />
      ))}
    </div>
  )
}

function FixtureDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goal = FIXTURE_GOALS.find((candidate) => candidate.id === id)
  const [isAnimatingLayout, setIsAnimatingLayout] = useState(false)

  if (!goal) return <p>Not found</p>

  const total = chunkCount(goal.totalMinutes, goal.chunkMinutes)
  const percent = percentComplete(goal.completedChunks, total)
  const chunksLeft = total - goal.completedChunks
  const minutesLeft = remainingMinutes(goal.totalMinutes, goal.chunkMinutes, goal.completedChunks)

  return (
    <div className="flex flex-col gap-8" data-testid="fixture-detail">
      <button type="button" onClick={() => navigate(-1)} data-testid="fixture-back">
        Back
      </button>

      <motion.div
        layout
        layoutId={`goal-shell-${goal.id}`}
        onLayoutAnimationStart={() => setIsAnimatingLayout(true)}
        onLayoutAnimationComplete={() => setIsAnimatingLayout(false)}
        className={isAnimatingLayout ? 'relative z-raised rounded-xl border border-hairline bg-surface p-6' : 'relative rounded-xl border border-hairline bg-surface p-6'}
      >
        <h1 className="mb-6 text-title text-text">{goal.name}</h1>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <motion.div layout layoutId={`goal-progress-${goal.id}`} className="flex flex-col items-start gap-2 lg:w-[38%]">
            <AnimatedNumber value={Math.round(percent)} format={(value) => `${Math.round(value)}%`} className="text-hero leading-none text-text" />
            <p className="text-[length:var(--text-small)] text-text-2">
              {chunksLeft} chunks left · {formatHoursMinutes(minutesLeft)} left
            </p>
          </motion.div>

          <motion.div layout layoutId={`goal-grid-${goal.id}`} className="lg:w-[62%]">
            <ChunkGrid total={total} completed={goal.completedChunks} chunkMinutes={goal.chunkMinutes} accentShade={goal.hue} size="lg" label={goal.name} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
