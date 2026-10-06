import { toast } from 'sonner'
import { logSleep } from '@/data/sleepWrites'
import { useAuth } from '@/data/useAuth'
import { useYearSummary } from '@/data/useYearSummary'
import { SleepContent } from '@/features/sleep/SleepContent'
import { useToday } from '@/hooks/useToday'
import { currentMonth } from '@/lib/chunks'

export default function Sleep() {
  const { user } = useAuth()
  const today = useToday()
  const year = currentMonth().slice(0, 4)
  const { data: monthDocs } = useYearSummary(year)

  async function handleLogSleep(hours: number, quality: number) {
    if (!user) return
    const month = currentMonth()
    const day = String(today.getDate()).padStart(2, '0')
    try {
      await logSleep(user.uid, month, day, { hours, quality })
      toast(`Logged ${hours.toFixed(1)}h of sleep`)
    } catch {
      toast.error('Could not log sleep. Try again.')
    }
  }

  return <SleepContent monthDocs={monthDocs ?? []} today={today} onLogSleep={handleLogSleep} />
}
