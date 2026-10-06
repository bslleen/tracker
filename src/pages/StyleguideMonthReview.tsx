import { useState } from 'react'
import type { ApplyMonthReviewResult, DeletedGoalSnapshot, GoalReviewChoice } from '@/data/monthReviewWrites'
import type { Goal } from '@/data/types'
import { MonthReviewContent } from '@/features/month/MonthReviewContent'
import { currentMonth } from '@/lib/chunks'

const FAKE_TIMESTAMP = {} as Goal['createdAt']
const NAMES = ['French', 'Chess openings and middlegame strategy', 'Algebra II', 'Guitar', 'Spanish', 'Pottery', 'Running', 'Typing', 'Chemistry', 'Watercolor', 'Piano', 'Welding basics']

function makeGoals(count: number): Goal[] {
  return Array.from({ length: count }, (_, index) => {
    // One goal in every set is finished, to exercise the "complete, Archive only" path.
    const isComplete = count > 1 && index === 0
    const chunkMinutes = 15
    const totalChunks = 20 + index * 4
    const completedChunks = isComplete ? totalChunks : Math.round((totalChunks * ((index * 37) % 90)) / 100)

    return {
      id: `goal-${index}`,
      name: NAMES[index % NAMES.length]!,
      month: currentMonth(),
      totalMinutes: totalChunks * chunkMinutes,
      chunkMinutes,
      completedChunks,
      carryMinutes: 0,
      status: 'active',
      hue: (index * 7) % 30,
      createdAt: FAKE_TIMESTAMP,
      updatedAt: FAKE_TIMESTAMP,
    }
  })
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type DatasetKey = '0' | '1' | '6' | '12'
const DATASETS: Record<DatasetKey, Goal[]> = {
  '0': makeGoals(0),
  '1': makeGoals(1),
  '6': makeGoals(6),
  '12': makeGoals(12),
}

/** Dev-only harness for /month — fake writes stand in for Firestore so 0/1/6/12-goal months can be driven by a real browser. */
export default function StyleguideMonthReview() {
  const [datasetKey, setDatasetKey] = useState<DatasetKey>('6')
  // Remounts MonthReviewContent on dataset switch so its internal "frozen
  // snapshot once applied" state doesn't carry over between fixture runs.
  const [resetKey, setResetKey] = useState(0)

  async function fakeApply(choices: GoalReviewChoice[]): Promise<ApplyMonthReviewResult> {
    await delay(500)
    const deleted: DeletedGoalSnapshot[] = choices
      .filter((choice) => choice.decision === 'delete')
      .map((choice) => ({ goal: choice.goal, sessions: [] }))
    return { deleted }
  }

  async function fakeRestore(): Promise<void> {
    await delay(300)
  }

  return (
    <main className="min-h-dvh bg-bg p-[var(--gutter)] text-text">
      <div className="mx-auto mb-8 flex max-w-[1200px] flex-wrap gap-2" data-testid="fixture-controls">
        {(Object.keys(DATASETS) as DatasetKey[]).map((key) => (
          <button
            key={key}
            type="button"
            data-testid={`fixture-dataset-${key}`}
            onClick={() => {
              setDatasetKey(key)
              setResetKey((n) => n + 1)
            }}
            className="min-h-11 rounded-full border border-hairline px-3 text-[length:var(--text-small)] text-text-2 hover:text-text"
          >
            {key} goals
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-[1200px]">
        <MonthReviewContent
          key={resetKey}
          reviewMonth={currentMonth()}
          goals={DATASETS[datasetKey]}
          isLoading={false}
          onApply={fakeApply}
          onRestore={fakeRestore}
        />
      </div>
    </main>
  )
}
