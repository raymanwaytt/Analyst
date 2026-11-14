import { AMBIGUITY_TYPES } from "../domain/types"
import type { AmbiguityType, Rep } from "../domain/types"
import { AMBIGUITY_HINT, AMBIGUITY_LABEL } from "../domain/labels"
import { formGaps } from "../domain/reps"
import { Button, Field, TextArea } from "./primitives"

export function ReadForm({ rep, onChange, onLock }: { rep: Rep; onChange: (rep: Rep) => void; onLock: () => void }) {
  const gaps = formGaps(rep)
  const setLine = (index: number, value: string) => {
    const investigation = rep.investigation.map((line, lineIndex) => (lineIndex === index ? value : line))
    onChange({ ...rep, investigation })
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        if (gaps.length === 0) onLock()
      }}
    >
      {rep.blind ? (
        <Field label="What domain is this?" hint="Company, industry, and function are hidden. Guess from the wording.">
          <TextArea
            rows={2}
            value={rep.domainGuess}
            onChange={(event) => onChange({ ...rep, domainGuess: event.target.value })}
            placeholder="Travel support, consumer credit, telecom…"
          />
        </Field>
      ) : null}

      <Field
        label="Hypothesis"
        hint="One sentence: what moved, why, and what you would do. This locks when you reveal."
      >
        <TextArea
          rows={4}
          value={rep.hypothesis}
          onChange={(event) => onChange({ ...rep, hypothesis: event.target.value })}
          placeholder="Wait time rose because weekend volume outgrew the crew, so I would add Saturday shifts."
        />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium">Confidence in that hypothesis</legend>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = rep.confidence === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ ...rep, confidence: value })}
                className={`min-h-11 rounded-md border text-sm font-medium ${selected ? "border-rust bg-rust text-paper" : "border-line bg-card"}`}
              >
                {value}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-muted">1 is a hunch. 5 means you would already tell a stakeholder.</p>
      </fieldset>

      <Field label="Pre-mortem" hint="It is 90 days later and this decision was wrong. What happened?">
        <TextArea
          rows={2}
          value={rep.premortem}
          onChange={(event) => onChange({ ...rep, premortem: event.target.value })}
          placeholder="The queue was weekday disruption chats. Weekend shifts never touched it."
        />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium">What is suspicious about the picture?</legend>
        <div className="mt-2 space-y-2">
          {AMBIGUITY_TYPES.map((type) => {
            const selected = rep.ambiguityGuess === type
            return (
              <label
                key={type}
                className={`flex min-h-11 cursor-pointer gap-3 rounded-md border px-3 py-2 ${selected ? "border-rust bg-[#f8efe8]" : "border-line bg-card"}`}
              >
                <input
                  type="radio"
                  name="ambiguity"
                  className="mt-1"
                  checked={selected}
                  onChange={() => onChange({ ...rep, ambiguityGuess: type as AmbiguityType })}
                />
                <span>
                  <span className="block text-sm font-medium">{AMBIGUITY_LABEL[type]}</span>
                  <span className="block text-xs text-muted">{AMBIGUITY_HINT[type]}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <Field label="The check that would kill this" hint="One investigation that, if it went the other way, would drop the hypothesis.">
        <TextArea
          rows={2}
          value={rep.killCheck}
          onChange={(event) => onChange({ ...rep, killCheck: event.target.value })}
          placeholder="Weekday versus weekend volume, split by contact reason."
        />
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">What I would investigate</legend>
        <p className="text-sm text-muted">Your list, in your words. The expert checklist stays hidden until you lock.</p>
        {rep.investigation.map((line, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={line}
              onChange={(event) => setLine(index, event.target.value)}
              aria-label={`Investigation ${index + 1}`}
              className="min-h-11 w-full rounded-md border border-line bg-card px-3 text-base"
              placeholder={index === 0 ? "Chat volume, not just wait time" : "Another check"}
            />
            {rep.investigation.length > 2 ? (
              <button
                type="button"
                className="min-h-11 shrink-0 px-2 text-sm text-muted"
                onClick={() =>
                  onChange({ ...rep, investigation: rep.investigation.filter((_, lineIndex) => lineIndex !== index) })
                }
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          className="text-sm font-medium text-rust"
          onClick={() => onChange({ ...rep, investigation: [...rep.investigation, ""] })}
        >
          Add a check
        </button>
      </fieldset>

      {gaps.length > 0 ? (
        <p className="text-sm text-muted">Still needed: {gaps.join(", ")}.</p>
      ) : (
        <p className="text-sm text-pine">Ready to lock. You will not be able to edit this list after the reveal.</p>
      )}

      <Button type="submit" disabled={gaps.length > 0} className="w-full">
        Lock and reveal
      </Button>
    </form>
  )
}
