import { useState } from 'react'
import { MinusIcon, PlusIcon } from '@/components/icons'
import { ResponsiveModal } from '@/components/ResponsiveModal'
import { AnimatedNumber, Button, IconButton } from '@/components/ui'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/cn'

export interface SleepLogSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLog: (hours: number, quality: number) => void | Promise<void>
}

const HOURS_STEP = 0.5
const MIN_HOURS = 0
const MAX_HOURS = 14
const DEFAULT_HOURS = 7.5
const DEFAULT_QUALITY = 3

function roundToStep(value: number): number {
  return Math.round(value / HOURS_STEP) * HOURS_STEP
}

export function SleepLogSheet({ open, onOpenChange, onLog }: SleepLogSheetProps) {
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  const [isLogging, setIsLogging] = useState(false)

  // Reset the form whenever the sheet transitions to open — same
  // "adjust state when a prop changes" idiom as LogTimeSheet.tsx.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setHours(DEFAULT_HOURS)
      setQuality(DEFAULT_QUALITY)
    }
  }

  const decrement = useLongPress(() => setHours((current) => Math.max(MIN_HOURS, roundToStep(current - HOURS_STEP))))
  const increment = useLongPress(() => setHours((current) => Math.min(MAX_HOURS, roundToStep(current + HOURS_STEP))))

  async function handleLog() {
    setIsLogging(true)
    try {
      await onLog(hours, quality)
      onOpenChange(false)
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Log sleep">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-6">
            <IconButton aria-label="Decrease hours" variant="subtle" size="lg" {...decrement}>
              <MinusIcon />
            </IconButton>
            <AnimatedNumber
              value={hours}
              format={(value) => value.toFixed(1)}
              className="min-w-[4ch] text-center text-hero leading-none text-text"
            />
            <IconButton aria-label="Increase hours" variant="subtle" size="lg" {...increment}>
              <PlusIcon />
            </IconButton>
          </div>
          <span className="text-[length:var(--text-small)] text-text-2">hours</span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="text-[length:var(--text-small)] text-text-2">How was it?</span>
          <div className="flex gap-2" role="radiogroup" aria-label="Sleep quality">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-label={`Quality ${level} of 5`}
                aria-checked={quality === level}
                onClick={() => setQuality(level)}
                className="flex min-h-11 min-w-11 items-center justify-center"
              >
                <span
                  className={cn('h-3 w-3 rounded-full transition-colors', level <= quality ? 'bg-accent' : 'bg-chunk-empty')}
                />
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={() => void handleLog()} disabled={isLogging}>
          Log sleep
        </Button>
      </div>
    </ResponsiveModal>
  )
}
