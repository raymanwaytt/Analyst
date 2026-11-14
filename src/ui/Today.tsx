import { useState } from "react"
import type { AppState, Rep, Scenario } from "../domain/types"
import { THEME_LABEL } from "../domain/labels"
import { blankRep, lockRep, upsertRep } from "../domain/reps"
import { isBlindDay, latestUnlockDate } from "../domain/schedule"
import { daysBetween, formatDay, lagosDate, lagosHour } from "../domain/time"
import { sundayReview } from "../domain/review"
import { debrief } from "../domain/scoring"
import { ReadForm } from "./ReadForm"
import { Reveal } from "./Reveal"
import { Button, Card, TextArea } from "./primitives"

export function Today({
  state,
  scenarios,
  now,
  update,
  onRedo,
}: {
  state: AppState
  scenarios: Scenario[]
  now: Date
  update: (fn: (state: AppState) => AppState) => void
  onRedo: (repId: string) => void
}) {
  const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]))
  const unlock = latestUnlockDate(now, state.startDate)
  const dates = Object.keys(state.assignments)
    .filter((date) => date <= unlock)
    .sort()
  const [picked, setPicked] = useState<string | null>(null)
  const selected = picked && dates.includes(picked) ? picked : (dates.at(-1) ?? unlock)
  const scenarioId = state.assignments[selected]
  const scenario = scenarioId ? byId.get(scenarioId) : undefined
  const daily = state.reps.find((rep) => rep.kind === "daily" && rep.lagosDate === selected)
  const calendarToday = lagosDate(now)
  const waiting = lagosHour(now) < 8 && calendarToday > unlock
  const review = sundayReview(state.reps, byId, unlock)
  const retrievalTarget = [...state.reps]
    .filter((rep) => rep.kind === "daily" && rep.status === "complete" && rep.lagosDate < calendarToday)
    .sort((a, b) => b.lagosDate.localeCompare(a.lagosDate))[0]
  const retrievalDone = state.retrievals.some((item) => item.lagosDate === calendarToday)

  const save = (rep: Rep) => update((current) => upsertRep(current, rep))

  return (
    <div className="space-y-4">
      {waiting ? (
        <p className="rounded-md border border-line bg-card px-3 py-2 text-sm">
          Today’s brief unlocks at 08:00 WAT. Yesterday’s is open.
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.keys(state.assignments)
          .sort()
          .slice(-10)
          .map((date) => {
            const done = state.reps.some((rep) => rep.kind === "daily" && rep.lagosDate === date && rep.status === "complete")
            const active = date === selected
            return (
              <button
                key={date}
                type="button"
                onClick={() => setPicked(date)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${active ? "border-ink bg-ink text-paper" : "border-line bg-card"}`}
              >
                {formatDay(date)}
                {done ? " · logged" : ""}
              </button>
            )
          })}
      </div>

      {!retrievalDone && retrievalTarget ? (
        <RetrievalCard
          rep={retrievalTarget}
          scenario={byId.get(retrievalTarget.scenarioId)}
          onSave={(answer, skipped) =>
            update((current) => ({
              ...current,
              retrievals: [
                ...current.retrievals,
                {
                  id: crypto.randomUUID(),
                  lagosDate: calendarToday,
                  aboutRepId: retrievalTarget.id,
                  answer,
                  skipped,
                },
              ],
            }))
          }
        />
      ) : null}

      {review.length > 0 ? (
        <Card>
          <h2 className="font-serif text-lg">Sunday review</h2>
          <p className="mt-1 text-sm text-muted">The thinnest briefs from the last seven days. A cold redo, then a before and after.</p>
          <ul className="mt-3 space-y-2">
            {review.map((rep) => {
              const item = byId.get(rep.scenarioId)
              return (
                <li key={rep.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{item?.metric ?? rep.scenarioId}</span>
                  <button type="button" className="font-medium text-rust" onClick={() => onRedo(rep.id)}>
                    Redo
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      ) : null}

      {!scenario ? (
        <Card>
          <h2 className="font-serif text-xl">The bank is used up</h2>
          <p className="mt-2 text-sm leading-6">
            Every scenario has already been assigned. Import another JSON file from Library, or redo a weak brief from the log. Missed days stay on the date strip above.
          </p>
        </Card>
      ) : (
        <Brief
          state={state}
          scenario={scenario}
          date={selected}
          rep={daily}
          onSave={save}
          onStart={() => {
            const dayIndex = daysBetween(state.startDate, selected)
            const blind = isBlindDay(dayIndex, scenario, state.settings.blind)
            update((current) => {
              if (current.reps.some((item) => item.kind === "daily" && item.lagosDate === selected)) return current
              return upsertRep(current, blankRep(scenario.id, selected, blind, "daily"))
            })
          }}
        />
      )}
    </div>
  )
}

function Brief({
  state,
  scenario,
  date,
  rep,
  onSave,
  onStart,
}: {
  state: AppState
  scenario: Scenario
  date: string
  rep?: Rep
  onSave: (rep: Rep) => void
  onStart: () => void
}) {
  const blind = rep?.blind ?? false
  return (
    <div className="space-y-5">
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {scenario.company_type === "real"
            ? "Based on a real reported event. Numbers are illustrative, not exact."
            : "Practice scenario, fictional."}
        </p>
        <p className="mt-2 text-xs text-muted">
          {scenario.difficulty} · {THEME_LABEL[scenario.theme]}
          {blind ? " · Blind round" : ""}
        </p>
        {!blind ? (
          <p className="mt-3 text-sm">
            {scenario.company} · {scenario.industry} · {scenario.function}
          </p>
        ) : null}
        <h1 className="mt-3 font-serif text-2xl leading-snug">{blind ? scenario.blind_text : scenario.blind_text}</h1>
        {!blind ? <p className="mt-3 text-sm leading-6 text-muted">{scenario.context}</p> : null}
        <p className="mt-4 border-t border-line pt-3 text-sm">
          <span className="font-semibold">Decision. </span>
          {scenario.decision}
        </p>
        <p className="mt-2 text-xs text-muted">{formatDay(date)}</p>
      </Card>

      {!rep ? (
        <Button type="button" className="w-full" onClick={onStart}>
          Write your read
        </Button>
      ) : null}

      {rep && rep.status === "draft" ? (
        <ReadForm rep={rep} onChange={onSave} onLock={() => onSave(lockRep(rep, scenario))} />
      ) : null}

      {rep && rep.status !== "draft" ? (
        <Reveal rep={rep} scenario={scenario} onChange={onSave} onComplete={onSave} />
      ) : null}

      {rep?.status === "draft" ? null : state.freeze.bridgedDates.length > 0 ? (
        <p className="text-xs text-muted">
          Freeze used for {state.freeze.bridgedDates.map((item) => formatDay(item)).join(", ")}. {state.freeze.remaining} left
          this month.
        </p>
      ) : null}
    </div>
  )
}

function RetrievalCard({
  rep,
  scenario,
  onSave,
}: {
  rep: Rep
  scenario?: Scenario
  onSave: (answer: string, skipped: boolean) => void
}) {
  const [answer, setAnswer] = useState("")
  const [open, setOpen] = useState(false)
  if (!scenario) return null
  const line = debrief(scenario, rep.ticks).line
  return (
    <Card>
      <h2 className="font-serif text-lg">Yesterday, from memory</h2>
      <p className="mt-2 text-sm">
        {scenario.metric} {scenario.direction} {scenario.size}. What was the check you missed, and how would it have changed the decision?
      </p>
      <TextArea className="mt-3" rows={3} value={answer} onChange={(event) => setAnswer(event.target.value)} />
      <div className="mt-3 flex gap-2">
        <Button type="button" kind="ink" onClick={() => setOpen(true)} disabled={answer.trim().length < 8}>
          Show what you logged
        </Button>
        <Button type="button" kind="ghost" onClick={() => onSave("", true)}>
          Skip
        </Button>
      </div>
      {open ? (
        <div className="mt-3 text-sm leading-6">
          <p className="font-medium">What you wrote just now</p>
          <p>{answer}</p>
          <p className="mt-2 font-medium">What the brief recorded</p>
          <p>{line}</p>
          <Button type="button" className="mt-3" onClick={() => onSave(answer, false)}>
            Keep this retrieval
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
