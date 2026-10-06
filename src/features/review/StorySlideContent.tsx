import { StreakIcon } from '@/components/icons'
import { parseDateKey } from '@/lib/streak'
import type { ReviewSlide } from './insights'
import { BestMonthSlide } from './slides/BestMonthSlide'
import { SubjectsFinishedSlide, TopSubjectGridSlide } from './slides/GridSlide'
import { NumberSlide } from './slides/NumberSlide'
import { OutroSlide } from './slides/OutroSlide'
import { WeekdaySlide } from './slides/WeekdaySlide'

function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return parseDateKey(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  const start = parseDateKey(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = parseDateKey(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${start} – ${end}`
}

export interface StorySlideContentProps {
  slide: ReviewSlide
  prefersReducedMotion: boolean
  onShare: () => void
  isSharing: boolean
}

/** Maps each typed slide payload from insights.ts to its rendered layout. */
export function StorySlideContent({ slide, prefersReducedMotion, onShare, isSharing }: StorySlideContentProps) {
  switch (slide.type) {
    case 'intro':
      return (
        <NumberSlide
          captionAbove={`Your ${slide.year} in chunks`}
          value={slide.totalChunks}
          format={(value) => `${Math.round(value)}`}
          captionBelow="chunks filled"
          prefersReducedMotion={prefersReducedMotion}
        />
      )

    case 'totalHours':
      return (
        <NumberSlide
          captionAbove="Total hours studied"
          value={slide.hours}
          format={(value) => `${Math.round(value)}h`}
          captionBelow={`That's ${slide.days.toFixed(1)} days`}
          prefersReducedMotion={prefersReducedMotion}
        />
      )

    case 'topSubject':
      return (
        <TopSubjectGridSlide
          name={slide.name}
          hours={slide.hours}
          totalChunks={slide.totalChunks}
          chunkMinutes={slide.chunkMinutes}
          hue={slide.hue}
          prefersReducedMotion={prefersReducedMotion}
        />
      )

    case 'subjectsFinished':
      return <SubjectsFinishedSlide subjects={slide.subjects} prefersReducedMotion={prefersReducedMotion} />

    case 'longestStreak':
      return (
        <NumberSlide
          captionAbove="Longest streak"
          icon={<StreakIcon width={16} height={16} className="text-streak" />}
          value={slide.days}
          format={(value) => `${Math.round(value)}`}
          captionBelow={formatDateRange(slide.startDate, slide.endDate)}
          prefersReducedMotion={prefersReducedMotion}
        />
      )

    case 'bestMonth':
      return (
        <BestMonthSlide
          monthlyHours={slide.monthlyHours}
          bestMonthIndex={slide.bestMonthIndex}
          bestMonthHours={slide.bestMonthHours}
          prefersReducedMotion={prefersReducedMotion}
        />
      )

    case 'consistentWeekday':
      return <WeekdaySlide weekday={slide.weekday} percent={slide.percent} prefersReducedMotion={prefersReducedMotion} />

    case 'bestFocusWeek':
      return (
        <NumberSlide
          captionAbove="Best focus week"
          value={slide.minutes / 60}
          format={(value) => `${value.toFixed(1)}h`}
          captionBelow={formatDateRange(slide.startDate, slide.endDate)}
          prefersReducedMotion={prefersReducedMotion}
        />
      )

    case 'sleep':
      return (
        <NumberSlide
          captionAbove="Average sleep"
          value={slide.averageHours}
          format={(value) => `${value.toFixed(1)}h`}
          captionBelow={`Best week: ${slide.bestWeekAverage.toFixed(1)}h avg`}
          prefersReducedMotion={prefersReducedMotion}
        />
      )

    case 'spending':
      return (
        <NumberSlide
          captionAbove={slide.topCategory}
          value={slide.topCategoryTotal}
          format={(value) => `$${Math.round(value)}`}
          captionBelow={`$${Math.round(slide.total)} total this year`}
          prefersReducedMotion={prefersReducedMotion}
        />
      )

    case 'outro':
      return (
        <OutroSlide
          year={slide.year}
          totalHours={slide.totalHours}
          totalChunks={slide.totalChunks}
          topSubjectName={slide.topSubjectName}
          onShare={onShare}
          isSharing={isSharing}
          prefersReducedMotion={prefersReducedMotion}
        />
      )

    default: {
      const _exhaustive: never = slide
      return _exhaustive
    }
  }
}
