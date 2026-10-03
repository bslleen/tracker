import { cn } from '@/lib/cn'

export interface NextChunksPreviewProps {
  completedChunks: number
  previewChunks: number
  totalChunks: number
  maxDots?: number
}

/** Accent dots lighting up one by one as the live minutes input rises. */
export function NextChunksPreview({ completedChunks, previewChunks, totalChunks, maxDots = 24 }: NextChunksPreviewProps) {
  const visibleCount = Math.min(totalChunks, maxDots)
  const hiddenCount = totalChunks - visibleCount

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: visibleCount }, (_, index) => {
        const isDone = index < completedChunks
        const isPreview = !isDone && index < completedChunks + previewChunks
        return (
          <span
            key={index}
            className={cn(
              'h-2 w-2 rounded-full transition-colors duration-200',
              isDone && 'bg-accent',
              isPreview && 'bg-accent/50',
              !isDone && !isPreview && 'bg-chunk-empty',
            )}
            style={isPreview ? { transitionDelay: `${(index - completedChunks) * 40}ms` } : undefined}
          />
        )
      })}
      {hiddenCount > 0 && <span className="text-[length:var(--text-small)] text-text-2">+{hiddenCount}</span>}
    </div>
  )
}
