import { useEffect, useMemo, useRef, useState } from "react"
import { loadBank } from "./content/bank"
import { blankRep, lockRep, upsertRep } from "./domain/reps"
import { latestUnlockDate, prepareState, streakCount } from "./domain/schedule"
import { levelFor, totalXp } from "./domain/scoring"
import { formatLagosStamp } from "./domain/time"
import type { AppState, Rep, Scenario } from "./domain/types"
import { loadState, requestPersistentStorage, saveState } from "./storage/db"
import { Library } from "./ui/Library"
import { Log } from "./ui/Log"
import { ReadForm } from "./ui/ReadForm"
import { Reveal } from "./ui/Reveal"
import { Stats } from "./ui/Stats"
import { Today } from "./ui/Today"
import { HeroMark, NavIcon } from "./ui/art"
import { Button, Card } from "./ui/primitives"

type Tab = "today" | "log" | "stats" | "library"

function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, 30_000)
    document.addEventListener("visibilitychange", tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [])
  return now
}

function useHash(): [string, (next: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash || "#/today")
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/today")
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return [hash, (next) => { window.location.hash = next }]
}

function useStore() {
  const [state, setState] = useState<AppState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<AppState | null>(null)
  const queue = useRef(Promise.resolve())

  useEffect(() => {
    let cancelled = false
    loadState()
      .then((loaded) => {
        if (cancelled) return
        const bank = loadBank(loaded.imported)
        const next = prepareState(loaded, bank.scenarios, new Date())
        ref.current = next
        setState(next)
        queue.current = queue.current.then(() => saveState(next))
        void requestPersistentStorage()
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not open the briefs saved on this device.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  const update = (fn: (current: AppState) => AppState) => {
    const current = ref.current
    if (!current) return
    const next = fn(current)
    ref.current = next
    setState(next)
    if (next !== current) queue.current = queue.current.then(() => saveState(ref.current ?? next))
  }

  return { state, error, update }
}

export function App() {
  const now = useNow()
  const { state, error, update } = useStore()
  const [hash, go] = useHash()
  const bank = useMemo(() => loadBank(state?.imported ?? []), [state?.imported])

  const updateRef = useRef(update)
  updateRef.current = update
  useEffect(() => {
    updateRef.current((current) => prepareState(current, bank.scenarios, new Date()))
  }, [bank.scenarios, now])

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-5 py-10">
        <HeroMark />
        <h1 className="mt-4 font-serif text-3xl">Prior</h1>
        <p className="mt-3 text-sm">{error}</p>
      </main>
    )
  }
  if (!state) {
    return (
      <main className="mx-auto flex max-w-xl flex-col items-start px-5 py-16">
        <HeroMark className="art-float h-16 w-16" />
        <p className="mt-4 font-serif text-3xl">Prior</p>
        <p className="mt-2 text-sm text-muted">Opening today’s brief.</p>
      </main>
    )
  }

  const unlock = latestUnlockDate(now, state.startDate)
  const byId = new Map(bank.scenarios.map((scenario) => [scenario.id, scenario]))
  const xp = totalXp(state.reps.filter((rep) => rep.status === "complete"), byId)
  const level = levelFor(xp)
  const streak = streakCount(state, unlock)
  const redoId = hash.startsWith("#/redo/") ? hash.slice("#/redo/".length) : ""
  const tab: Tab = hash.startsWith("#/log")
    ? "log"
    : hash.startsWith("#/stats")
      ? "stats"
      : hash.startsWith("#/library")
        ? "library"
        : "today"

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 pb-32 pt-5">
      <header className="hero print-flat motion-safe:animate-rise mb-5 overflow-hidden rounded-3xl shadow-lift">
        <div className="flex items-start justify-between gap-3 p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200">Daily judgment</p>
            <p className="font-serif text-4xl tracking-tight">Prior</p>
            <p className="text-sm text-indigo-100">One metric. One decision.</p>
          </div>
          <HeroMark className="art-float h-16 w-16" />
        </div>
        <div className="flex items-center justify-between gap-3 bg-black/25 px-5 py-3 text-sm text-white">
          <p>
            {level.name} · {streak} {streak === 1 ? "day" : "days"}
          </p>
          <p>{formatLagosStamp(now)}</p>
        </div>
      </header>
      {redoId ? (
        <Redo repId={redoId} state={state} scenarios={byId} update={update} onBack={() => go("#/log")} />
      ) : tab === "today" ? (
        <Today state={state} scenarios={bank.scenarios} now={now} update={update} onRedo={(id) => go(`#/redo/${id}`)} />
      ) : tab === "log" ? (
        <Log reps={state.reps} scenarios={byId} onRedo={(id) => go(`#/redo/${id}`)} />
      ) : tab === "stats" ? (
        <Stats state={state} scenarios={byId} unlock={unlock} />
      ) : (
        <Library state={state} scenarios={bank.scenarios} issues={bank.issues} update={update} />
      )}
      <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-indigo-100 bg-white/90 backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
          {(
            [
              ["today", "Today"],
              ["log", "Log"],
              ["stats", "Stats"],
              ["library", "Library"],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id && !redoId
            return (
              <button
                key={id}
                type="button"
                onClick={() => go(`#/${id}`)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition active:scale-95 motion-reduce:active:scale-100 ${active ? "text-indigo-800" : "text-muted"}`}
              >
                <span className={`flex h-8 w-12 items-center justify-center rounded-full ${active ? "bg-indigo-700 text-white shadow-card" : ""}`}>
                  <NavIcon name={id} />
                </span>
                {label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function Redo({
  repId,
  state,
  scenarios,
  update,
  onBack,
}: {
  repId: string
  state: AppState
  scenarios: Map<string, Scenario>
  update: (fn: (state: AppState) => AppState) => void
  onBack: () => void
}) {
  const source = state.reps.find((rep) => rep.id === repId)
  const scenario = source ? scenarios.get(source.scenarioId) : undefined
  const current = state.reps.find((rep) => rep.redoOfId === repId && rep.status !== "complete")
    ?? [...state.reps].reverse().find((rep) => rep.redoOfId === repId)
  const started = useRef(false)

  useEffect(() => {
    if (!source || !scenario || started.current) return
    started.current = true
    update((existing) => {
      if (existing.reps.some((rep) => rep.redoOfId === source.id && rep.status !== "complete")) return existing
      return upsertRep(existing, blankRep(scenario.id, source.lagosDate, false, "redo", source.id))
    })
  }, [scenario, source, update])

  if (!source || !scenario) {
    return (
      <Card>
        <p className="text-sm">That brief is not on this device.</p>
        <Button type="button" className="mt-3" onClick={onBack}>Back to the log</Button>
      </Card>
    )
  }

  const save = (rep: Rep) => update((existing) => upsertRep(existing, rep))

  return (
    <div className="space-y-4">
      <button type="button" className="text-sm text-muted" onClick={onBack}>
        Back
      </button>
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">Cold redo</p>
        <h1 className="mt-2 font-serif text-2xl">{scenario.blind_text}</h1>
        <p className="mt-3 text-sm">
          <span className="font-semibold">Decision. </span>
          {scenario.decision}
        </p>
        <p className="mt-2 text-sm text-muted">Your earlier list stays hidden until you lock this one.</p>
      </Card>
      {current && current.status === "draft" ? (
        <ReadForm rep={current} onChange={save} onLock={() => save(lockRep(current, scenario))} />
      ) : null}
      {current && current.status !== "draft" ? (
        <Reveal rep={current} scenario={scenario} earlier={source} onChange={save} onComplete={save} />
      ) : null}
    </div>
  )
}
