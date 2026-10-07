import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

export function StepProgress({ step, count }: { step: number; count: number }) {
  return (
    <div
      className="flex gap-1.5"
      role="progressbar"
      aria-label={`Step ${step + 1} of ${count}`}
      aria-valuenow={step + 1}
      aria-valuemin={1}
      aria-valuemax={count}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-chunk-empty">
          <motion.div
            className={cn('h-full rounded-full bg-accent')}
            initial={false}
            animate={{ scaleX: index <= step ? 1 : 0 }}
            style={{ transformOrigin: 'left' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      ))}
    </div>
  )
}
