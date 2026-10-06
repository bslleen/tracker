import type { CSSProperties } from 'react'

const PARTICLE_COUNT = 24

/** A ~550ms ring of tiny accent dots radiating from the square's center. Caller is responsible for skipping this entirely under reduced motion. */
export function CompletionBurst() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const angle = (360 / PARTICLE_COUNT) * index
        const distance = 70 + (index % 3) * 16
        const style = {
          '--a': `${angle}deg`,
          '--dist': `${distance}px`,
          animation: 'focus-particle 560ms var(--ease-out) forwards',
          animationDelay: `${(index % 4) * 20}ms`,
        } as CSSProperties

        return <span key={index} className="absolute top-1/2 left-1/2 h-1.5 w-1.5 rounded-full bg-accent" style={style} />
      })}
    </div>
  )
}
