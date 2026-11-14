import { useState } from "react"
import { TAGS } from "../domain/types"
import type { HypothesisOutcome, Rep, Scenario } from "../domain/types"
import { AMBIGUITY_LABEL, TAG_LABEL } from "../domain/labels"
import {
  chasedHerrings,
  debrief,
  domainHit,
  investigationCorpus,
  marksFor,
  teachIsGeneric,
  xpFor,
} from "../domain/scoring"
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
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{TAG_LABEL[group.tag]}</h3>
            <ul className="mt-2 space-y-2">
              {group.rows.map(({ angle, index }) => {
                const suggested = rep.suggestions[index]
                return (
                  <li key={angle.check} className="rounded-md border border-line bg-card px-3 py-2">
                    <label className="flex gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 accent-rust"
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
                          <span className="mt-1 block text-xs text-warn">Suggested from your wording</span>
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

      <section className="rounded-lg border border-ink bg-ink px-4 py-4 text-paper">
        <h2 className="font-serif text-xl">The check that moves the decision</h2>
        <p className="mt-2 text-sm leading-6">{note.line}</p>
      </section>

      {herrings.length > 0 ? (
        <section className="rounded-lg border border-[#e4c9a2] bg-[#fbf3e6] px-4 py-3">
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
            <article key={framing.framing} className="rounded-md border border-line bg-card px-3 py-3">
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
              className={`min-h-11 rounded-md border text-sm capitalize ${rep.hypothesisOutcome === outcome ? "border-rust bg-rust text-paper" : "border-line bg-card"}`}
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
        <section className="rounded-md border border-line bg-card px-3 py-3 text-sm">
          <p>Based on a reported event. The numbers in the brief are illustrative, not a claim of exact figures.</p>
          {scenario.based_on ? <p className="mt-2">{scenario.based_on}</p> : null}
          <p className="mt-2">
            The reported story is the link. The decision still turns on the check above.
          </p>
          <a className="mt-2 inline-block font-medium text-rust underline" href={scenario.source.url} target="_blank" rel="noreferrer">
            {scenario.source.title} · {scenario.source.outlet} · {scenario.source.date}
          </a>
        </section>
      ) : null}

      <section className="rounded-lg border border-line bg-paper px-4 py-3 text-sm">
        <p>
          Lever {marks.topHit ? "hit" : "missed"} · Ambiguity {marks.ambiguityCorrect ? "named" : "missed"} (
          {AMBIGUITY_LABEL[scenario.ambiguity_type]}) · Checklist {Math.round(marks.coverage * 100)}%
        </p>
        <p className="mt-1 text-muted">Rep score {Math.round(marks.score * 100)} · {xpFor({ ...rep, status: "complete" }, scenario)} XP if you log it now</p>
        {earlier ? <BeforeAfter earlier={earlier} current={rep} scenario={scenario} /> : null}
      </section>

      {done ? (
        <p className="text-sm font-medium text-pine">Logged.</p>
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
