/** 0-23 -> a calm time-of-day greeting, no name attached. */
export function timeOfDayGreeting(hour: number): string {
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Appends a first name when one is available (falls back gracefully for anonymous/guest sessions). */
export function greetingFor(hour: number, displayName?: string | null): string {
  const greeting = timeOfDayGreeting(hour)
  const firstName = displayName?.trim().split(/\s+/)[0]
  return firstName ? `${greeting}, ${firstName}` : greeting
}
