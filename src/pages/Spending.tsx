import { addSpending, deleteSpending, restoreSpending } from '@/data/spendingWrites'
import { useAuth } from '@/data/useAuth'
import { useSpending } from '@/data/useSpending'
import { SpendingContent } from '@/features/spending/SpendingContent'
import { useToday } from '@/hooks/useToday'
import { currentMonth } from '@/lib/chunks'

export default function Spending() {
  const { user } = useAuth()
  const today = useToday()
  const month = currentMonth()
  const { data: entries } = useSpending(month)

  if (!user) {
    return <div className="min-h-[50vh]" />
  }

  const todayKey = `${month}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <SpendingContent
      entries={entries ?? []}
      onAdd={async (input) => {
        await addSpending({ uid: user.uid, date: todayKey, ...input })
      }}
      onDeleteEntry={(entry) => deleteSpending(user.uid, entry)}
      onRestoreEntry={(entry) => restoreSpending(user.uid, entry)}
    />
  )
}
