import { PlusIcon } from '@/components/icons'

export function AddGoalCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[152px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline p-6 text-text-2 transition-colors hover:border-white/20 hover:text-text"
    >
      <PlusIcon className="transition-transform duration-300 group-hover:rotate-90" />
      <span className="text-[length:var(--text-small)]">New goal</span>
    </button>
  )
}
