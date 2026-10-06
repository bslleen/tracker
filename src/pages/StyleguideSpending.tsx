import { useState } from 'react'
import type { SpendingEntry } from '@/data/types'
import { SpendingContent } from '@/features/spending/SpendingContent'
import { useToday } from '@/hooks/useToday'
import { dateKey } from '@/lib/streak'

const FAKE_TIMESTAMP = {} as SpendingEntry['createdAt']
const CATEGORIES = ['Food', 'Transport', 'Fun', 'Learning', 'Other']

function buildFixtureEntries(today: Date): SpendingEntry[] {
  const entries: SpendingEntry[] = []
  let id = 0
  for (let daysAgo = 0; daysAgo < 20; daysAgo += 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    const entryCount = daysAgo % 3 // 0, 1, or 2 entries that day
    for (let i = 0; i < entryCount; i += 1) {
      id += 1
      const category = CATEGORIES[(daysAgo + i) % CATEGORIES.length]!
      const amount = 5 + ((daysAgo * 7 + i * 13) % 60)
      entries.push({
        id: `entry-${id}`,
        date: dateKey(date),
        amount,
        category,
        note: i === 0 ? 'Fixture entry' : undefined,
        createdAt: FAKE_TIMESTAMP,
      })
    }
  }
  return entries
}

/** Dev-only harness for /spending — fixture entries instead of real Firestore data, and no-Firestore write stubs (mirroring undo/delete without a backend). */
export default function StyleguideSpending() {
  const today = useToday()
  const [entries, setEntries] = useState<SpendingEntry[]>(() => buildFixtureEntries(today))
  const [hasData, setHasData] = useState(true)

  async function handleAdd(input: { amount: number; category: string; note?: string }) {
    const entry: SpendingEntry = {
      id: `entry-new-${Date.now()}`,
      date: dateKey(today),
      amount: input.amount,
      category: input.category,
      note: input.note,
      createdAt: FAKE_TIMESTAMP,
    }
    setEntries((current) => [entry, ...current])
  }

  async function handleDelete(entry: SpendingEntry) {
    setEntries((current) => current.filter((e) => e.id !== entry.id))
  }

  async function handleRestore(entry: SpendingEntry) {
    setEntries((current) => [entry, ...current])
  }

  return (
    <main className="min-h-dvh bg-bg p-[var(--gutter)] text-text">
      <div className="mx-auto mb-8 flex max-w-[1200px] flex-wrap gap-2">
        <button
          type="button"
          data-testid="fixture-toggle-data"
          onClick={() => {
            setHasData((value) => !value)
            setEntries((current) => (current.length > 0 ? [] : buildFixtureEntries(today)))
          }}
          className="min-h-11 rounded-full border border-hairline px-3 text-[length:var(--text-small)] text-text-2 hover:text-text"
        >
          {hasData ? 'Show empty' : 'Show data'}
        </button>
      </div>

      <div className="mx-auto max-w-[1200px]">
        <SpendingContent entries={entries} onAdd={handleAdd} onDeleteEntry={handleDelete} onRestoreEntry={handleRestore} />
      </div>
    </main>
  )
}
