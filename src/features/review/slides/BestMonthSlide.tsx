import { motion } from 'motion/react'
import { containerVariants, itemVariants, maskedWordVariants } from '../reviewVariants'

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const FULL_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export interface BestMonthSlideProps {
  monthlyHours: number[]
  bestMonthIndex: number
  bestMonthHours: number
  prefersReducedMotion: boolean
}

export function BestMonthSlide({ monthlyHours, bestMonthIndex, bestMonthHours, prefersReducedMotion }: BestMonthSlideProps) {
  const max = Math.max(...monthlyHours, 1)

  return (
    <motion.div
      variants={containerVariants(prefersReducedMotion)}
      initial="hidden"
      animate="visible"
      className="flex w-full max-w-xs flex-col items-center gap-6 px-8 text-center"
    >
      <motion.p variants={itemVariants(prefersReducedMotion)} className="text-[length:var(--text-small)] text-text-2">
        Best month
      </motion.p>

      <div className="overflow-hidden">
        <motion.span variants={maskedWordVariants(prefersReducedMotion)} className="inline-block text-hero leading-none text-text">
          {FULL_MONTH_NAMES[bestMonthIndex]}
        </motion.span>
      </div>

      <motion.div variants={itemVariants(prefersReducedMotion)} className="flex w-full items-end justify-between gap-1" style={{ height: 120 }}>
        {monthlyHours.map((hours, index) => {
          const isBest = index === bestMonthIndex
          const heightPercent = Math.max(2, (hours / max) * 100)
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-full w-full items-end">
                <motion.div
                  className="w-full rounded-t-sm"
                  style={{ backgroundColor: isBest ? 'var(--accent)' : 'var(--chunk-empty)' }}
                  initial={prefersReducedMotion ? false : { height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: prefersReducedMotion ? 0 : index * 0.03 }}
                />
              </div>
              <span className="text-[10px] text-text-2">{MONTH_INITIALS[index]}</span>
            </div>
          )
        })}
      </motion.div>

      <motion.p variants={itemVariants(prefersReducedMotion)} className="num text-[length:var(--text-small)] text-text-2">
        {bestMonthHours.toFixed(1)}h
      </motion.p>
    </motion.div>
  )
}
