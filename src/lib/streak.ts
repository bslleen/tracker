// Sanity cap on the backward walk — in practice the caller's getMinutesForDay
// only has real data for a month or two, so the loop stops well before this.
const MAX_LOOKBACK_DAYS = 3650

/**
 * Consecutive days with any minutes logged, walking backward from `today`.
 * An in-progress day with nothing logged yet doesn't break a streak that's
 * otherwise unbroken through yesterday — the day isn't over yet.
 */
export function computeStreak(getMinutesForDay: (date: Date) => number, today: Date): number {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (getMinutesForDay(cursor) <= 0) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  for (let i = 0; i < MAX_LOOKBACK_DAYS && getMinutesForDay(cursor) > 0; i += 1) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/**
 * Local-time "yyyy-mm-dd" — deliberately never `date.toISOString()` or
 * `new Date(dateString)`, both of which parse/format in UTC and can land on
 * the wrong calendar day depending on the system timezone (e.g. any negative
 * UTC offset rolls a local midnight back to the previous day). Every date
 * key in this module is produced and consumed through this pair of
 * functions so the two can never drift out of sync with each other.
 */
export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** The inverse of dateKey — a local-time midnight Date, not a UTC one. */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

/** Adapts a flat {dateKey: minutes} map (e.g. a year's worth of heatmap data) into the callback computeStreak expects. */
export function minutesFromDateMap(map: Record<string, number>): (date: Date) => number {
  return (date: Date) => map[dateKey(date)] ?? 0
}

/**
 * Longest run of consecutive calendar days with minutes > 0 anywhere in the
 * map. Bounded to whatever dates actually exist in the map (e.g. a single
 * fetched year) — it never reaches outside that range, so a streak that
 * truly started the prior year will read as starting January 1st instead.
 * Day-adjacency is checked via setDate/getDate (calendar arithmetic), not a
 * millisecond-difference, so a DST transition day (23 or 25 real hours)
 * still counts as exactly one calendar day apart.
 */
export function computeLongestStreak(map: Record<string, number>): number {
  const activeDates = Object.entries(map)
    .filter(([, minutes]) => minutes > 0)
    .map(([key]) => key)
    .sort()

  let longest = 0
  let current = 0
  let previousKey: string | null = null

  for (const key of activeDates) {
    if (previousKey) {
      const expectedNext = parseDateKey(previousKey)
      expectedNext.setDate(expectedNext.getDate() + 1)
      current = dateKey(expectedNext) === key ? current + 1 : 1
    } else {
      current = 1
    }
    longest = Math.max(longest, current)
    previousKey = key
  }

  return longest
}

/** How many days in the map have any minutes logged at all. */
export function countActiveDays(map: Record<string, number>): number {
  return Object.values(map).filter((minutes) => minutes > 0).length
}
