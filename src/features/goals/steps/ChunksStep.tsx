import { AnimatedNumber } from '@/components/ui'
import { chunkCount, chunksPerHour, formatMonthLabel, nextMonth } from '@/lib/chunks'
import { cn } from '@/lib/cn'
import { ChunkGrid } from '../ChunkGrid'
import { CHUNK_PRESETS, resolveChunkMinutes, type ChunkPreset, type NewGoalState } from '../newGoalState'

export interface ChunksStepProps {
  state: NewGoalState
  baseMonth: string
  onChunkPresetChange: (preset: ChunkPreset) => void
  onCustomChunkChange: (value: string) => void
  onToggleStartNextMonth: () => void
}

export function ChunksStep({
  state,
  baseMonth,
  onChunkPresetChange,
  onCustomChunkChange,
  onToggleStartNextMonth,
}: ChunksStepProps) {
  const chunkMinutes = resolveChunkMinutes(state)
  const totalMinutes = state.hours * 60
  const total = chunkMinutes ? chunkCount(totalMinutes, chunkMinutes) : 0
  const perHour = chunkMinutes ? chunksPerHour(chunkMinutes) : 0
  const month = state.startNextMonth ? nextMonth(baseMonth) : baseMonth

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-[length:var(--text-small)] text-text-2">Chunk size</h2>

      <div className="flex flex-wrap gap-2">
        {CHUNK_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChunkPresetChange(preset)}
            className={cn(
              'min-h-11 rounded-full border px-4 text-[length:var(--text-small)] transition-colors',
              state.chunkPreset === preset
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-hairline text-text-2 hover:text-text',
            )}
          >
            {preset === 'custom' ? 'Custom' : `${preset}m`}
          </button>
        ))}
      </div>

      {state.chunkPreset === 'custom' && (
        <input
          type="text"
          inputMode="numeric"
          value={state.customChunkMinutes}
          onChange={(event) => onCustomChunkChange(event.target.value)}
          placeholder="Minutes per chunk"
          aria-label="Custom chunk size in minutes"
          className="w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-[length:var(--text-body)] text-text outline-none focus-visible:border-accent"
        />
      )}

      <div className="flex flex-col items-center gap-1">
        <AnimatedNumber value={total} className="text-hero leading-none text-text" />
        <span className="text-[length:var(--text-small)] text-text-2">chunks</span>
        <span className="mt-1 text-[length:var(--text-small)] text-text-2">
          {perHour % 1 === 0 ? perHour : perHour.toFixed(1)} per hour · {state.hours} hours
        </span>
      </div>

      {chunkMinutes && total > 0 && (
        <ChunkGrid
          total={total}
          completed={0}
          chunkMinutes={chunkMinutes}
          interactive={false}
          className="max-h-40 overflow-hidden"
        />
      )}

      <div className="flex items-center justify-between text-[length:var(--text-small)] text-text-2">
        <span>{formatMonthLabel(month)}</span>
        <button
          type="button"
          onClick={onToggleStartNextMonth}
          className="text-accent underline-offset-4 hover:underline"
        >
          {state.startNextMonth ? 'Start this month instead' : 'Start next month instead'}
        </button>
      </div>
    </div>
  )
}
