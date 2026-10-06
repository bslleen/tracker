import { animate } from 'motion/react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

export interface AnimatedNumberProps {
  value: number
  className?: string
  format?: (value: number) => string
  /** Tween duration in seconds — the default suits small incremental changes; a bigger "reveal" moment (e.g. a whole month's total) wants something slower. */
  duration?: number
}

const defaultFormat = (value: number) => String(Math.round(value))

/** A tabular-nums numeral that tweens between values instead of jumping. */
export function AnimatedNumber({ value, className, format, duration = 0.18 }: AnimatedNumberProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const previousValueRef = useRef(value)
  const formatRef = useRef(format ?? defaultFormat)

  useEffect(() => {
    formatRef.current = format ?? defaultFormat
  })

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return
    const render = formatRef.current

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = render(value)
      previousValueRef.current = value
      return
    }

    const controls = animate(previousValueRef.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = render(latest)
      },
    })
    previousValueRef.current = value

    return () => controls.stop()
  }, [value, duration])

  return (
    <span ref={nodeRef} className={cn('num', className)}>
      {(format ?? defaultFormat)(value)}
    </span>
  )
}
