import { describe, expect, it } from "vitest"
import seed from "../../scenarios/seed.json"
import { mergeBackup } from "./backup"
import { validateScenarioFile } from "./scenario"
import {
  calibrationSentence,
  chasedHerrings,
  debrief,
  domainHit,
  marksFor,
  suggestTicks,
  teachIsGeneric,
} from "./scoring"
import {
  adaptedDifficulty,
  bridgeFreeze,
  ensureAssignments,
  latestUnlockDate,
  streakCount,
  themeForDay,
} from "./schedule"
import { lagosDate, lagosHour } from "./time"
import type { AppState, Rep, Scenario } from "./types"
import { sundayReview } from "./review"

const validated = validateScenarioFile(seed)
const scenarios = validated.scenarios

function state(partial: Partial<AppState> = {}): AppState {
  return {
    version: 1,
    startDate: "2026-11-14",
    assignments: {},
    reps: [],
    imported: [],
    settings: { blind: "auto" },
    retrievals: [],
    freeze: { month: "2026-11", remaining: 2, bridgedDates: [] },
    ...partial,
  }
}

function draft(partial: Partial<Rep> = {}): Rep {
  return {
    id: "rep-1",
    scenarioId: "route-wait",
    lagosDate: "2026-11-14",
    kind: "daily",
    createdAt: "2026-11-14T08:00:00.000Z",
    status: "revealed",
    hypothesis: "Wait time rose because weekend volume outgrew the thin crew, so I would add Saturday shifts.",
    confidence: 4,
    premortem: "The queue is actually weekday flight disruptions, and weekend shifts miss it.",
    ambiguityGuess: "missing_denominator",
    killCheck: "Weekday versus weekend volume split",
    domainGuess: "travel support",
    blind: false,
    investigation: ["chat volume", "weekday weekend split", "staffing"],
    ticks: [],
    suggestions: [],
    mindChanger: "",
    mindChangerRevealed: false,
    hypothesisOutcome: "",
    teachAnswer: "",
    teachNudged: false,
    ...partial,
  }
}

describe("Lagos clock", () => {
  it("reads WAT rather than the machine zone", () => {
    const beforeEight = new Date("2026-11-14T06:30:00.000Z")
    const atEight = new Date("2026-11-14T07:00:00.000Z")
    expect(lagosDate(beforeEight)).toBe("2026-11-14")
    expect(lagosHour(beforeEight)).toBe(7)
    expect(lagosHour(atEight)).toBe(8)
  })

  it("unlocks the first morning immediately and holds later mornings until 08:00", () => {
    const early = new Date("2026-11-14T06:30:00.000Z")
    expect(latestUnlockDate(early, "2026-11-14")).toBe("2026-11-14")
    expect(latestUnlockDate(early, "2026-11-13")).toBe("2026-11-13")
    expect(latestUnlockDate(new Date("2026-11-14T07:00:00.000Z"), "2026-11-13")).toBe("2026-11-14")
  })
})

describe("schedule", () => {
  it("gives the first day the travel example and does not repeat ids", () => {
    const first = ensureAssignments(state(), scenarios, new Date("2026-11-14T08:00:00.000Z"))
    expect(first.assignments["2026-11-14"]).toBe("route-wait")
    const later = ensureAssignments(first, scenarios, new Date("2026-11-16T08:00:00.000Z"))
    const ids = Object.values(later.assignments)
    expect(new Set(ids).size).toBe(ids.length)
    expect(later.assignments["2026-11-14"]).toBe("route-wait")
    expect(later.assignments["2026-11-16"]).toBeTruthy()
  })

  it("rotates themes by week and adapts difficulty off recent scores", () => {
    expect(themeForDay(0)).toBe("fintech-credit")
    expect(themeForDay(7)).toBe("ops")
    expect(adaptedDifficulty(0, [])).toBe("easy")
    expect(adaptedDifficulty(0, [0.9, 0.9, 0.8])).toBe("medium")
    expect(adaptedDifficulty(40, [0.2, 0.3, 0.2])).toBe("easy")
  })

  it("spends one freeze on a single missed day and keeps the streak", () => {
    const base = state({
      startDate: "2026-11-10",
      reps: [draft({ lagosDate: "2026-11-10", status: "complete" })],
    })
    const bridged = bridgeFreeze(base, "2026-11-12")
    expect(bridged.freeze.remaining).toBe(1)
    expect(bridged.freeze.bridgedDates).toEqual(["2026-11-11"])
    expect(streakCount(bridged, "2026-11-12")).toBe(2)
    expect(bridgeFreeze(bridged, "2026-11-12").freeze.remaining).toBe(1)
  })
})

describe("scoring", () => {
  const route = scenarios.find((scenario) => scenario.id === "route-wait") as Scenario

  it("suggests ticks from synonyms and lets the debrief name the missed lever", () => {
    const suggestions = suggestTicks(route, "chat volume rose, and staffing on saturday looks thin")
    expect(suggestions.some(Boolean)).toBe(true)
    const ticks = route.angles.map(() => false)
    const missed = debrief(route, ticks)
    expect(missed.missed).toBe(true)
    expect(missed.line).toContain(route.top_check.why)
  })

  it("flags a herring only when the list chases it", () => {
    const chased = chasedHerrings(route, "The competitor fare sale explains the wait time")
    expect(chased.map((item) => item.text).join(" ")).toMatch(/competitor/i)
    expect(chasedHerrings(route, "weekday volume versus weekend staffing")).toHaveLength(0)
  })

  it("scores the ambiguity and treats a reusable sentence as generic", () => {
    const rep = draft({ ticks: route.angles.map((angle) => angle.check === route.top_check.check) })
    const marks = marksFor(rep, route)
    expect(marks.topHit).toBe(true)
    expect(marks.ambiguityCorrect).toBe(true)
    expect(teachIsGeneric("This would change the decision a lot.", route)).toBe(true)
    expect(
      teachIsGeneric(
        "If weekday disruption chats are the queue, weekend shifts miss the wait time entirely.",
        route,
      ),
    ).toBe(false)
  })

  it("accepts a travel-domain guess", () => {
    expect(domainHit("online travel support", route)).toBe(true)
    expect(domainHit("telecom", route)).toBe(false)
  })
})

describe("scenarios file", () => {
  it("loads the seed bank with no errors", () => {
    expect(validated.issues.filter((issue) => issue.severity === "error")).toEqual([])
    expect(validated.scenarios.length).toBeGreaterThanOrEqual(8)
    const real = validated.scenarios.filter((scenario) => scenario.company_type === "real")
    expect(real.every((scenario) => scenario.source?.url.startsWith("https://"))).toBe(true)
  })

  it("rejects a real scenario with no source and fills missing keywords", () => {
    const broken = validateScenarioFile([
      {
        id: "no-source",
        company_type: "real",
        company: "Example",
        industry: "Bank",
        function: "Ops",
        difficulty: "easy",
        theme: "ops",
        metric: "Uptime",
        direction: "down",
        size: "a lot",
        timeframe: "a week",
        context: "Something broke in production last week.",
        ambiguity_type: "none",
        blind_text: "Uptime fell last week.",
        decision: "Page the vendor?",
        angles: [
          { check: "Did the failure cluster in one channel only", tag: "supply" },
          { check: "Was volume unusually high that morning", tag: "volume", keywords: ["volume"] },
          { check: "Did the definition of uptime change", tag: "data", keywords: ["definition"] },
        ],
        red_herrings: [],
        top_check: {
          check: "Did the failure cluster in one channel only",
          why: "A single channel points at a release, not a capacity buy.",
        },
        what_would_change_your_mind: "A second channel failing the same way.",
      },
    ])
    expect(broken.scenarios).toHaveLength(0)
    expect(broken.issues.some((issue) => issue.message.includes("source"))).toBe(true)

    const generated = validateScenarioFile([
      {
        id: "missing-words",
        company_type: "fictional",
        company: "Example",
        industry: "Bank",
        function: "Ops",
        difficulty: "easy",
        theme: "ops",
        metric: "Uptime",
        direction: "down",
        size: "a lot",
        timeframe: "a week",
        context: "Something broke in production last week.",
        ambiguity_type: "none",
        blind_text: "Uptime fell last week.",
        decision: "Page the vendor?",
        angles: [
          { check: "Did the failure cluster in one channel only", tag: "supply" },
          { check: "Was volume unusually high that morning", tag: "volume" },
          { check: "Did the definition of uptime change overnight", tag: "data" },
        ],
        red_herrings: [],
        top_check: {
          check: "Did the failure cluster in one channel only",
          why: "A single channel points at a release, not a capacity buy.",
        },
        what_would_change_your_mind: "A second channel failing the same way.",
      },
    ])
    expect(generated.scenarios[0].angles[0].keywords.length).toBeGreaterThan(0)
    expect(generated.issues.some((issue) => issue.severity === "warning")).toBe(true)
  })
})

describe("backup and review", () => {
  it("keeps the local rep when a backup shares its id", () => {
    const local = state({ reps: [draft({ hypothesis: "local claim" })] })
    const incoming = state({
      startDate: "2026-11-01",
      reps: [draft({ hypothesis: "older claim" })],
      assignments: { "2026-11-01": "cedar-approval" },
    })
    const merged = mergeBackup(local, incoming)
    expect(merged.startDate).toBe("2026-11-01")
    expect(merged.reps[0].hypothesis).toBe("local claim")
    expect(merged.assignments["2026-11-01"]).toBe("cedar-approval")
  })

  it("surfaces the weakest recent reps on Sunday", () => {
    const route = scenarios.find((scenario) => scenario.id === "route-wait") as Scenario
    const weak = draft({
      id: "weak",
      status: "complete",
      lagosDate: "2026-11-15",
      ambiguityGuess: "none",
      ticks: route.angles.map(() => false),
    })
    const strong = draft({
      id: "strong",
      status: "complete",
      lagosDate: "2026-11-14",
      ticks: route.angles.map(() => true),
    })
    const map = new Map<string, Scenario>([[route.id, route]])
    expect(isSundayDate("2026-11-15")).toBe(true)
    const picked = sundayReview([strong, weak], map, "2026-11-15")
    expect(picked[0]?.id).toBe("weak")
  })

  it("explains calibration without pretending one rep is a chart", () => {
    expect(calibrationSentence([{ confidence: 4, n: 1, survived: 1 }])).toMatch(/few reps/i)
  })
})

function isSundayDate(iso: string): boolean {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0
}
