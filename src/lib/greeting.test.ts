import { describe, expect, it } from 'vitest'
import { greetingFor, timeOfDayGreeting } from './greeting'

describe('timeOfDayGreeting', () => {
  it('returns morning, afternoon, evening, and night buckets', () => {
    expect(timeOfDayGreeting(3)).toBe('Good night')
    expect(timeOfDayGreeting(9)).toBe('Good morning')
    expect(timeOfDayGreeting(14)).toBe('Good afternoon')
    expect(timeOfDayGreeting(20)).toBe('Good evening')
  })

  it('is inclusive/exclusive at the bucket edges', () => {
    expect(timeOfDayGreeting(5)).toBe('Good morning')
    expect(timeOfDayGreeting(12)).toBe('Good afternoon')
    expect(timeOfDayGreeting(18)).toBe('Good evening')
  })
})

describe('greetingFor', () => {
  it('appends just the first name', () => {
    expect(greetingFor(9, 'Ada Lovelace')).toBe('Good morning, Ada')
  })

  it('omits the name entirely when there is none (anonymous/guest session)', () => {
    expect(greetingFor(9, null)).toBe('Good morning')
    expect(greetingFor(9, undefined)).toBe('Good morning')
    expect(greetingFor(9, '')).toBe('Good morning')
  })
})
