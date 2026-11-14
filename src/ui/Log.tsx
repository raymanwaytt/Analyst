import type { Rep, Scenario } from "../domain/types"
import { marksFor } from "../domain/scoring"
import { formatDay } from "../domain/time"
import { Card } from "./primitives"

export function Log({
  reps,
  scenarios,
  onRedo,
}: {
  reps: Rep[]
  scenarios: Map<string, Scenario>
  onRedo: (repId: string) => void
}) {
  const rows = [...reps].filter((rep) => rep.status === "complete").sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
  if (rows.length === 0) {
    return (
      <Card>
        <h1 className="font-serif text-2xl">Log</h1>
        <p className="mt-2 text-sm leading-6">Nothing logged yet. Finish today’s brief and it will sit here, including the hypothesis you locked.</p>
      </Card>
    )
  }
  return (
    <div className="space-y-3">
      <h1 className="font-serif text-2xl">Log</h1>
      {rows.map((rep) => {
        const scenario = scenarios.get(rep.scenarioId)
        const marks = scenario ? marksFor(rep, scenario) : null
        return (
          <Card key={rep.id}>
            <p className="text-xs text-muted">
              {formatDay(rep.lagosDate)} · {rep.kind === "redo" ? "Redo" : "Daily"}
              {scenario ? ` · ${scenario.difficulty}` : ""}
            </p>
            <h2 className="mt-1 font-serif text-lg">{scenario?.metric ?? rep.scenarioId}</h2>
            <p className="mt-2 text-sm leading-6">{rep.hypothesis}</p>
            {marks ? (
              <p className="mt-2 text-sm">
                Lever {marks.topHit ? "hit" : "missed"} · Ambiguity {marks.ambiguityCorrect ? "named" : "missed"} · Checklist{" "}
                {Math.round(marks.coverage * 100)}% · Confidence {rep.confidence}
              </p>
            ) : null}
            {rep.kind === "daily" ? (
              <button type="button" className="mt-3 text-sm font-medium text-rust" onClick={() => onRedo(rep.id)}>
                Cold redo
              </button>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
