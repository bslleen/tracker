/** Loading placeholder matching GoalCard's shell — a slow shimmer, never a spinner (see CLAUDE.md). */
export function GoalCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-6 sm:flex-row sm:items-center sm:gap-6" aria-hidden="true">
      <div className="flex flex-1 flex-col gap-3">
        <Shimmer className="h-4 w-28 rounded-sm" />
        <Shimmer className="h-3 w-20 rounded-sm" />
      </div>
      <Shimmer className="h-[72px] w-[72px] shrink-0 rounded-full" />
      <Shimmer className="h-16 flex-1 rounded-lg sm:max-w-40" />
    </div>
  )
}

function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={className}
      style={{
        backgroundImage: 'linear-gradient(90deg, var(--surface-2) 0%, var(--chunk-empty) 50%, var(--surface-2) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s linear infinite',
      }}
    />
  )
}
