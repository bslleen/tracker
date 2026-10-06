import { useEffect, useState } from 'react'

/**
 * A `Date` snapshot refreshed once a minute, rather than reading `new Date()`
 * directly during render (an impure call — see the Focus Mode task's
 * `nowMs` for the same reasoning). A minute is plenty for anything that only
 * cares about the date/greeting/day-of-month, not a live clock.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setToday(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  return today
}
