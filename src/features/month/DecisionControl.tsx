import { CheckIcon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { GoalReviewDecision } from '@/data/monthReviewWrites'

export interface DecisionControlProps {
  isComplete: boolean
  decision: GoalReviewDecision
  onSelect: (decision: Exclude<GoalReviewDecision, 'delete'>) => void
  onRequestDelete: () => void
  /** e.g. "58 chunks move to November" — only shown while decision === 'carryOver'. */
  carryOverPreview: string
  disabled?: boolean
}

const SEGMENTS: { value: 'carryOver' | 'archive'; label: string }[] = [
  { value: 'carryOver', label: 'Carry over' },
  { value: 'archive', label: 'Archive' },
]

/**
 * Three clear choices for an unfinished goal (carry over / archive / delete
 * — delete routes through a confirm dialog owned by the page, not this
 * component, so only one is ever mounted). Completed goals only ever offer
 * Archive, per the brief — shown as a quiet confirmed state rather than a
 * control with nothing to choose. "Mark as abandoned" is a secondary
 * override available either way.
 */
export function DecisionControl({
  isComplete,
  decision,
  onSelect,
  onRequestDelete,
  carryOverPreview,
  disabled = false,
}: DecisionControlProps) {
  const isAbandoned = decision === 'abandon'

  return (
    <div className="flex flex-col gap-2">
      {isComplete ? (
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[length:var(--text-small)] text-text">
          <CheckIcon width={14} height={14} className="text-accent" />
          {isAbandoned ? 'Will be marked as abandoned' : 'Archive'}
        </div>
      ) : (
        <div
          className={cn('inline-flex w-fit gap-1 rounded-full border border-hairline p-1', isAbandoned && 'opacity-40')}
          role="group"
          aria-label="What to do with this goal"
        >
          {SEGMENTS.map((segment) => (
            <button
              key={segment.value}
              type="button"
              disabled={disabled || isAbandoned}
              aria-pressed={decision === segment.value}
              onClick={() => onSelect(segment.value)}
              className={cn(
                'min-h-9 rounded-full px-3 text-[length:var(--text-small)] transition-colors',
                decision === segment.value ? 'bg-accent/15 text-text' : 'text-text-2 hover:text-text',
              )}
            >
              {segment.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled || isAbandoned}
            aria-pressed={decision === 'delete'}
            onClick={onRequestDelete}
            className={cn(
              'min-h-9 rounded-full px-3 text-[length:var(--text-small)] transition-colors',
              decision === 'delete' ? 'bg-danger/15 text-danger' : 'text-text-2 hover:text-danger',
            )}
          >
            Delete
          </button>
        </div>
      )}

      {decision === 'carryOver' && !isAbandoned && (
        <p className="text-[length:var(--text-small)] text-text-2">{carryOverPreview}</p>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(isAbandoned ? 'archive' : 'abandon')}
        className="w-fit text-[length:var(--text-small)] text-text-2 underline decoration-hairline underline-offset-4 transition-colors hover:text-text disabled:pointer-events-none"
      >
        {isAbandoned ? 'Undo — keep archiving' : 'Mark as abandoned instead'}
      </button>
    </div>
  )
}
