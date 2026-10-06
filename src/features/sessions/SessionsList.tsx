import { Divider } from '@/components/ui'
import type { Session } from '@/data/types'

export function SessionsList({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return <p className="text-[length:var(--text-small)] text-text-2">No sessions logged yet.</p>
  }

  return (
    <div className="flex flex-col">
      {sessions.map((session, index) => (
        <div key={session.id}>
          {index > 0 && <Divider />}
          <div className="flex items-center justify-between py-3">
            <span className="text-[length:var(--text-small)] text-text">{formatSessionDate(session.date)}</span>
            <span className="num text-[length:var(--text-small)] text-text-2">{session.minutes} min</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatSessionDate(date: string): string {
  const [yearStr, monthStr, dayStr] = date.split('-')
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
