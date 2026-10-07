import type { GoalData, GoalStatus, MonthData, SessionData, SleepEntry, SpendingData } from '@/data/types'
import { chunkCount, previousMonth } from '@/lib/chunks'
import { chance, createRng, pick, randomFloat, randomInt, type Rng } from '@/lib/rng'

/** A plain Date stands in for a Firestore Timestamp — nothing in this app ever calls a Timestamp method on these fields (see src/data/demo/store.ts for why that's safe). */
type FakeTimestamp = GoalData['createdAt']
function fakeTimestamp(date: Date): FakeTimestamp {
  return date as unknown as FakeTimestamp
}

export interface DemoDataset {
  goals: Map<string, GoalData>
  sessions: Map<string, SessionData>
  /** keyed by "yyyy-mm" */
  months: Map<string, MonthData>
  spending: Map<string, SpendingData>
  nextIdCounter: number
}

interface GoalDef {
  name: string
  totalHours: number
  chunkMinutes: number
  percent: number
  hue: number
  playlistNote?: string
}

const GOAL_DEFS: GoalDef[] = [
  { name: 'French', totalHours: 40, chunkMinutes: 5, percent: 68, hue: 0, playlistNote: 'Français Authentique — daily podcast' },
  { name: 'Machine learning', totalHours: 60, chunkMinutes: 10, percent: 42, hue: 6, playlistNote: 'Andrew Ng ML Specialization' },
  { name: 'Linear algebra', totalHours: 30, chunkMinutes: 15, percent: 91, hue: 12 },
  { name: 'German', totalHours: 25, chunkMinutes: 10, percent: 20, hue: 18 },
  { name: 'English', totalHours: 20, chunkMinutes: 30, percent: 100, hue: 24 },
  { name: 'Chess', totalHours: 15, chunkMinutes: 5, percent: 55, hue: 30, playlistNote: 'Building Habits: 40 games a week' },
]

const SPENDING_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Books', 'Subscriptions', 'Other']
const SPENDING_NOTES: Record<string, string[]> = {
  Food: ['Groceries', 'Coffee', 'Lunch out', 'Takeout'],
  Transport: ['Metro pass', 'Rideshare', 'Gas'],
  Entertainment: ['Movie night', 'Concert tickets', 'Streaming'],
  Books: ['Textbook', 'Novel', 'Course material'],
  Subscriptions: ['Cloud storage', 'Music', 'News'],
  Other: [],
}

function currentMonthKeyFor(today: Date): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function dayKey(date: Date): string {
  return String(date.getDate()).padStart(2, '0')
}

function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

/** 6.0-8.5h, weekday nights a bit shorter than weekends — "weekly rhythm" per the brief. */
function sleepFor(rng: Rng, date: Date): SleepEntry {
  const base = isWeekday(date) ? randomFloat(rng, 6, 7.5) : randomFloat(rng, 6.8, 8.5)
  const hours = Math.round(base * 2) / 2
  const quality = Math.min(5, Math.max(1, Math.round((hours - 5) * 1.3 + randomInt(rng, -1, 1))))
  return { hours, quality }
}

function emptyMonth(): MonthData {
  return { days: {}, sleep: {} }
}

/**
 * Builds the whole demo dataset from a fixed seed and the real "today" — same
 * seed + same calendar day always produces byte-identical output, which is
 * the whole point (a recruiter reloading the page should see the same demo).
 * The 6 goals belong entirely to the current month (a goal doc only ever has
 * one month); the other 11 months get day/sleep aggregates only — plenty for
 * the heatmap and Year in Review's non-goal slides (see the Explore survey
 * this was designed from: "12 months of past data" is a day/sleep/spending
 * aggregate, not 12 months of goal docs).
 */
export function generateDemoData(seed: number, today: Date): DemoDataset {
  const rng = createRng(seed)
  let nextId = 0
  const id = (kind: string) => `demo-${kind}-${nextId++}`

  const currentMonthKey = currentMonthKeyFor(today)
  const months = new Map<string, MonthData>()
  const monthKeys: string[] = [currentMonthKey]
  for (let i = 0; i < 11; i += 1) monthKeys.push(previousMonth(monthKeys[monthKeys.length - 1]!))
  for (const key of monthKeys) months.set(key, emptyMonth())

  const oldestMonthKey = monthKeys[monthKeys.length - 1]!
  const [oldestYear, oldestMonthNum] = oldestMonthKey.split('-').map(Number)
  const startDate = new Date(oldestYear!, oldestMonthNum! - 1, 1)

  // --- Sleep for every day across the whole 12-month window ---
  for (const cursor = new Date(startDate); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const month = months.get(monthKey)
    if (!month) continue
    month.sleep![dayKey(cursor)] = sleepFor(rng, cursor)
  }

  // --- Historical day-total "aggregate" timeline for months BEFORE the current one ---
  // A handful of multi-day gaps scattered through the year, away from the
  // last two weeks (which the streak back-fill below guarantees stay active).
  const gapWindows: Array<{ start: number; length: number }> = []
  const totalPastDays = Math.round((today.getTime() - startDate.getTime()) / 86_400_000)
  for (let g = 0; g < 3; g += 1) {
    gapWindows.push({ start: randomInt(rng, 10, Math.max(11, totalPastDays - 20)), length: randomInt(rng, 2, 4) })
  }
  function isInGapWindow(dayIndex: number): boolean {
    return gapWindows.some((w) => dayIndex >= w.start && dayIndex < w.start + w.length)
  }

  let dayIndex = 0
  for (const cursor = new Date(startDate); cursor < new Date(today.getFullYear(), today.getMonth(), 1); cursor.setDate(cursor.getDate() + 1)) {
    const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const month = months.get(monthKey)
    if (month) {
      const weekday = isWeekday(cursor)
      const studied = !isInGapWindow(dayIndex) && chance(rng, weekday ? 0.88 : 0.6)
      const total = studied ? randomInt(rng, weekday ? 50 : 20, weekday ? 150 : 100) : 0
      month.days[dayKey(cursor)] = { total, byGoal: {} }
    }
    dayIndex += 1
  }

  // --- The 6 current-month goals, with session history that sums exactly to their target progress ---
  const goals = new Map<string, GoalData>()
  const sessions = new Map<string, SessionData>()
  const createdAt = fakeTimestamp(startDate)
  const todayDayOfMonth = today.getDate()
  const currentMonthDays = months.get(currentMonthKey)!

  for (const def of GOAL_DEFS) {
    const goalId = id('goal')
    const totalMinutes = def.totalHours * 60
    const totalChunks = chunkCount(totalMinutes, def.chunkMinutes)
    const completedChunks = Math.min(totalChunks, Math.round((def.percent / 100) * totalChunks))
    const isFinished = completedChunks >= totalChunks
    const carryMinutes = isFinished ? 0 : randomInt(rng, 0, def.chunkMinutes - 1)
    const bankedMinutes = completedChunks * def.chunkMinutes + carryMinutes

    goals.set(goalId, {
      name: def.name,
      month: currentMonthKey,
      totalMinutes,
      chunkMinutes: def.chunkMinutes,
      completedChunks,
      carryMinutes,
      status: 'active' as GoalStatus,
      hue: def.hue,
      playlistNote: def.playlistNote,
      createdAt,
      updatedAt: createdAt,
    })

    // Distribute bankedMinutes across this month's elapsed days, weekday-weighted,
    // skipping one random "gap" day in the middle when there's enough runway.
    const eligibleDays = Array.from({ length: todayDayOfMonth }, (_, i) => i + 1)
    const gapDay = eligibleDays.length >= 8 ? randomInt(rng, 3, eligibleDays.length - 4) : -1
    const weights = eligibleDays.map((day) => {
      if (day === gapDay) return 0
      const date = new Date(today.getFullYear(), today.getMonth(), day)
      return (isWeekday(date) ? 1.3 : 0.6) * randomFloat(rng, 0.7, 1.3)
    })
    const weightSum = weights.reduce((a, b) => a + b, 0) || 1

    let distributed = 0
    const perDayMinutes: number[] = eligibleDays.map((_, i) => {
      const share = Math.round((weights[i]! / weightSum) * bankedMinutes)
      distributed += share
      return share
    })
    // Fix rounding drift on the last non-zero day so the sum matches exactly.
    const drift = bankedMinutes - distributed
    if (drift !== 0) {
      const lastNonZero = perDayMinutes.map((m, i) => (m > 0 ? i : -1)).filter((i) => i >= 0).pop()
      if (lastNonZero !== undefined) perDayMinutes[lastNonZero] = Math.max(0, perDayMinutes[lastNonZero]! + drift)
    }

    eligibleDays.forEach((day, i) => {
      const minutes = perDayMinutes[i]!
      if (minutes <= 0) return
      const dKey = String(day).padStart(2, '0')
      const sessionId = id('session')
      const date = `${currentMonthKey}-${dKey}`
      sessions.set(sessionId, {
        goalId,
        date,
        minutes,
        chunks: Math.floor(minutes / def.chunkMinutes),
        carryBefore: 0,
        at: fakeTimestamp(new Date(today.getFullYear(), today.getMonth(), day)),
      })
      const entry = currentMonthDays.days[dKey] ?? { total: 0, byGoal: {} }
      entry.total += minutes
      entry.byGoal[goalId] = (entry.byGoal[goalId] ?? 0) + minutes
      currentMonthDays.days[dKey] = entry
    })
  }

  // --- Force a ~14-day streak ending today, regardless of how far into the month "today" is ---
  for (let back = 0; back < 14; back += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const month = months.get(monthKey)
    if (!month) continue
    const dKey = dayKey(date)
    const existing = month.days[dKey]
    if (!existing || existing.total <= 0) {
      month.days[dKey] = { total: randomInt(rng, 25, 90), byGoal: existing?.byGoal ?? {} }
    }
  }

  // --- Spending: 6 categories, spread across all 12 months ---
  const spending = new Map<string, SpendingData>()
  for (const monthKey of monthKeys) {
    const [year, monthNum] = monthKey.split('-').map(Number)
    const daysInThisMonth = monthKey === currentMonthKey ? todayDayOfMonth : new Date(year!, monthNum!, 0).getDate()
    const entryCount = randomInt(rng, 8, 15)
    for (let i = 0; i < entryCount; i += 1) {
      const category = pick(rng, SPENDING_CATEGORIES)
      const day = randomInt(rng, 1, daysInThisMonth)
      const notes = SPENDING_NOTES[category] ?? []
      const spendingId = id('spending')
      spending.set(spendingId, {
        date: `${monthKey}-${String(day).padStart(2, '0')}`,
        amount: Math.round(randomFloat(rng, 5, 120) * 100) / 100,
        category,
        note: notes.length > 0 && chance(rng, 0.6) ? pick(rng, notes) : undefined,
        createdAt: fakeTimestamp(new Date(year!, monthNum! - 1, day)),
      })
    }
  }

  return { goals, sessions, months, spending, nextIdCounter: nextId }
}
