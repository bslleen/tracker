import type {
  Goal,
  GoalData,
  GoalStatus,
  Month,
  Session,
  SessionData,
  SleepEntry,
  SpendingData,
  SpendingEntry,
} from '@/data/types'
import { carryOverGoal, computeChunkProgress, minutesBanked } from '@/lib/chunks'
import { generateDemoData, type DemoDataset } from './generator'

/**
 * The fixed "user id" demo mode operates as. useAuth() returns a user object
 * with this uid whenever demo mode is on (see useAuth.ts), which is what
 * lets every existing hook/write function's `uid` parameter flow through
 * unchanged — the only thing each one adds is a `uid === DEMO_UID` branch
 * that reads/writes this module's in-memory Maps instead of Firestore.
 */
export const DEMO_UID = 'demo-user'

// Fixed, not Date.now()-derived — "looks identical on every load" per the brief.
const DEMO_SEED = 42

let dataset: DemoDataset | null = null
let idCounter = 0

function ensureSeeded(): DemoDataset {
  if (!dataset) {
    dataset = generateDemoData(DEMO_SEED, new Date())
    idCounter = dataset.nextIdCounter
  }
  return dataset
}

function nextId(kind: string): string {
  ensureSeeded()
  idCounter += 1
  return `demo-${kind}-${idCounter}`
}

/** Only for tests — forces the next read/write to reseed from scratch. */
export function resetDemoDataForTests(): void {
  dataset = null
  idCounter = 0
}

function fakeTimestamp(date: Date): GoalData['createdAt'] {
  return date as unknown as GoalData['createdAt']
}

// ---------------------------------------------------------------------------
// Reads — one per real src/data/use*.ts hook, same filtering/sort/limit logic
// ---------------------------------------------------------------------------

export function readDemoGoal(goalId: string): Goal | undefined {
  const data = ensureSeeded()
  const goal = data.goals.get(goalId)
  return goal ? { id: goalId, ...goal } : undefined
}

export function readDemoGoals(month: string): Goal[] {
  const data = ensureSeeded()
  return [...data.goals.entries()].filter(([, g]) => g.month === month).map(([id, g]) => ({ id, ...g }))
}

export function readDemoOverdueGoals(currentMonthValue: string): Goal[] {
  const data = ensureSeeded()
  return [...data.goals.entries()]
    .filter(([, g]) => g.status === 'active' && g.month < currentMonthValue)
    .map(([id, g]) => ({ id, ...g }))
}

export function readDemoYearGoals(year: string): Goal[] {
  const data = ensureSeeded()
  return [...data.goals.entries()]
    .filter(([, g]) => g.month >= `${year}-01` && g.month <= `${year}-12`)
    .map(([id, g]) => ({ id, ...g }))
}

export function readDemoMonth(yyyyMm: string): Month | undefined {
  const data = ensureSeeded()
  const month = data.months.get(yyyyMm)
  return month ? { id: yyyyMm, ...month } : undefined
}

export function readDemoYearSummary(year: string): Month[] {
  const data = ensureSeeded()
  const months: Month[] = []
  for (let m = 1; m <= 12; m += 1) {
    const key = `${year}-${String(m).padStart(2, '0')}`
    const doc = data.months.get(key)
    if (doc) months.push({ id: key, ...doc })
  }
  return months
}

export function readDemoSessions(goalId: string, limit: number): Session[] {
  const data = ensureSeeded()
  return [...data.sessions.entries()]
    .filter(([, s]) => s.goalId === goalId)
    .sort(([, a], [, b]) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit)
    .map(([id, s]) => ({ id, ...s }))
}

export function readDemoSpending(month: string): SpendingEntry[] {
  const data = ensureSeeded()
  return [...data.spending.entries()]
    .filter(([, s]) => s.date >= `${month}-01` && s.date <= `${month}-31`)
    .sort(([, a], [, b]) => (a.date < b.date ? 1 : -1))
    .slice(0, 300)
    .map(([id, s]) => ({ id, ...s }))
}

export function readDemoYearSpending(year: string): SpendingEntry[] {
  const data = ensureSeeded()
  return [...data.spending.entries()]
    .filter(([, s]) => s.date >= `${year}-01-01` && s.date <= `${year}-12-31`)
    .sort(([, a], [, b]) => (a.date < b.date ? 1 : -1))
    .slice(0, 1000)
    .map(([id, s]) => ({ id, ...s }))
}

/** For the "Convert to account" import — every current goal, any status. */
export function readAllDemoGoals(): Goal[] {
  const data = ensureSeeded()
  return [...data.goals.entries()].map(([id, g]) => ({ id, ...g }))
}

// ---------------------------------------------------------------------------
// Writes — mirrors src/data/goalWrites.ts / sessionWrites.ts /
// monthReviewWrites.ts / sleepWrites.ts / spendingWrites.ts exactly, just
// against these Maps instead of a Firestore transaction/batch.
// ---------------------------------------------------------------------------

export interface DemoCreateGoalInput {
  name: string
  month: string
  totalMinutes: number
  chunkMinutes: number
  hue: number
  playlistNote?: string
}

export function demoCreateGoal(input: DemoCreateGoalInput): string {
  const data = ensureSeeded()
  const goalId = nextId('goal')
  const now = fakeTimestamp(new Date())
  data.goals.set(goalId, {
    name: input.name,
    month: input.month,
    totalMinutes: input.totalMinutes,
    chunkMinutes: input.chunkMinutes,
    completedChunks: 0,
    carryMinutes: 0,
    status: 'active',
    hue: input.hue,
    playlistNote: input.playlistNote,
    createdAt: now,
    updatedAt: now,
  })
  return goalId
}

export function demoUpdateGoalChunkMinutes(goalId: string, newChunkMinutes: number): void {
  const data = ensureSeeded()
  const goal = data.goals.get(goalId)
  if (!goal) return
  const banked = minutesBanked(goal.completedChunks, goal.chunkMinutes, goal.carryMinutes)
  const { chunksAdded, newCarryMinutes } = computeChunkProgress(banked, newChunkMinutes, 0, 0, goal.totalMinutes)
  data.goals.set(goalId, {
    ...goal,
    chunkMinutes: newChunkMinutes,
    completedChunks: chunksAdded,
    carryMinutes: newCarryMinutes,
    updatedAt: fakeTimestamp(new Date()),
  })
}

export function demoSetGoalStatus(goalId: string, status: GoalStatus): void {
  const data = ensureSeeded()
  const goal = data.goals.get(goalId)
  if (!goal) return
  data.goals.set(goalId, { ...goal, status, updatedAt: fakeTimestamp(new Date()) })
}

export function demoDeleteGoal(goalId: string): void {
  const data = ensureSeeded()
  data.goals.delete(goalId)
  for (const [sessionId, session] of data.sessions) {
    if (session.goalId === goalId) data.sessions.delete(sessionId)
  }
}

export interface DemoLogSessionInput {
  goalId: string
  month: string
  day: string
  minutes: number
}

export interface DemoLogSessionResult {
  sessionId: string
  chunksAdded: number
  newCarryMinutes: number
}

export function demoLogSession({ goalId, month, day, minutes }: DemoLogSessionInput): DemoLogSessionResult {
  const data = ensureSeeded()
  const goal = data.goals.get(goalId)
  if (!goal) throw new Error(`Goal ${goalId} does not exist`)

  const { chunksAdded, newCarryMinutes } = computeChunkProgress(
    minutes,
    goal.chunkMinutes,
    goal.carryMinutes,
    goal.completedChunks,
    goal.totalMinutes,
  )

  const sessionId = nextId('session')
  const now = new Date()
  const session: SessionData = {
    goalId,
    date: `${month}-${day}`,
    minutes,
    chunks: chunksAdded,
    carryBefore: goal.carryMinutes,
    at: fakeTimestamp(now),
  }
  data.sessions.set(sessionId, session)

  data.goals.set(goalId, {
    ...goal,
    completedChunks: goal.completedChunks + chunksAdded,
    carryMinutes: newCarryMinutes,
    updatedAt: fakeTimestamp(now),
  })

  const monthDoc = data.months.get(month) ?? { days: {}, sleep: {} }
  const entry = monthDoc.days[day] ?? { total: 0, byGoal: {} }
  entry.total += minutes
  entry.byGoal[goalId] = (entry.byGoal[goalId] ?? 0) + minutes
  monthDoc.days[day] = entry
  data.months.set(month, monthDoc)

  return { sessionId, chunksAdded, newCarryMinutes }
}

export function demoUndoSession(sessionId: string): { goalId: string; month: string } | null {
  const data = ensureSeeded()
  const session = data.sessions.get(sessionId)
  if (!session) return null

  const month = session.date.slice(0, 7)
  const day = session.date.slice(8, 10)

  data.sessions.delete(sessionId)

  const goal = data.goals.get(session.goalId)
  if (goal) {
    data.goals.set(session.goalId, {
      ...goal,
      completedChunks: goal.completedChunks - session.chunks,
      carryMinutes: session.carryBefore,
      updatedAt: fakeTimestamp(new Date()),
    })
  }

  const monthDoc = data.months.get(month)
  const entry = monthDoc?.days[day]
  if (monthDoc && entry) {
    entry.total -= session.minutes
    entry.byGoal[session.goalId] = (entry.byGoal[session.goalId] ?? 0) - session.minutes
  }

  return { goalId: session.goalId, month }
}

export type DemoGoalReviewDecision = 'carryOver' | 'archive' | 'abandon' | 'delete'
export interface DemoGoalReviewChoice {
  goal: Goal
  decision: DemoGoalReviewDecision
}
export interface DemoDeletedGoalSnapshot {
  goal: Goal
  sessions: Session[]
}

export function demoApplyMonthReviewDecisions(choices: DemoGoalReviewChoice[]): { deleted: DemoDeletedGoalSnapshot[] } {
  const data = ensureSeeded()
  const deleted: DemoDeletedGoalSnapshot[] = []
  const now = fakeTimestamp(new Date())

  for (const { goal, decision } of choices) {
    const current = data.goals.get(goal.id)
    if (!current) continue

    if (decision === 'carryOver') {
      const carried = carryOverGoal(goal)
      const newId = nextId('goal')
      data.goals.set(newId, {
        name: carried.name,
        month: carried.month,
        totalMinutes: carried.totalMinutes,
        chunkMinutes: carried.chunkMinutes,
        completedChunks: carried.completedChunks,
        carryMinutes: carried.carryMinutes,
        status: carried.status,
        carriedFrom: carried.carriedFrom,
        hue: carried.hue,
        createdAt: now,
        updatedAt: now,
      })
      data.goals.set(goal.id, { ...current, status: 'carried', updatedAt: now })
    } else if (decision === 'archive') {
      data.goals.set(goal.id, { ...current, status: 'archived', updatedAt: now })
    } else if (decision === 'abandon') {
      data.goals.set(goal.id, { ...current, status: 'abandoned', updatedAt: now })
    } else {
      const goalSessions: Session[] = [...data.sessions.entries()]
        .filter(([, s]) => s.goalId === goal.id)
        .map(([id, s]) => ({ id, ...s }))
      deleted.push({ goal: { id: goal.id, ...current }, sessions: goalSessions })
      data.goals.delete(goal.id)
      for (const session of goalSessions) data.sessions.delete(session.id)
    }
  }

  return { deleted }
}

export function demoRestoreDeletedGoal(snapshot: DemoDeletedGoalSnapshot): void {
  const data = ensureSeeded()
  const { id: goalId, ...goalData } = snapshot.goal
  data.goals.set(goalId, goalData)
  for (const session of snapshot.sessions) {
    const { id: sessionId, ...sessionData } = session
    data.sessions.set(sessionId, sessionData)
  }
}

export function demoLogSleep(month: string, day: string, entry: SleepEntry): void {
  const data = ensureSeeded()
  const monthDoc = data.months.get(month) ?? { days: {}, sleep: {} }
  monthDoc.sleep = monthDoc.sleep ?? {}
  monthDoc.sleep[day] = entry
  data.months.set(month, monthDoc)
}

export interface DemoAddSpendingInput {
  date: string
  amount: number
  category: string
  note?: string
}

export function demoAddSpending(input: DemoAddSpendingInput): string {
  const data = ensureSeeded()
  const spendingId = nextId('spending')
  const spendingData: SpendingData = {
    date: input.date,
    amount: input.amount,
    category: input.category,
    note: input.note,
    createdAt: fakeTimestamp(new Date()),
  }
  data.spending.set(spendingId, spendingData)
  return spendingId
}

export function demoDeleteSpending(entryId: string): void {
  const data = ensureSeeded()
  data.spending.delete(entryId)
}

export function demoRestoreSpending(entry: SpendingEntry): void {
  const data = ensureSeeded()
  const { id, ...rest } = entry
  data.spending.set(id, rest)
}
