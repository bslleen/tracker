import { useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, SegmentedToggle } from '@/components/ui'
import type { SpendingEntry } from '@/data/types'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { SpendingAddSheet } from './SpendingAddSheet'
import { SpendingDonutChart } from './SpendingDonutChart'
import { SpendingList } from './SpendingList'
import { SpendingTreemap } from './SpendingTreemap'
import { computeDonutSegments, groupByCategory, monthTotal } from './spendingChart'

export interface SpendingAddInput {
  amount: number
  category: string
  note?: string
}

export interface SpendingContentProps {
  entries: SpendingEntry[]
  onAdd: (input: SpendingAddInput) => Promise<void>
  onDeleteEntry: (entry: SpendingEntry) => Promise<void>
  onRestoreEntry: (entry: SpendingEntry) => Promise<void>
}

type ChartMode = 'donut' | 'treemap'
const CHART_MODE_OPTIONS: { value: ChartMode; label: string }[] = [
  { value: 'donut', label: 'Donut' },
  { value: 'treemap', label: 'Treemap' },
]

export function SpendingContent({ entries, onAdd, onDeleteEntry, onRestoreEntry }: SpendingContentProps) {
  const prefersReducedMotion = useReducedMotion() ?? false
  const isWideScreen = useMediaQuery('(min-width: 1024px)')
  const [chartMode, setChartMode] = useState<ChartMode>('donut')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const categories = groupByCategory(entries)
  const segments = computeDonutSegments(categories)
  const total = monthTotal(entries)
  const filteredEntries = selectedCategory ? entries.filter((entry) => entry.category === selectedCategory) : entries
  const showTreemap = isWideScreen && chartMode === 'treemap'

  async function handleAdd(input: SpendingAddInput) {
    try {
      await onAdd(input)
    } catch {
      toast.error('Could not add that. Try again.')
    }
  }

  async function handleDelete(entry: SpendingEntry) {
    try {
      await onDeleteEntry(entry)
      toast(`Deleted $${Math.round(entry.amount)} · ${entry.category}`, {
        duration: 10_000,
        action: {
          label: 'Undo',
          onClick: () => {
            void onRestoreEntry(entry).then(
              () => toast('Restored'),
              () => toast.error('Could not restore that entry'),
            )
          },
        },
      })
    } catch {
      toast.error('Could not delete that. Try again.')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">Spending</h1>

      <div className="flex items-center justify-end">
        <Button onClick={() => setIsAddOpen(true)}>Add spending</Button>
      </div>

      {categories.length === 0 ? (
        <p className="text-[length:var(--text-small)] text-text-2">No spending logged yet this month.</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {isWideScreen && categories.length > 1 && (
            <SegmentedToggle options={CHART_MODE_OPTIONS} value={chartMode} onChange={setChartMode} ariaLabel="Chart style" />
          )}
          {showTreemap ? (
            <div className="w-full">
              <SpendingTreemap
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>
          ) : (
            <SpendingDonutChart
              segments={segments}
              total={total}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              prefersReducedMotion={prefersReducedMotion}
            />
          )}
        </div>
      )}

      <SpendingList entries={filteredEntries} onDelete={(entry) => void handleDelete(entry)} />

      <SpendingAddSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        existingCategories={categories.map((c) => c.category)}
        onAdd={handleAdd}
      />
    </div>
  )
}
