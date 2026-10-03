import { useEffect, useState, type ReactNode } from 'react'
import { ChunkGrid } from '@/features/goals/ChunkGrid'

const CHUNK_SIZES = [5, 10, 15, 20, 25, 30, 45, 60]
const nativeMatchMedia = window.matchMedia.bind(window)

function fakeMediaQueryList(query: string): MediaQueryList {
  return {
    matches: true,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }
}

/**
 * Dev-only tool for exercising <ChunkGrid> at every size/density/pointer
 * combination without needing real touch hardware. Simulating touch/reduced-
 * motion works by monkey-patching window.matchMedia for the lifetime of this
 * page — both our own useMediaQuery and Motion's internal useReducedMotion
 * read the same global, so this covers both consistently. ChunkGrid itself
 * has no test-only props; this stays entirely in the dev page.
 */
export default function StyleguideGrid() {
  const [total, setTotal] = useState(480)
  const [chunkMinutes, setChunkMinutes] = useState(15)
  const [completed, setCompleted] = useState(120)
  const [accentShade, setAccentShade] = useState(0)
  const [containerWidth, setContainerWidth] = useState(600)
  const [interactive, setInteractive] = useState(true)
  const [simulateTouch, setSimulateTouch] = useState(false)
  const [simulateReducedMotion, setSimulateReducedMotion] = useState(false)

  useEffect(() => {
    window.matchMedia = ((query: string) => {
      if (simulateTouch && query.includes('pointer: coarse')) return fakeMediaQueryList(query)
      if (simulateReducedMotion && query.includes('prefers-reduced-motion')) return fakeMediaQueryList(query)
      return nativeMatchMedia(query)
    }) as typeof window.matchMedia

    return () => {
      window.matchMedia = nativeMatchMedia
    }
  }, [simulateTouch, simulateReducedMotion])

  const clampedCompleted = Math.min(completed, total)

  return (
    <main className="min-h-dvh bg-bg text-text" style={{ padding: 'var(--gutter)' }}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
        <header>
          <h1 className="text-title text-text">ChunkGrid styleguide</h1>
          <p className="text-[length:var(--text-small)] text-text-2">Dev-only route. Not part of the product.</p>
        </header>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <Control label={`Total: ${total}`}>
            <input
              type="range"
              min={60}
              max={3000}
              step={10}
              value={total}
              onChange={(event) => setTotal(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </Control>

          <Control label="Chunk size">
            <select
              value={chunkMinutes}
              onChange={(event) => setChunkMinutes(Number(event.target.value))}
              className="w-full rounded-md border border-hairline bg-surface-2 px-2 py-1.5 text-text"
            >
              {CHUNK_SIZES.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </Control>

          <Control label={`Completed: ${clampedCompleted} / ${total}`}>
            <input
              type="range"
              min={0}
              max={total}
              value={clampedCompleted}
              onChange={(event) => setCompleted(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </Control>

          <Control label={`Accent shade: ${accentShade}°`}>
            <input
              type="range"
              min={0}
              max={30}
              value={accentShade}
              onChange={(event) => setAccentShade(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </Control>

          <Control label={`Container width: ${containerWidth}px`}>
            <input
              type="range"
              min={240}
              max={1200}
              step={10}
              value={containerWidth}
              onChange={(event) => setContainerWidth(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </Control>

          <Toggle label="Interactive" checked={interactive} onChange={setInteractive} />
          <Toggle label="Simulate touch pointer" checked={simulateTouch} onChange={setSimulateTouch} />
          <Toggle label="Simulate reduced motion" checked={simulateReducedMotion} onChange={setSimulateReducedMotion} />
        </div>

        <div className="rounded-xl border border-hairline bg-surface p-6" style={{ maxWidth: containerWidth }}>
          <ChunkGrid
            key={`${simulateTouch}-${simulateReducedMotion}`}
            total={total}
            completed={clampedCompleted}
            chunkMinutes={chunkMinutes}
            accentShade={accentShade}
            interactive={interactive}
            size="auto"
            label="Styleguide goal"
            onFillTo={(index) => setCompleted(index + 1)}
            onUndoLast={() => setCompleted((current) => Math.max(0, current - 1))}
          />
        </div>

        <section className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[0, 8, 16, 24].map((shade) => (
            <div key={shade} className="flex flex-col gap-2">
              <span className="text-[length:var(--text-small)] text-text-2">shade {shade}°</span>
              <ChunkGrid
                total={48}
                completed={30}
                chunkMinutes={chunkMinutes}
                accentShade={shade}
                interactive={false}
                size="sm"
              />
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[length:var(--text-small)] text-text-2">
      {label}
      {children}
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[length:var(--text-small)] text-text-2">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  )
}
