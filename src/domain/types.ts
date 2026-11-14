export const TAGS = [
  "time",
  "volume",
  "mix",
  "supply",
  "cause",
  "data",
  "external",
  "finance",
] as const

export type Tag = (typeof TAGS)[number]

export const AMBIGUITY_TYPES = [
  "missing_denominator",
  "conflicting_metrics",
  "simpsons_slice",
  "small_sample",
  "definition_change",
  "none",
] as const

export type AmbiguityType = (typeof AMBIGUITY_TYPES)[number]

export const DIFFICULTIES = ["easy", "medium", "hard"] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const THEMES = [
  "fintech-credit",
  "ops",
  "growth-marketing",
  "mixed",
] as const
export type Theme = (typeof THEMES)[number]

export interface Angle {
  check: string
  tag: Tag
  keywords: string[]
}

export interface RedHerring {
  text: string
  why_irrelevant: string
  keywords: string[]
}

export interface Framing {
  framing: string
  strength: "stronger" | "weaker"
  reason: string
}

export interface Source {
  title: string
  outlet: string
  date: string
  url: string
}

export interface Scenario {
  id: string
  company_type: "real" | "fictional"
  company: string
  industry: string
  function: string
  difficulty: Difficulty
  theme: Theme
  metric: string
  direction: string
  size: string
  timeframe: string
  context: string
  ambiguity_type: AmbiguityType
  blind_text: string
  decision: string
  angles: Angle[]
  red_herrings: RedHerring[]
  top_check: { check: string; why: string }
  what_would_change_your_mind: string
  framings: Framing[]
  teach_me_prompt: string
  based_on?: string
  source?: Source
}

export type HypothesisOutcome = "" | "supported" | "weakened" | "killed"

export interface Rep {
  id: string
  scenarioId: string
  lagosDate: string
  kind: "daily" | "redo"
  redoOfId?: string
  createdAt: string
  status: "draft" | "revealed" | "complete"
  hypothesis: string
  confidence: number
  premortem: string
  ambiguityGuess: AmbiguityType | ""
  killCheck: string
  domainGuess: string
  blind: boolean
  investigation: string[]
  ticks: boolean[]
  suggestions: boolean[]
  mindChanger: string
  mindChangerRevealed: boolean
  hypothesisOutcome: HypothesisOutcome
  teachAnswer: string
  teachNudged: boolean
  completedAt?: string
}

export interface Retrieval {
  id: string
  lagosDate: string
  aboutRepId: string
  answer: string
  skipped: boolean
}

export interface FreezeState {
  month: string
  remaining: number
  bridgedDates: string[]
}

export interface Settings {
  /** auto ≈ 1 in 5 fictional days. Real companies are never blinded. */
  blind: "auto" | "always" | "off"
}

export interface AppState {
  version: 1
  startDate: string
  assignments: Record<string, string>
  reps: Rep[]
  imported: unknown[]
  settings: Settings
  retrievals: Retrieval[]
  freeze: FreezeState
}

export interface Issue {
  severity: "error" | "warning"
  message: string
}
