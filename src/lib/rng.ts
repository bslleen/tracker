/**
 * mulberry32 — a tiny, fast seeded PRNG. Not cryptographic; exists purely so
 * the demo dataset is byte-identical on every load (same seed in, same
 * sequence out), which Math.random() can never guarantee.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof createRng>

/** Integer in [min, max], inclusive. */
export function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/** Float in [min, max). */
export function randomFloat(rng: Rng, min: number, max: number): number {
  return rng() * (max - min) + min
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[randomInt(rng, 0, items.length - 1)]!
}

/** True with probability `p` (0-1). */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p
}
