import { motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { createRng, randomFloat } from '@/lib/rng'

const COLS = 12
const ROWS = 7
// Fixed seed — a calm, non-janky arrangement rather than a new random
// scatter (and a new set of fade timings) on every visit.
const SEED = 7

/** A grid of chunks that spells nothing — purely decorative, random fill and random fade-in order, never a hidden word or shape. */
export default function NotFound() {
  const prefersReducedMotion = useReducedMotion()

  const cells = useMemo(() => {
    const rng = createRng(SEED)
    return Array.from({ length: COLS * ROWS }, () => ({
      filled: rng() < 0.3,
      delay: randomFloat(rng, 0, 1.4),
    }))
  }, [])

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-10 text-center">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, width: 'min(90vw, 420px)' }}
        aria-hidden="true"
      >
        {cells.map((cell, index) =>
          prefersReducedMotion ? (
            <div
              key={index}
              className="aspect-square rounded-[6px]"
              style={{ backgroundColor: cell.filled ? 'var(--accent)' : 'var(--chunk-empty)', opacity: cell.filled ? 0.85 : 1 }}
            />
          ) : (
            <motion.div
              key={index}
              className="aspect-square rounded-[6px]"
              style={{ backgroundColor: cell.filled ? 'var(--accent)' : 'var(--chunk-empty)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: cell.filled ? 0.85 : 1 }}
              transition={{ duration: 0.6, delay: cell.delay, ease: 'easeOut' }}
            />
          ),
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-title text-text">This page doesn't exist</h1>
        <p className="text-[length:var(--text-small)] text-text-2">No chunk spells that one out.</p>
      </div>

      <Button asChild>
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  )
}
