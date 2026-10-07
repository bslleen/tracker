/**
 * Whether the ambient WebGL background should step down to its static CSS
 * fallback on capability grounds alone — independent of (and checked in
 * addition to) prefers-reduced-motion and WebGL actually being available.
 */
export function isLowPowerDevice(hardwareConcurrency: number | undefined, prefersReducedData: boolean): boolean {
  const fewCores = typeof hardwareConcurrency === 'number' && hardwareConcurrency <= 2
  return fewCores || prefersReducedData
}
