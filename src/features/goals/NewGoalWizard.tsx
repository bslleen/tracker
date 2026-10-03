import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useReducer, useState } from 'react'
import { createGoal } from '@/data/goalWrites'
import { useAuth } from '@/data/useAuth'
import { Button } from '@/components/ui'
import { currentMonth, nextMonth } from '@/lib/chunks'
import { StepProgress } from './StepProgress'
import { ChunksStep } from './steps/ChunksStep'
import { NameStep } from './steps/NameStep'
import { TimeStep } from './steps/TimeStep'
import { canLeaveStep, createInitialState, newGoalReducer, resolveChunkMinutes } from './newGoalState'

export interface NewGoalWizardProps {
  existingGoalCount: number
  onCreated: (goalId: string) => void
  onCancel: () => void
}

const STEP_COUNT = 3

const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -32 : 32, opacity: 0 }),
}

export function NewGoalWizard({ existingGoalCount, onCreated, onCancel }: NewGoalWizardProps) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(newGoalReducer, undefined, createInitialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const baseMonth = useMemo(() => currentMonth(), [])

  const canContinue = canLeaveStep(state)

  async function handleSubmit() {
    const chunkMinutes = resolveChunkMinutes(state)
    if (!user || !chunkMinutes) return

    setIsSubmitting(true)
    setError(null)
    try {
      const month = state.startNextMonth ? nextMonth(baseMonth) : baseMonth
      const hue = (existingGoalCount * 11) % 31
      const goalId = await createGoal({
        uid: user.uid,
        name: state.name.trim(),
        month,
        totalMinutes: state.hours * 60,
        chunkMinutes,
        hue,
        playlistNote: state.playlistNote.trim() || undefined,
      })
      onCreated(goalId)
    } catch {
      setError('Could not create the goal. Try again.')
      setIsSubmitting(false)
    }
  }

  function handleNext() {
    if (!canContinue) return
    if (state.step === 2) {
      void handleSubmit()
      return
    }
    dispatch({ type: 'NEXT' })
  }

  return (
    <div className="flex flex-col gap-8">
      <StepProgress step={state.step} count={STEP_COUNT} />

      <div className="relative min-h-[22rem] overflow-hidden">
        <AnimatePresence custom={state.direction} mode="wait" initial={false}>
          <motion.div
            key={state.step}
            custom={state.direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {state.step === 0 && (
              <NameStep
                name={state.name}
                onChange={(name) => dispatch({ type: 'SET_NAME', name })}
                onSubmit={handleNext}
              />
            )}
            {state.step === 1 && (
              <TimeStep
                hours={state.hours}
                playlistNote={state.playlistNote}
                onHoursChange={(hours) => dispatch({ type: 'SET_HOURS', hours })}
                onPlaylistNoteChange={(note) => dispatch({ type: 'SET_PLAYLIST_NOTE', note })}
              />
            )}
            {state.step === 2 && (
              <ChunksStep
                state={state}
                baseMonth={baseMonth}
                onChunkPresetChange={(preset) => dispatch({ type: 'SET_CHUNK_PRESET', preset })}
                onCustomChunkChange={(value) => dispatch({ type: 'SET_CUSTOM_CHUNK', value })}
                onToggleStartNextMonth={() => dispatch({ type: 'TOGGLE_START_NEXT_MONTH' })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p className="text-[length:var(--text-small)] text-danger">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => (state.step === 0 ? onCancel() : dispatch({ type: 'BACK' }))}
          disabled={isSubmitting}
        >
          {state.step === 0 ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex flex-col items-end gap-1">
          <Button onClick={handleNext} disabled={!canContinue || isSubmitting}>
            {state.step === 2 ? 'Create goal' : 'Continue'}
          </Button>
          {!canContinue && (
            <span className="text-[length:var(--text-small)] text-text-2">
              {state.step === 0 ? 'Give it a name to continue' : 'Pick a chunk size to continue'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
