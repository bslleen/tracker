import { PlusIcon } from '@/components/icons'

export function AddGoalCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline p-6 text-text-2 transition-colors hover:text-text"
    >
      <PlusIcon />
      <span className="text-[length:var(--text-small)]">New goal</span>
    </button>
  )
}
