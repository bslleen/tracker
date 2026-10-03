import { animate } from 'motion/react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

export interface StatProps {
  value: number
  label: string
  className?: string
}

export function Stat({ value, label, className }: StatProps) {
  const numeralRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = numeralRef.current
    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = String(Math.round(value))
      return
    }

    const controls = animate(0, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = String(Math.round(latest))
      },
    })

    return () => controls.stop()
  }, [value])

  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <span ref={numeralRef} className="num text-hero leading-none text-text">
        0
      </span>
      <span className="text-[length:var(--text-small)] text-text-2">{label}</span>
    </div>
  )
}
