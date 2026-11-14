import type { Rep, Scenario } from "./types"
import { addDays, isSunday } from "./time"
import { marksFor } from "./scoring"

export function sundayReview(reps: Rep[], scenarios: Map<string, Scenario>, unlockDate: string): Rep[] {
  if (!isSunday(unlockDate)) return []
  const start = addDays(unlockDate, -6)
  const candidates = reps.filter(
    (rep) =>
      rep.kind === "daily" &&
      rep.status === "complete" &&
      rep.lagosDate >= start &&
      rep.lagosDate <= unlockDate,
  )
  const ranked = candidates
    .map((rep) => {
      const scenario = scenarios.get(rep.scenarioId)
      return { rep, score: scenario ? marksFor(rep, scenario).score : 1 }
    })
    .sort((a, b) => a.score - b.score || a.rep.lagosDate.localeCompare(b.rep.lagosDate))
  return ranked.slice(0, 3).map((row) => row.rep)
}
