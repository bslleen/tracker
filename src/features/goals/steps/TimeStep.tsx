import { MinusIcon, PlusIcon } from '@/components/icons'
import { AnimatedNumber, IconButton } from '@/components/ui'
import { useLongPress } from '@/hooks/useLongPress'
import { MAX_HOURS, MIN_HOURS } from '../newGoalState'

export interface TimeStepProps {
  hours: number
  playlistNote: string
  onHoursChange: (hours: number) => void
  onPlaylistNoteChange: (note: string) => void
}

export function TimeStep({ hours, playlistNote, onHoursChange, onPlaylistNoteChange }: TimeStepProps) {
  const decrement = useLongPress(() => onHoursChange(Math.max(MIN_HOURS, hours - 1)))
  const increment = useLongPress(() => onHoursChange(Math.min(MAX_HOURS, hours + 1)))

  return (
    <div className="flex flex-col gap-10">
      <h2 className="text-[length:var(--text-small)] text-text-2">How many hours total?</h2>

      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-6">
          <IconButton
            aria-label="Decrease hours"
            variant="subtle"
            size="lg"
            disabled={hours <= MIN_HOURS}
            {...decrement}
          >
            <MinusIcon />
          </IconButton>

          <div className="flex min-w-[4ch] flex-col items-center">
            <AnimatedNumber value={hours} className="text-hero leading-none text-text" />
          </div>

          <IconButton
            aria-label="Increase hours"
            variant="subtle"
            size="lg"
            disabled={hours >= MAX_HOURS}
            {...increment}
          >
            <PlusIcon />
          </IconButton>
        </div>
        <span className="text-[length:var(--text-small)] text-text-2">hours total</span>

        <input
          type="range"
          min={MIN_HOURS}
          max={MAX_HOURS}
          step={1}
          value={hours}
          onChange={(event) => onHoursChange(Number(event.target.value))}
          aria-label="Total hours"
          className="w-full accent-[var(--accent)]"
        />
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[length:var(--text-small)] text-text-2">I have a playlist (optional)</span>
        <input
          type="text"
          value={playlistNote}
          onChange={(event) => onPlaylistNoteChange(event.target.value)}
          placeholder="e.g. Andrew Ng ML — 48 videos"
          maxLength={200}
          className="rounded-md border border-hairline bg-surface-2 px-3 py-2 text-[length:var(--text-body)] text-text outline-none placeholder:text-text-2 focus-visible:border-accent"
        />
      </label>
    </div>
  )
}
