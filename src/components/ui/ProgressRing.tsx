import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

export interface ProgressRingProps {
  /** 0 to 1 */
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function ProgressRing({ progress, size = 120, strokeWidth = 8, className }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const clamped = Math.min(1, Math.max(0, progress))
  const prefersReducedMotion = useReducedMotion()

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('-rotate-90', className)}
      role="img"
      aria-label={`${Math.round(clamped * 100)}% complete`}
    >
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--chunk-empty)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: clamped }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}
