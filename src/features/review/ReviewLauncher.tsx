import { useState } from 'react'
import { Button } from '@/components/ui'
import type { ReviewSlide } from './insights'
import { ReviewShareCard } from './ReviewShareCard'
import { ReviewStory } from './ReviewStory'
import { useReviewShare } from './useReviewShare'

export interface ReviewLauncherProps {
  year: string
  slides: ReviewSlide[]
}

/** Pure-props: the real page fetches the year's data and passes slides down; a dev fixture can do the same with fabricated data. */
export function ReviewLauncher({ year, slides }: ReviewLauncherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { nodeRef, isSharing, share } = useReviewShare(year)
  const outro = slides.find((slide): slide is Extract<ReviewSlide, { type: 'outro' }> => slide.type === 'outro')

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <h1 className="sr-only">Year in review</h1>

      {slides.length === 0 ? (
        <p className="max-w-xs text-[length:var(--text-small)] text-text-2">
          Not enough data yet for a {year} review — come back after logging a bit more.
        </p>
      ) : (
        <>
          <p className="text-title text-text">Your {year} in review</p>
          <p className="max-w-xs text-[length:var(--text-small)] text-text-2">A minute-long look back, Spotify-Wrapped style.</p>
          <Button onClick={() => setIsOpen(true)}>Play</Button>
        </>
      )}

      <ReviewStory open={isOpen} onClose={() => setIsOpen(false)} slides={slides} onShare={() => void share()} isSharing={isSharing} />

      {outro && (
        <ReviewShareCard
          ref={nodeRef}
          year={year}
          totalHours={outro.totalHours}
          totalChunks={outro.totalChunks}
          topSubjectName={outro.topSubjectName}
        />
      )}
    </div>
  )
}
