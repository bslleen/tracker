import { motion } from 'motion/react'
import { containerVariants, itemVariants, maskedWordVariants } from '../reviewVariants'

export interface WeekdaySlideProps {
  weekday: string
  percent: number
  prefersReducedMotion: boolean
}

export function WeekdaySlide({ weekday, percent, prefersReducedMotion }: WeekdaySlideProps) {
  return (
    <motion.div
      variants={containerVariants(prefersReducedMotion)}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-4 px-8 text-center"
    >
      <motion.p variants={itemVariants(prefersReducedMotion)} className="text-[length:var(--text-small)] text-text-2">
        You are a
      </motion.p>
      <div className="overflow-hidden">
        <motion.span variants={maskedWordVariants(prefersReducedMotion)} className="inline-block text-hero leading-none text-text">
          {weekday}
        </motion.span>
      </div>
      <motion.p variants={itemVariants(prefersReducedMotion)} className="text-[length:var(--text-small)] text-text-2">
        person · <span className="num">{percent}%</span> of your study days
      </motion.p>
    </motion.div>
  )
}
