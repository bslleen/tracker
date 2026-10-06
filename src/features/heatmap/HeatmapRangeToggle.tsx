import { cn } from '@/lib/cn'
import type { HeatmapRange } from './heatmapGrid'

const OPTIONS: { value: HeatmapRange; label: string }[] = [
  { value: 'year', label: 'Year' },
  { value: '6months', label: '6 months' },
  { value: 'month', label: 'Month' },
]

export interface HeatmapRangeToggleProps {
  value: HeatmapRange
  onChange: (value: HeatmapRange) => void
}

export function HeatmapRangeToggle({ value, onChange }: HeatmapRangeToggleProps) {
  return (
    <div className="inline-flex w-fit gap-1 rounded-full border border-hairline p-1" role="group" aria-label="Time range">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-9 rounded-full px-3 text-[length:var(--text-small)] transition-colors',
            value === option.value ? 'bg-accent/15 text-text' : 'text-text-2 hover:text-text',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
