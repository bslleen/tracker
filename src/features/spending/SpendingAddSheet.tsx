import { useMemo, useState } from 'react'
import { MinusIcon, PlusIcon } from '@/components/icons'
import { ResponsiveModal } from '@/components/ResponsiveModal'
import { AnimatedNumber, Button, IconButton } from '@/components/ui'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/cn'

export interface SpendingAddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Categories already used this month — surfaced as chips ahead of the defaults, so recently-used ones are quickest to reach. */
  existingCategories: string[]
  onAdd: (input: { amount: number; category: string; note?: string }) => void | Promise<void>
}

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun', 'Learning', 'Other']
const AMOUNT_STEP = 1
const MAX_AMOUNT = 100_000

export function SpendingAddSheet({ open, onOpenChange, existingCategories, onAdd }: SpendingAddSheetProps) {
  const categories = useMemo(() => {
    const merged = [...existingCategories, ...DEFAULT_CATEGORIES]
    return Array.from(new Set(merged))
  }, [existingCategories])

  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState(categories[0] ?? DEFAULT_CATEGORIES[0]!)
  const [note, setNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setAmount(0)
      setCategory(categories[0] ?? DEFAULT_CATEGORIES[0]!)
      setNote('')
    }
  }

  const decrement = useLongPress(() => setAmount((current) => Math.max(0, current - AMOUNT_STEP)))
  const increment = useLongPress(() => setAmount((current) => Math.min(MAX_AMOUNT, current + AMOUNT_STEP)))

  async function handleAdd() {
    if (amount <= 0) return
    setIsAdding(true)
    try {
      await onAdd({ amount, category, note: note.trim() || undefined })
      onOpenChange(false)
    } finally {
      setIsAdding(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Add spending">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-6">
            <IconButton aria-label="Decrease amount" variant="subtle" size="lg" {...decrement}>
              <MinusIcon />
            </IconButton>
            <AnimatedNumber
              value={amount}
              format={(value) => `$${Math.round(value)}`}
              className="min-w-[4ch] text-center text-hero leading-none text-text"
            />
            <IconButton aria-label="Increase amount" variant="subtle" size="lg" {...increment}>
              <PlusIcon />
            </IconButton>
          </div>
          <span className="text-[length:var(--text-small)] text-text-2">{today}</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[length:var(--text-small)] text-text-2">Category</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={category === option}
                onClick={() => setCategory(option)}
                className={cn(
                  'min-h-9 rounded-full border px-3 text-[length:var(--text-small)] transition-colors',
                  category === option ? 'border-accent bg-accent/10 text-text' : 'border-hairline text-text-2 hover:text-text',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[length:var(--text-small)] text-text-2">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What was it for?"
            maxLength={120}
            className="min-h-11 rounded-md border border-hairline bg-surface-2 px-3 text-[length:var(--text-body)] text-text outline-none placeholder:text-text-2 focus-visible:border-accent"
          />
        </label>

        <Button onClick={() => void handleAdd()} disabled={amount <= 0 || isAdding}>
          Add spending
        </Button>
      </div>
    </ResponsiveModal>
  )
}
