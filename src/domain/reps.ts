import type { AppState, Rep, Scenario } from "./types"
import { investigationCorpus, suggestTicks } from "./scoring"

export function blankRep(scenarioId: string, lagosDate: string, blind: boolean, kind: Rep["kind"], redoOfId?: string): Rep {
  return {
    id: crypto.randomUUID(),
    scenarioId,
    lagosDate,
    kind,
    redoOfId,
    createdAt: new Date().toISOString(),
    status: "draft",
    hypothesis: "",
    confidence: 0,
    premortem: "",
    ambiguityGuess: "",
    killCheck: "",
    domainGuess: "",
    blind,
    investigation: ["", ""],
    ticks: [],
    suggestions: [],
    mindChanger: "",
    mindChangerRevealed: false,
    hypothesisOutcome: "",
    teachAnswer: "",
    teachNudged: false,
  }
}

export function upsertRep(state: AppState, rep: Rep): AppState {
  const exists = state.reps.some((item) => item.id === rep.id)
  return {
    ...state,
    reps: exists ? state.reps.map((item) => (item.id === rep.id ? rep : item)) : [...state.reps, rep],
  }
}

export function formGaps(rep: Rep): string[] {
  const gaps: string[] = []
  if (rep.hypothesis.trim().length < 20) gaps.push("a one-sentence hypothesis")
  if (rep.confidence < 1) gaps.push("a confidence mark")
  if (rep.premortem.trim().length < 15) gaps.push("a pre-mortem")
  if (!rep.ambiguityGuess) gaps.push("the ambiguity type")
  if (rep.killCheck.trim().length < 15) gaps.push("the check that would kill the hypothesis")
  const lines = rep.investigation.map((line) => line.trim()).filter((line) => line.length >= 8)
  if (lines.length < 2) gaps.push("at least two things you would investigate")
  if (rep.blind && rep.domainGuess.trim().length < 3) gaps.push("a domain guess")
  return gaps
}

export function lockRep(rep: Rep, scenario: Scenario): Rep {
  const suggestions = suggestTicks(scenario, investigationCorpus(rep))
  return {
    ...rep,
    status: "revealed",
    investigation: rep.investigation.map((line) => line.trim()).filter((line) => line.length > 0),
    suggestions,
    ticks: [...suggestions],
  }
}
