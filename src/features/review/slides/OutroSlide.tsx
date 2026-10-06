import { motion } from 'motion/react'
import { Button } from '@/components/ui'
import { containerVariants, itemVariants } from '../reviewVariants'

export interface OutroSlideProps {
  year: string
  totalHours: number
  totalChunks: number
  topSubjectName: string
  onShare: () => void
  isSharing: boolean
  prefersReducedMotion: boolean
}

export function OutroSlide({ year, totalHours, totalChunks, topSubjectName, onShare, isSharing, prefersReducedMotion }: OutroSlideProps) {
  return (
    <motion.div
      variants={containerVariants(prefersReducedMotion)}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-8 px-8 text-center"
    >
      <motion.p variants={itemVariants(prefersReducedMotion)} className="text-[length:var(--text-small)] text-text-2">
        Your {year}
      </motion.p>

      <motion.div variants={itemVariants(prefersReducedMotion)} className="flex flex-col gap-6">
        <HeadlineStat value={`${Math.round(totalHours)}h`} label="studied" />
        <HeadlineStat value={totalChunks} label="chunks filled" />
        {topSubjectName && <HeadlineStat value={topSubjectName} label="top subject" />}
      </motion.div>

      <motion.div variants={itemVariants(prefersReducedMotion)}>
        {/* Nested inside the story's tap-to-navigate area — without stopping
            propagation, this click also bubbles up as a pointerup past the
            last slide, which immediately calls onClose(). Caught via an
            actual click in a real browser: the story closed right as the
            share image started preparing. */}
        <Button
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onShare()
          }}
          disabled={isSharing}
        >
          {isSharing ? 'Preparing…' : 'Share'}
        </Button>
      </motion.div>
    </motion.div>
  )
}

function HeadlineStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="num text-title leading-none text-text">{value}</span>
      <span className="text-[length:var(--text-small)] text-text-2">{label}</span>
    </div>
  )
}
