import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { Timestamp } from 'firebase/firestore'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

/**
 * Runs against the real Firestore emulator (started by `npm run test:rules`
 * via `firebase emulators:exec`), not a mock — the whole point of this suite
 * is exercising the actual rules engine, not a JS reimplementation of it.
 * See README's "Security rules" section for how to run this locally.
 */

const PROJECT_ID = 'demo-chunks-rules-test'
const USER_A = 'user-a'
const USER_B = 'user-b'

const validGoal = {
  name: 'French',
  month: '2026-10',
  totalMinutes: 2400,
  chunkMinutes: 5,
  completedChunks: 10,
  carryMinutes: 2,
  status: 'active',
  hue: 0,
}

const validSession = {
  goalId: 'goal-1',
  date: '2026-10-06',
  minutes: 30,
  chunks: 6,
  carryBefore: 0,
  at: Timestamp.now(),
}

const validSpending = {
  date: '2026-10-06',
  amount: 12.5,
  category: 'Food',
  createdAt: Timestamp.now(),
}

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('goals', () => {
  it("owner can create, read and update their own goal", async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    const ref = db.doc(`users/${USER_A}/goals/goal-1`)
    await assertSucceeds(ref.set(validGoal))
    await assertSucceeds(ref.get())
    await assertSucceeds(ref.update({ completedChunks: 11 }))
  })

  it('user A cannot read or write user B\'s goal', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${USER_B}/goals/goal-1`).set(validGoal)
    })

    const dbA = testEnv.authenticatedContext(USER_A).firestore()
    const refOnB = dbA.doc(`users/${USER_B}/goals/goal-1`)
    await assertFails(refOnB.get())
    await assertFails(refOnB.set(validGoal))
    await assertFails(refOnB.update({ completedChunks: 999 }))
  })

  it('an unauthenticated request is rejected entirely', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(db.doc(`users/${USER_A}/goals/goal-1`).set(validGoal))
  })

  it('rejects a goal with an unknown field', async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    await assertFails(db.doc(`users/${USER_A}/goals/goal-1`).set({ ...validGoal, notARealField: true }))
  })

  it('rejects a goal missing a required field', async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    const withoutName: Partial<typeof validGoal> = { ...validGoal }
    delete withoutName.name
    await assertFails(db.doc(`users/${USER_A}/goals/goal-1`).set(withoutName))
  })

  it('rejects an invalid status value', async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    await assertFails(db.doc(`users/${USER_A}/goals/goal-1`).set({ ...validGoal, status: 'deleted' }))
  })

  it('rejects completedChunks greater than the goal can hold', async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    // totalMinutes=2400, chunkMinutes=5 -> max 480 chunks
    await assertFails(db.doc(`users/${USER_A}/goals/goal-1`).set({ ...validGoal, completedChunks: 481 }))
  })

  it('rejects carryMinutes >= chunkMinutes', async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    await assertFails(db.doc(`users/${USER_A}/goals/goal-1`).set({ ...validGoal, carryMinutes: 5 }))
  })

  it('owner can delete their own goal, but not another user\'s', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${USER_A}/goals/goal-1`).set(validGoal)
      await ctx.firestore().doc(`users/${USER_B}/goals/goal-1`).set(validGoal)
    })
    const dbA = testEnv.authenticatedContext(USER_A).firestore()
    await assertSucceeds(dbA.doc(`users/${USER_A}/goals/goal-1`).delete())
    await assertFails(dbA.doc(`users/${USER_B}/goals/goal-1`).delete())
  })
})

describe('sessions', () => {
  it('owner can create a valid session', async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    await assertSucceeds(db.doc(`users/${USER_A}/sessions/session-1`).set(validSession))
  })

  it('rejects an invalid session (minutes out of range)', async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    await assertFails(db.doc(`users/${USER_A}/sessions/session-1`).set({ ...validSession, minutes: 0 }))
    await assertFails(db.doc(`users/${USER_A}/sessions/session-2`).set({ ...validSession, minutes: 601 }))
  })

  it('sessions are immutable once written — update is always rejected, even by the owner', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${USER_A}/sessions/session-1`).set(validSession)
    })
    const db = testEnv.authenticatedContext(USER_A).firestore()
    await assertFails(db.doc(`users/${USER_A}/sessions/session-1`).update({ minutes: 45 }))
  })

  it('user B cannot read or create a session under user A\'s subtree', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${USER_A}/sessions/session-1`).set(validSession)
    })
    const dbB = testEnv.authenticatedContext(USER_B).firestore()
    await assertFails(dbB.doc(`users/${USER_A}/sessions/session-1`).get())
    await assertFails(dbB.doc(`users/${USER_A}/sessions/session-2`).set(validSession))
  })
})

describe('spending', () => {
  it('owner can create and read a valid spending entry', async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    await assertSucceeds(db.doc(`users/${USER_A}/spending/entry-1`).set(validSpending))
    await assertSucceeds(db.doc(`users/${USER_A}/spending/entry-1`).get())
  })

  it('rejects a negative amount', async () => {
    const db = testEnv.authenticatedContext(USER_A).firestore()
    await assertFails(db.doc(`users/${USER_A}/spending/entry-1`).set({ ...validSpending, amount: -5 }))
  })

  it('user B cannot read user A\'s spending', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${USER_A}/spending/entry-1`).set(validSpending)
    })
    const dbB = testEnv.authenticatedContext(USER_B).firestore()
    await assertFails(dbB.doc(`users/${USER_A}/spending/entry-1`).get())
  })
})

describe('months', () => {
  it('owner can read/write their own month doc; another user cannot', async () => {
    const dbA = testEnv.authenticatedContext(USER_A).firestore()
    await assertSucceeds(dbA.doc(`users/${USER_A}/months/2026-10`).set({ days: {} }, { merge: true }))

    const dbB = testEnv.authenticatedContext(USER_B).firestore()
    await assertFails(dbB.doc(`users/${USER_A}/months/2026-10`).get())
    await assertFails(dbB.doc(`users/${USER_A}/months/2026-10`).set({ days: {} }, { merge: true }))
  })
})

describe('sanity', () => {
  it('a fixture guard: the valid* objects above actually satisfy isValidGoal/isValidSession/isValidSpending as written', () => {
    expect(validGoal.completedChunks).toBeLessThanOrEqual(Math.ceil(validGoal.totalMinutes / validGoal.chunkMinutes))
    expect(validGoal.carryMinutes).toBeLessThan(validGoal.chunkMinutes)
  })
})
