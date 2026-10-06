import { cn } from '@/lib/cn'

export interface SegmentedToggleOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedToggleProps<T extends string> {
  options: SegmentedToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/** The small pill-group control used for range/view toggles throughout the app. */
export function SegmentedToggle<T extends string>({ options, value, onChange, ariaLabel }: SegmentedToggleProps<T>) {
  return (
    <div className="inline-flex w-fit gap-1 rounded-full border border-hairline p-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
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
