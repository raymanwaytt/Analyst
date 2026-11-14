import type { AppState, Scenario } from "../domain/types"
import { TAG_LABEL } from "../domain/labels"
import { calibrationBuckets, calibrationSentence, levelFor, marksFor, tagStats, totalXp } from "../domain/scoring"
import { streakCount } from "../domain/schedule"
import { eachDate, formatDay, lagosDate } from "../domain/time"
import { Card } from "./primitives"

function monthDates(month: string): string[] {
  const [year, monthNumber] = month.split("-").map(Number)
  const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const end = `${month}-${String(last).padStart(2, "0")}`
  return eachDate(`${month}-01`, end)
}

/** Leading blanks so the 1st sits on the right weekday. Column 0 is Sunday, matching Lagos dates. */
function monthCells(month: string): (string | null)[] {
  const days = monthDates(month)
  const [year, monthNumber] = month.split("-").map(Number)
  const lead = new Date(Date.UTC(year, monthNumber - 1, 1, 12)).getUTCDay()
  return [...Array<null>(lead).fill(null), ...days]
}

export function Stats({
  state,
  scenarios,
  unlock,
}: {
  state: AppState
  scenarios: Map<string, Scenario>
  unlock: string
}) {
  const completed = state.reps.filter((rep) => rep.status === "complete")
  const xp = totalXp(completed, scenarios)
  const level = levelFor(xp)
  const streak = streakCount(state, unlock)
  const tags = tagStats(completed, scenarios)
  const buckets = calibrationBuckets(completed)
  const trend = completed
    .filter((rep) => rep.kind === "daily")
    .sort((a, b) => a.lagosDate.localeCompare(b.lagosDate))
    .slice(-14)
    .map((rep) => {
      const scenario = scenarios.get(rep.scenarioId)
      return { date: rep.lagosDate, score: scenario ? marksFor(rep, scenario).score : 0 }
    })
  const month = lagosDate(new Date()).slice(0, 7)
  const days = monthCells(month)
  const done = new Set(completed.filter((rep) => rep.kind === "daily").map((rep) => rep.lagosDate))

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-serif text-2xl">Stats</h1>
        <p className="mt-1 text-sm text-muted">
          {level.name}
          {level.next ? ` · ${level.into} / ${level.span} toward ${level.next}` : ""} · {xp} XP · {streak} day streak
        </p>
      </header>

      <Card>
        <h2 className="text-sm font-semibold">Rep score, last {trend.length || "0"}</h2>
        <p className="mt-1 text-xs text-muted">Average of lever hit, ambiguity named, and checklist coverage. Coverage alone is not the score.</p>
        {trend.length === 0 ? (
          <p className="mt-3 text-sm">Log a brief and the trend starts.</p>
        ) : (
          <div className="mt-3 flex h-24 items-end gap-1">
            {trend.map((point) => (
              <div key={point.date} className="flex-1" title={`${formatDay(point.date)} ${Math.round(point.score * 100)}`}>
                <div className="w-full rounded-sm bg-rust" style={{ height: `${Math.max(8, point.score * 100)}%` }} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Coverage by tag</h2>
        <ul className="mt-3 space-y-3">
          {tags.map((tag) => (
            <li key={tag.tag}>
              <div className="flex justify-between text-sm">
                <span>{TAG_LABEL[tag.tag]}</span>
                <span className="text-muted">
                  {tag.exposed ? `${tag.hit}/${tag.total}` : "No exposure yet"}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-line">
                <div
                  className="h-2 rounded-full bg-ink"
                  style={{ width: tag.total ? `${(tag.hit / tag.total) * 100}%` : "0%" }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Calibration</h2>
        <p className="mt-1 text-sm leading-6">{calibrationSentence(buckets)}</p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="py-1 font-medium">Said</th>
              <th className="py-1 font-medium">Reps</th>
              <th className="py-1 font-medium">Hypothesis held</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr key={bucket.confidence} className="border-t border-line">
                <td className="py-1">{bucket.confidence}</td>
                <td className="py-1">{bucket.n}</td>
                <td className="py-1">{bucket.n ? `${Math.round((bucket.survived / bucket.n) * 100)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">This month</h2>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
          {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
            <div key={`${label}-${index}`} className="py-1 text-muted">
              {label}
            </div>
          ))}
          {days.map((date, index) => {
            if (!date) return <div key={`blank-${index}`} />
            const bridged = state.freeze.bridgedDates.includes(date)
            const logged = done.has(date)
            return (
              <div
                key={date}
                className={`rounded py-2 ${logged ? "bg-ink text-paper" : bridged ? "bg-[#e7d3b4]" : "bg-paper"}`}
              >
                {Number(date.slice(-2))}
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-muted">Ink is a logged day. Tan is a freeze. {state.freeze.remaining} freeze tokens left in {state.freeze.month}.</p>
      </Card>
    </div>
  )
}
