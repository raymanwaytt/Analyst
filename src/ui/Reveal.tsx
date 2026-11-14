import { useState } from "react"
import { TAGS } from "../domain/types"
import type { HypothesisOutcome, Rep, Scenario } from "../domain/types"
import { AMBIGUITY_LABEL } from "../domain/labels"
import { httpUrl } from "../domain/scenario"
import {
  chasedHerrings,
  debrief,
  domainHit,
  investigationCorpus,
  marksFor,
  teachIsGeneric,
  xpFor,
} from "../domain/scoring"
import { Celebration } from "./art"
import { TagChip } from "./chips"
import { Button, Field, TextArea } from "./primitives"

export function Reveal({
  rep,
  scenario,
  earlier,
  onChange,
  onComplete,
}: {
  rep: Rep
  scenario: Scenario
  earlier?: Rep
  onChange: (rep: Rep) => void
  onComplete: (rep: Rep) => void
}) {
  const [nudge, setNudge] = useState("")
  const done = rep.status === "complete"
  const corpus = investigationCorpus(rep)
  const herrings = chasedHerrings(scenario, corpus)
  const note = debrief(scenario, rep.ticks)
  const marks = marksFor(rep, scenario)
  const grouped = TAGS.map((tag) => ({
    tag,
    rows: scenario.angles
      .map((angle, index) => ({ angle, index }))
      .filter((row) => row.angle.tag === tag),
  })).filter((group) => group.rows.length)

  const canFinish =
    rep.mindChangerRevealed && rep.hypothesisOutcome !== "" && rep.teachAnswer.trim().length > 0
  const sourceHref = scenario.source ? httpUrl(scenario.source.url) : null
  let order = 0

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-serif text-xl">Your list</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {rep.investigation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Hypothesis, confidence {rep.confidence}: {rep.hypothesis}
        </p>
      </section>

      {rep.blind ? (
        <p className="text-sm">
          You guessed <span className="font-medium">{rep.domainGuess || "nothing"}</span>. This was {scenario.industry},{" "}
          {scenario.function}. {domainHit(rep.domainGuess, scenario) ? "That lands." : "Different domain."}
        </p>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-xl">Expert checklist</h2>
          <p className="mt-1 text-sm text-muted">
            Suggested ticks came from your wording. Untick anything you did not really cover.
          </p>
        </div>
        {grouped.map((group) => (
          <div key={group.tag}>
            <TagChip tag={group.tag} />
            <ul className="mt-2 space-y-2">
              {group.rows.map(({ angle, index }) => {
                const suggested = rep.suggestions[index]
                const delay = order
                order += 1
                return (
                  <li
                    key={angle.check}
                    className="check-in rounded-xl border border-indigo-100 bg-white px-3 py-2 shadow-sm"
                    style={{ animationDelay: `${delay * 55}ms` }}
                  >
                    <label className="flex gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 accent-indigo-700"
                        checked={Boolean(rep.ticks[index])}
                        disabled={done}
                        onChange={() => {
                          const ticks = rep.ticks.map((ticked, tickIndex) => (tickIndex === index ? !ticked : ticked))
                          onChange({ ...rep, ticks })
                        }}
                      />
                      <span className="text-sm leading-6">
                        {angle.check}
                        {suggested ? (
                          <span className="mt-1 block text-xs font-medium text-amber-800">Suggested from your wording</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="hero print-flat rounded-2xl px-4 py-4 shadow-lift">
        <h2 className="font-serif text-xl">The check that moves the decision</h2>
        <p className="mt-2 text-sm leading-6">{note.line}</p>
      </section>

      {herrings.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <h2 className="text-sm font-semibold">You chased a detail that does not decide this</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {herrings.map((herring) => (
              <li key={herring.text}>
                <span className="font-medium">{herring.text}</span> {herring.why_irrelevant}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {scenario.difficulty === "hard" && scenario.framings.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-serif text-xl">Framings</h2>
          <p className="text-sm text-muted">Hard briefs do not have a single triumphant sentence. These two are not equal.</p>
          {scenario.framings.map((framing) => (
            <article key={framing.framing} className="rounded-xl border border-indigo-100 bg-white px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{framing.strength}</p>
              <p className="mt-1 text-sm">{framing.framing}</p>
              <p className="mt-2 text-sm text-muted">{framing.reason}</p>
            </article>
          ))}
        </section>
      ) : null}

      <Field
        label="What would change your mind?"
        hint="The one piece of data that would flip your conclusion. Then compare it with the model line."
      >
        <TextArea
          rows={3}
          disabled={done}
          value={rep.mindChanger}
          onChange={(event) => onChange({ ...rep, mindChanger: event.target.value, mindChangerRevealed: false })}
        />
        {!rep.mindChangerRevealed ? (
          <Button
            type="button"
            kind="ink"
            className="mt-2"
            disabled={rep.mindChanger.trim().length < 15 || done}
            onClick={() => onChange({ ...rep, mindChangerRevealed: true })}
          >
            Compare
          </Button>
        ) : (
          <p className="mt-3 text-sm leading-6">
            <span className="font-medium">Model line. </span>
            {scenario.what_would_change_your_mind}
          </p>
        )}
      </Field>

      <fieldset>
        <legend className="text-sm font-medium">Did the top check support, weaken, or kill the hypothesis?</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["supported", "weakened", "killed"] as HypothesisOutcome[]).map((outcome) => (
            <button
              key={outcome}
              type="button"
              disabled={done}
              aria-pressed={rep.hypothesisOutcome === outcome}
              onClick={() => onChange({ ...rep, hypothesisOutcome: outcome })}
              className={`min-h-11 rounded-xl border text-sm font-semibold capitalize transition active:scale-[0.98] motion-reduce:active:scale-100 ${rep.hypothesisOutcome === outcome ? "border-indigo-700 bg-indigo-700 text-white" : "border-indigo-100 bg-white"}`}
            >
              {outcome}
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Teach one check" hint={scenario.teach_me_prompt}>
        <TextArea
          rows={3}
          disabled={done}
          value={rep.teachAnswer}
          onChange={(event) => onChange({ ...rep, teachAnswer: event.target.value })}
        />
        {nudge ? <p className="mt-2 text-sm text-warn">{nudge}</p> : null}
        {!done ? (
          <Button
            type="button"
            kind="ghost"
            className="mt-2"
            onClick={() => {
              if (teachIsGeneric(rep.teachAnswer, scenario) && !rep.teachNudged) {
                onChange({ ...rep, teachNudged: true })
                setNudge(
                  "That sentence could sit under any brief. Name this metric or this decision, and say which way the call moves. One nudge, then it will stand.",
                )
                return
              }
              setNudge("")
            }}
          >
            Check this sentence
          </Button>
        ) : null}
      </Field>

      {scenario.company_type === "real" && scenario.source ? (
        <section className="rounded-xl border border-indigo-100 bg-white px-3 py-3 text-sm">
          <p>Based on a reported event. The numbers in the brief are illustrative, not a claim of exact figures.</p>
          {scenario.based_on ? <p className="mt-2">{scenario.based_on}</p> : null}
          <p className="mt-2">
            The reported story is the link. The decision still turns on the check above.
          </p>
          {sourceHref ? (
            <a className="mt-2 inline-block font-semibold text-indigo-700 underline" href={sourceHref} target="_blank" rel="noreferrer">
              {scenario.source.title} · {scenario.source.outlet} · {scenario.source.date}
            </a>
          ) : (
            <p className="mt-2 font-semibold">
              {scenario.source.title} · {scenario.source.outlet} · {scenario.source.date}
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm shadow-card">
        <p>
          Lever {marks.topHit ? "hit" : "missed"} · Ambiguity {marks.ambiguityCorrect ? "named" : "missed"} (
          {AMBIGUITY_LABEL[scenario.ambiguity_type]}) · Checklist {Math.round(marks.coverage * 100)}%
        </p>
        <p className="mt-1 text-muted">Rep score {Math.round(marks.score * 100)} · {xpFor({ ...rep, status: "complete" }, scenario)} XP if you log it now</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
          <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500" style={{ width: `${Math.round(marks.score * 100)}%` }} />
        </div>
        {earlier ? <BeforeAfter earlier={earlier} current={rep} scenario={scenario} /> : null}
      </section>

      {done && marks.score >= 0.8 ? (
        <Celebration>Strong rep. Score {Math.round(marks.score * 100)}. That one is worth keeping.</Celebration>
      ) : null}

      {done ? (
        <p className="text-sm font-semibold text-emerald-800">Logged.</p>
      ) : (
        <Button
          type="button"
          className="w-full"
          disabled={!canFinish}
          onClick={() => {
            if (teachIsGeneric(rep.teachAnswer, scenario) && !rep.teachNudged) {
              onChange({ ...rep, teachNudged: true })
              setNudge(
                "That sentence could sit under any brief. Name this metric or this decision, and say which way the call moves. One nudge, then it will stand.",
              )
              return
            }
            onComplete({ ...rep, status: "complete", completedAt: new Date().toISOString() })
          }}
        >
          Log this rep
        </Button>
      )}
      {!done && !canFinish ? (
        <p className="text-sm text-muted">
          Logging waits on a compared mind-changer, a hypothesis outcome, and a teach sentence that names this brief.
        </p>
      ) : null}
    </div>
  )
}

function BeforeAfter({ earlier, current, scenario }: { earlier: Rep; current: Rep; scenario: Scenario }) {
  const before = marksFor(earlier, scenario)
  const after = marksFor(current, scenario)
  return (
    <p className="mt-2">
      Before: lever {before.topHit ? "hit" : "missed"}, checklist {Math.round(before.coverage * 100)}%. After: lever{" "}
      {after.topHit ? "hit" : "missed"}, checklist {Math.round(after.coverage * 100)}%.
    </p>
  )
}
