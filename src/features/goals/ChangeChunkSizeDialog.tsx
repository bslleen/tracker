import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangleIcon } from '@/components/icons'
import { ResponsiveModal } from '@/components/ResponsiveModal'
import { Button } from '@/components/ui'
import type { Goal } from '@/data/types'
import { updateGoalChunkMinutes } from '@/data/goalWrites'
import { useAuth } from '@/data/useAuth'
import { cn } from '@/lib/cn'
import { CHUNK_PRESETS, type ChunkPreset } from './newGoalState'

export interface ChangeChunkSizeDialogProps {
  goal: Goal
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangeChunkSizeDialog({ goal, open, onOpenChange }: ChangeChunkSizeDialogProps) {
  const { user } = useAuth()
  const [preset, setPreset] = useState<ChunkPreset>(() => {
    const match = CHUNK_PRESETS.find((candidate) => candidate !== 'custom' && candidate === goal.chunkMinutes)
    return match ?? 'custom'
  })
  const [custom, setCustom] = useState(String(goal.chunkMinutes))
  const [isSaving, setIsSaving] = useState(false)

  const resolved = preset === 'custom' ? Number.parseInt(custom, 10) : preset
  const isValid = Number.isFinite(resolved) && resolved >= 1 && resolved <= 120

  async function handleConfirm() {
    if (!user || !isValid) return
    setIsSaving(true)
    try {
      await updateGoalChunkMinutes(user.uid, goal.id, resolved)
      toast(`Chunk size updated to ${resolved} min`)
      onOpenChange(false)
    } catch {
      toast.error('Could not update the chunk size. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Change chunk size">
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-2 rounded-md border border-hairline bg-surface-2 p-3 text-[length:var(--text-small)] text-text-2">
          <AlertTriangleIcon className="mt-0.5 shrink-0 text-streak" />
          <p>
            Changing the chunk size reflows the grid — your progress is kept (in minutes), but the
            number of squares and how many are filled will change.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CHUNK_PRESETS.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setPreset(candidate)}
              className={cn(
                'min-h-11 rounded-full border px-4 text-[length:var(--text-small)] transition-colors',
                preset === candidate ? 'border-accent bg-accent/10 text-accent' : 'border-hairline text-text-2 hover:text-text',
              )}
            >
              {candidate === 'custom' ? 'Custom' : `${candidate}m`}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(event) => setCustom(event.target.value.replace(/[^\d]/g, '').slice(0, 3))}
            placeholder="Minutes per chunk"
            aria-label="Custom chunk size in minutes"
            className="w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-[length:var(--text-body)] text-text outline-none focus-visible:border-accent"
          />
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={!isValid || isSaving}>
            Confirm
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}
