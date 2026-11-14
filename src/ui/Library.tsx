import { useState } from "react"
import type { AppState, Issue, Scenario } from "../domain/types"
import { isBackup, mergeBackup, replaceWithBackup } from "../domain/backup"
import { validateScenarioFile } from "../domain/scenario"
import { acceptedRawItems, loadBank, mergeRaw } from "../content/bank"
import { prepareState } from "../domain/schedule"
import { levelFor, totalXp } from "../domain/scoring"
import { Button, Card } from "./primitives"

export function Library({
  state,
  scenarios,
  issues,
  update,
}: {
  state: AppState
  scenarios: Scenario[]
  issues: Issue[]
  update: (fn: (state: AppState) => AppState) => void
}) {
  const [note, setNote] = useState("")
  const [pendingBackup, setPendingBackup] = useState<AppState | null>(null)
  const xp = totalXp(
    state.reps.filter((rep) => rep.status === "complete"),
    new Map(scenarios.map((scenario) => [scenario.id, scenario])),
  )
  const level = levelFor(xp)
  const levelRank = ["Briefed", "Associate", "Analyst", "Senior", "Principal"]
  const rank = levelRank.indexOf(level.name)

  const onFile = async (file: File) => {
    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      setNote("That file is not JSON.")
      setPendingBackup(null)
      return
    }
    if (isBackup(data)) {
      setPendingBackup(data.state)
      setNote("Backup found. Merge keeps this device’s briefs when the same id exists. Replace overwrites this device.")
      return
    }
    const result = validateScenarioFile(data)
    const raw = acceptedRawItems(data, new Set(result.scenarios.map((scenario) => scenario.id)))
    const errors = result.issues.filter((issue) => issue.severity === "error").length
    const warnings = result.issues.filter((issue) => issue.severity === "warning").length
    update((current) => {
      const imported = mergeRaw(current.imported, raw)
      const nextBank = loadBank(imported)
      return prepareState({ ...current, imported }, nextBank.scenarios, new Date())
    })
    setPendingBackup(null)
    setNote(`Accepted ${result.scenarios.length}. ${errors} rejected. ${warnings} warnings. Details are listed below after the file is in the bank.`)
    if (result.scenarios.length === 0 && result.issues[0]) setNote(result.issues.map((issue) => issue.message).join(" "))
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-serif text-2xl">Library</h1>
        <p className="mt-1 text-sm text-muted">{scenarios.length} scenarios in the draw. History stays on this device.</p>
      </header>

      <Card>
        <h2 className="text-sm font-semibold">Import scenarios</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          A JSON array, or an object with a scenarios array. New ids are appended. The same id replaces the seeded copy. Broken rows are skipped and named below.
        </p>
        <input
          className="mt-3 block w-full text-sm"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onFile(file)
            event.target.value = ""
          }}
        />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">History backup</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Move the log between laptop and phone. This is the backup that matters: a browser can drop local storage, especially on an iPhone.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => download("prior-backup.json", { kind: "prior-backup", exportedAt: new Date().toISOString(), state })}
          >
            Export history
          </Button>
          <Button
            type="button"
            kind="ghost"
            onClick={() =>
              download(
                "prior-scenarios-template.json",
                [{ id: "your-id", company_type: "fictional", company: "", industry: "", function: "", difficulty: "easy", theme: "ops", metric: "", direction: "up", size: "", timeframe: "", context: "", ambiguity_type: "none", blind_text: "", decision: "", angles: [], red_herrings: [], top_check: { check: "", why: "" }, what_would_change_your_mind: "" }],
              )
            }
          >
            Scenario template
          </Button>
        </div>
        <label className="mt-4 block text-sm font-medium">
          Import a backup
          <input
            className="mt-2 block w-full text-sm font-normal"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void onFile(file)
              event.target.value = ""
            }}
          />
        </label>
        {pendingBackup ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                update((current) => prepareState(mergeBackup(current, pendingBackup), scenarios, new Date()))
                setPendingBackup(null)
                setNote("Backup merged.")
              }}
            >
              Merge
            </Button>
            <Button
              type="button"
              kind="ghost"
              onClick={() => {
                if (!window.confirm("Replace every brief on this device with the file?")) return
                update(() => prepareState(replaceWithBackup(pendingBackup), scenarios, new Date()))
                setPendingBackup(null)
                setNote("This device now matches the file.")
              }}
            >
              Replace this device
            </Button>
          </div>
        ) : null}
        {note ? <p className="mt-3 text-sm">{note}</p> : null}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Blind rounds</h2>
        <p className="mt-1 text-sm text-muted">Real companies stay named. The brand is the spoiler. About one fictional day in five is blind on Auto.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["auto", "always", "off"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={state.settings.blind === mode}
              onClick={() => update((current) => ({ ...current, settings: { ...current.settings, blind: mode } }))}
              className={`min-h-11 rounded-xl border text-sm font-semibold capitalize transition active:scale-[0.98] motion-reduce:active:scale-100 ${state.settings.blind === mode ? "border-indigo-700 bg-indigo-700 text-white" : "border-indigo-100 bg-white"}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Packs</h2>
        <p className="mt-1 text-sm text-muted">Extra passes on briefs you have already logged. They do not open tomorrow early.</p>
        <Pack name="Fintech credit" open={rank >= 1} detail={packCount(scenarios, state, (scenario) => scenario.theme === "fintech-credit")} />
        <Pack name="Hard ambiguity" open={rank >= 2} detail={packCount(scenarios, state, (scenario) => scenario.difficulty === "hard")} />
        <Pack name="Blind-only" open={rank >= 1} detail={packCount(scenarios, state, (scenario) => scenario.company_type === "fictional")} />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Validation</h2>
        {issues.length === 0 ? (
          <p className="mt-2 text-sm">No warnings in the current bank.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {issues.map((issue) => (
              <li key={issue.message}>
                <span className="font-medium">{issue.severity}. </span>
                {issue.message}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Reminders and storage</h2>
        <p className="mt-2 text-sm leading-6">
          There is no server, so this phone cannot be woken at 08:00. Install Prior to the home screen, and set a repeating calendar alarm for 08:00 Africa/Lagos if you want the nudge. Web push would need a server this app does not have.
        </p>
        <p className="mt-2 text-sm leading-6">
          Model grading is off. Nothing you write is sent anywhere. A later setting can use your own key on this device only.
        </p>
      </Card>
    </div>
  )
}

function Pack({ name, open, detail }: { name: string; open: boolean; detail: string }) {
  return (
    <p className="mt-3 text-sm">
      <span className="font-medium">{name}. </span>
      {open ? detail : "Locked until you have logged enough briefs to reach the next level."}
    </p>
  )
}

function packCount(scenarios: Scenario[], state: AppState, pred: (scenario: Scenario) => boolean): string {
  const done = new Set(state.reps.filter((rep) => rep.status === "complete").map((rep) => rep.scenarioId))
  const count = scenarios.filter((scenario) => pred(scenario) && done.has(scenario.id)).length
  return count ? `${count} already logged. Redo them from the log.` : "None logged in this pack yet."
}

function download(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
