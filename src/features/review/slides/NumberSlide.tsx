import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { AnimatedNumber } from '@/components/ui'
import { containerVariants, itemVariants } from '../reviewVariants'

export interface NumberSlideProps {
  captionAbove?: string
  icon?: ReactNode
  value: number
  format: (value: number) => string
  captionBelow?: string
  prefersReducedMotion: boolean
  duration?: number
}

/** The generic "one giant numeral + small captions" slide shape — reused by intro, totalHours, longestStreak, bestFocusWeek, sleep, and spending. */
export function NumberSlide({ captionAbove, icon, value, format, captionBelow, prefersReducedMotion, duration = 1.1 }: NumberSlideProps) {
  return (
    <motion.div
      variants={containerVariants(prefersReducedMotion)}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-4 px-8 text-center"
    >
      {captionAbove && (
        <motion.div variants={itemVariants(prefersReducedMotion)} className="flex items-center gap-2">
          {icon}
          <p className="text-[length:var(--text-small)] text-text-2">{captionAbove}</p>
        </motion.div>
      )}
      <motion.div variants={itemVariants(prefersReducedMotion)}>
        <AnimatedNumber
          value={value}
          format={format}
          duration={prefersReducedMotion ? 0 : duration}
          className="num text-hero leading-none text-text"
        />
      </motion.div>
      {captionBelow && (
        <motion.p variants={itemVariants(prefersReducedMotion)} className="text-[length:var(--text-small)] text-text-2">
          {captionBelow}
        </motion.p>
      )}
    </motion.div>
  )
}
