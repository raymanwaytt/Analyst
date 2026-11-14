import type { AmbiguityType, AppState, Difficulty, Rep, Scenario, Theme } from "./types"
import { addDays, daysBetween, eachDate, lagosDate, lagosHour } from "./time"
import { marksFor } from "./scoring"

/**
 * One brief per Lagos day, including days you missed. Assignments are written
 * once and then left alone, so a later hot streak cannot rewrite last Tuesday.
 *
 * The first brief is the travel-support example, so the loop is taught on a
 * familiar shape. After that, unseen scenarios are drawn by difficulty band and
 * weekly theme, with a light preference against repeating the same ambiguity
 * type two days running.
 *
 * Real companies are never blind. The brand is the spoiler.
 */

export const FIRST_REP_ID = "route-wait"
const THEME_CYCLE: Theme[] = ["fintech-credit", "ops", "growth-marketing", "mixed"]
const BANDS: Difficulty[] = ["easy", "medium", "hard"]

export function latestUnlockDate(now: Date, startDate: string): string {
  const today = lagosDate(now)
  const cap = lagosHour(now) >= 8 ? today : addDays(today, -1)
  if (cap < startDate) return startDate
  return cap
}

export function baseDifficulty(dayIndex: number): Difficulty {
  if (dayIndex < 28) return "easy"
  if (dayIndex < 120) return "medium"
  return "hard"
}

export function adaptedDifficulty(dayIndex: number, recentScores: number[]): Difficulty {
  let index = BANDS.indexOf(baseDifficulty(dayIndex))
  if (recentScores.length < 3) return BANDS[index]
  const sample = recentScores.slice(-5)
  const average = sample.reduce((sum, score) => sum + score, 0) / sample.length
  if (average >= 0.75) index = Math.min(BANDS.length - 1, index + 1)
  if (average <= 0.4) index = Math.max(0, index - 1)
  return BANDS[index]
}

export function themeForDay(dayIndex: number): Theme {
  return THEME_CYCLE[Math.floor(dayIndex / 7) % THEME_CYCLE.length]
}

export function isBlindDay(dayIndex: number, scenario: Scenario, blind: AppState["settings"]["blind"]): boolean {
  if (scenario.company_type === "real") return false
  if (blind === "off") return false
  if (blind === "always") return true
  return dayIndex % 5 === 4
}

function recentScores(reps: Rep[], scenarios: Map<string, Scenario>): number[] {
  return reps
    .filter((rep) => rep.kind === "daily" && rep.status === "complete")
    .map((rep) => {
      const scenario = scenarios.get(rep.scenarioId)
      return scenario ? marksFor(rep, scenario).score : null
    })
    .filter((score): score is number => score !== null)
}

function pickScenario(
  scenarios: Scenario[],
  used: Set<string>,
  band: Difficulty,
  theme: Theme,
  recentAmbiguity: AmbiguityType | null,
  forceFirst: boolean,
): Scenario | null {
  if (forceFirst) {
    const starter = scenarios.find((scenario) => scenario.id === FIRST_REP_ID && !used.has(scenario.id))
    if (starter) return starter
  }
  const available = scenarios.filter((scenario) => !used.has(scenario.id))
  if (available.length === 0) return null
  const ranked = [...available].sort((a, b) => {
    const score = (scenario: Scenario) =>
      (scenario.difficulty === band ? 2 : 0) + (scenario.theme === theme ? 1 : 0)
    const byFit = score(b) - score(a)
    if (byFit !== 0) return byFit
    const aRepeat = recentAmbiguity && a.ambiguity_type === recentAmbiguity ? 1 : 0
    const bRepeat = recentAmbiguity && b.ambiguity_type === recentAmbiguity ? 1 : 0
    if (aRepeat !== bRepeat) return aRepeat - bRepeat
    return a.id.localeCompare(b.id)
  })
  return ranked[0] ?? null
}

export function ensureAssignments(state: AppState, scenarios: Scenario[], now: Date): AppState {
  const end = latestUnlockDate(now, state.startDate)
  const dates = eachDate(state.startDate, end)
  const assignments = { ...state.assignments }
  const used = new Set(Object.values(assignments))
  const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]))
  const scores = recentScores(state.reps, byId)
  let changed = false
  let previousAmbiguity: AmbiguityType | null = null

  for (const date of dates) {
    const existing = assignments[date]
    if (existing) {
      previousAmbiguity = byId.get(existing)?.ambiguity_type ?? previousAmbiguity
      continue
    }
    const dayIndex = daysBetween(state.startDate, date)
    const pick = pickScenario(
      scenarios,
      used,
      adaptedDifficulty(dayIndex, scores),
      themeForDay(dayIndex),
      previousAmbiguity,
      used.size === 0,
    )
    if (!pick) break
    assignments[date] = pick.id
    used.add(pick.id)
    previousAmbiguity = pick.ambiguity_type
    changed = true
  }

  if (!changed) return state
  return { ...state, assignments }
}

export function refillFreeze(state: AppState, today: string): AppState {
  const month = today.slice(0, 7)
  if (state.freeze.month === month) return state
  return {
    ...state,
    freeze: { month, remaining: 2, bridgedDates: [] },
  }
}

function completedDailyDates(state: AppState): Set<string> {
  const dates = new Set<string>()
  for (const rep of state.reps) {
    if (rep.kind === "daily" && rep.status === "complete") dates.add(rep.lagosDate)
  }
  return dates
}

/**
 * One missed day can be bridged by a freeze token. Two misses in a row break
 * the streak. Tokens reset to two on the first open of a new Lagos month and
 * do not roll over.
 */
export function bridgeFreeze(state: AppState, unlockDate: string): AppState {
  const done = completedDailyDates(state)
  const last = [...done].sort().at(-1)
  if (!last || last >= unlockDate) return state
  const gap = daysBetween(last, unlockDate)
  if (gap !== 2) return state
  const missed = addDays(last, 1)
  if (missed < state.startDate) return state
  if (state.freeze.bridgedDates.includes(missed)) return state
  if (state.freeze.remaining <= 0) return state
  return {
    ...state,
    freeze: {
      ...state.freeze,
      remaining: state.freeze.remaining - 1,
      bridgedDates: [...state.freeze.bridgedDates, missed],
    },
  }
}

export function prepareState(state: AppState, scenarios: Scenario[], now: Date): AppState {
  const unlocked = latestUnlockDate(now, state.startDate)
  const frozen = bridgeFreeze(refillFreeze(state, lagosDate(now)), unlocked)
  return ensureAssignments(frozen, scenarios, now)
}

export function streakCount(state: AppState, unlockDate: string): number {
  const done = completedDailyDates(state)
  const bridged = new Set(state.freeze.bridgedDates)
  const anchor = done.has(unlockDate) ? unlockDate : addDays(unlockDate, -1)
  if (anchor < state.startDate && !done.has(state.startDate)) return 0
  let cursor = anchor
  let days = 0
  while (cursor >= state.startDate) {
    if (done.has(cursor) || bridged.has(cursor)) {
      days += 1
      cursor = addDays(cursor, -1)
      continue
    }
    break
  }
  return days
}

export function openDates(state: AppState, unlockDate: string): string[] {
  return eachDate(state.startDate, unlockDate).filter((date) => state.assignments[date])
}
