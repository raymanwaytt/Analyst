/**
 * Every unlock, streak and label uses Africa/Lagos (WAT, UTC+1, no daylight saving).
 * The phone's own timezone is ignored on purpose: a trip to another zone must not
 * open tomorrow's brief early or skip a day.
 */

const ZONE = "Africa/Lagos"

export function lagosDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function lagosHour(now: Date): number {
  const raw = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now)
  const hour = Number(raw)
  return hour === 24 ? 0 : hour
}

export function lagosWeekdayIndex(now: Date): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    weekday: "short",
  }).format(now)
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name)
}

export function parseDay(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number)
  return Date.UTC(year, month - 1, day)
}

export function addDays(iso: string, days: number): string {
  return new Date(parseDay(iso) + days * 86_400_000).toISOString().slice(0, 10)
}

export function daysBetween(earlier: string, later: string): number {
  return Math.round((parseDay(later) - parseDay(earlier)) / 86_400_000)
}

export function eachDate(start: string, end: string): string[] {
  if (end < start) return []
  const dates: string[] = []
  let cursor = start
  while (cursor <= end) {
    dates.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return dates
}

export function formatLagosStamp(now: Date): string {
  const stamp = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now)
  return `${stamp} WAT`
}

export function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const noon = new Date(Date.UTC(year, month - 1, day, 12))
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(noon)
}

export function isSunday(iso: string): boolean {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay() === 0
}
