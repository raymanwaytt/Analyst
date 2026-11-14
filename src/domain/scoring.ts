import type { HypothesisOutcome, Rep, Scenario, Tag } from "./types"
import { TAGS } from "./types"
import { corpusHasAny, deriveKeywords, normalize, tokens } from "./words"

/**
 * Checklist coverage is a convenience, not the score that says you thought well.
 * Suggested ticks are bag-of-words matches. They are pre-filled so self-grading
 * is faster, and you are expected to correct them.
 *
 * The numbers that drive difficulty are: did you hit the top check, did you name
 * the ambiguity, and how much of the checklist you stood behind after editing.
 */

export function investigationCorpus(rep: Pick<Rep, "hypothesis" | "killCheck" | "premortem" | "investigation">): string {
  return [rep.hypothesis, rep.killCheck, rep.premortem, ...rep.investigation].join(" \n ")
}

export function suggestTicks(scenario: Scenario, corpus: string): boolean[] {
  return scenario.angles.map((angle) => {
    const keywords = angle.keywords.length > 0 ? angle.keywords : deriveKeywords(angle.check)
    return corpusHasAny(corpus, keywords)
  })
}

export function coverageRatio(ticks: boolean[]): number {
  if (ticks.length === 0) return 0
  const hit = ticks.filter(Boolean).length
  return hit / ticks.length
}

export function topCheckIndex(scenario: Scenario): number {
  return scenario.angles.findIndex((angle) => angle.check === scenario.top_check.check)
}

export function topCheckHit(scenario: Scenario, ticks: boolean[]): boolean {
  const index = topCheckIndex(scenario)
  if (index < 0) return false
  return Boolean(ticks[index])
}

export function debrief(scenario: Scenario, ticks: boolean[]): { missed: boolean; line: string } {
  const index = topCheckIndex(scenario)
  const hit = index >= 0 && Boolean(ticks[index])
  if (!hit) {
    return {
      missed: true,
      line: `${scenario.top_check.check} ${scenario.top_check.why}`,
    }
  }
  const next = scenario.angles.findIndex((_, angleIndex) => !ticks[angleIndex])
  if (next === -1) {
    return {
      missed: false,
      line: "You covered the checklist, including the highest-leverage check.",
    }
  }
  return {
    missed: true,
    line: `You hit the main lever. The next gap is: ${scenario.angles[next].check}`,
  }
}

export function chasedHerrings(scenario: Scenario, corpus: string): Scenario["red_herrings"] {
  return scenario.red_herrings.filter((herring) => {
    const keywords = herring.keywords.length > 0 ? herring.keywords : deriveKeywords(herring.text)
    return corpusHasAny(corpus, keywords)
  })
}

const DOMAIN_ALIASES: Record<string, string[]> = {
  "online travel": ["travel", "ota", "airline", "booking", "hospitality", "support"],
  "consumer lending": ["credit", "lending", "loan", "fintech", "risk"],
  "retail banking": ["bank", "banking", "payments", "core banking"],
  telecom: ["telco", "mobile", "subscriber", "airtime"],
  airline: ["airline", "aviation", "carrier", "support"],
  ecommerce: ["ecommerce", "marketplace", "retail"],
  "music streaming": ["streaming", "music", "subscription", "media"],
  "online retail": ["retail", "ecommerce", "shop", "marketing"],
}

export function domainHit(guess: string, scenario: Scenario): boolean {
  const folded = normalize(guess)
  if (folded.length < 3) return false
  const aliases = DOMAIN_ALIASES[scenario.industry.toLowerCase()] ?? []
  const targets = [scenario.industry, scenario.function, ...aliases]
  return targets.some((target) => {
    const needle = normalize(target)
    if (needle.length < 3) return false
    if (folded.includes(needle)) return true
    return needle.includes(folded) && folded.length >= 4
  })
}

export function ambiguityCorrect(rep: Pick<Rep, "ambiguityGuess">, scenario: Scenario): boolean {
  return rep.ambiguityGuess !== "" && rep.ambiguityGuess === scenario.ambiguity_type
}

export interface RepMarks {
  topHit: boolean
  ambiguityCorrect: boolean
  coverage: number
  score: number
}

export function marksFor(rep: Pick<Rep, "ticks" | "ambiguityGuess">, scenario: Scenario): RepMarks {
  const topHit = topCheckHit(scenario, rep.ticks)
  const named = ambiguityCorrect(rep, scenario)
  const coverage = coverageRatio(rep.ticks)
  const score = ((topHit ? 1 : 0) + (named ? 1 : 0) + coverage) / 3
  return { topHit, ambiguityCorrect: named, coverage, score }
}

const STOP_TEACH = new Set([
  "would",
  "could",
  "should",
  "change",
  "decision",
  "because",
  "about",
  "their",
  "there",
  "which",
  "check",
  "this",
  "that",
  "with",
  "from",
  "have",
  "will",
])

export function teachIsGeneric(answer: string, scenario: Scenario): boolean {
  const words = tokens(answer)
  if (words.length < 8) return true
  const concrete = new Set(
    tokens(
      [scenario.metric, scenario.decision, scenario.company, scenario.blind_text, scenario.top_check.check].join(" "),
    ).filter((word) => word.length > 3 && !STOP_TEACH.has(word)),
  )
  return !words.some((word) => concrete.has(word))
}

export function xpFor(rep: Rep, scenario: Scenario): number {
  if (rep.status !== "complete") return 0
  const marks = marksFor(rep, scenario)
  let xp = 20
  if (marks.topHit) xp += 40
  if (marks.ambiguityCorrect) xp += 25
  xp += Math.round(marks.coverage * 15)
  if (rep.hypothesisOutcome) xp += 5
  if (rep.teachAnswer.trim() && !teachIsGeneric(rep.teachAnswer, scenario)) xp += 15
  if (rep.blind && domainHit(rep.domainGuess, scenario)) xp += 10
  return xp
}

export const LEVELS = [
  { name: "Briefed", min: 0 },
  { name: "Associate", min: 120 },
  { name: "Analyst", min: 320 },
  { name: "Senior", min: 700 },
  { name: "Principal", min: 1200 },
] as const

export function levelFor(xp: number): { name: string; next: string | null; into: number; span: number } {
  let current: (typeof LEVELS)[number] = LEVELS[0]
  for (const level of LEVELS) {
    if (xp >= level.min) current = level
  }
  const index = LEVELS.findIndex((level) => level.name === current.name)
  const next = LEVELS[index + 1]
  if (!next) return { name: current.name, next: null, into: 1, span: 1 }
  return {
    name: current.name,
    next: next.name,
    into: xp - current.min,
    span: next.min - current.min,
  }
}

export function totalXp(reps: Rep[], scenarios: Map<string, Scenario>): number {
  return reps.reduce((sum, rep) => {
    const scenario = scenarios.get(rep.scenarioId)
    return scenario ? sum + xpFor(rep, scenario) : sum
  }, 0)
}

export interface TagStat {
  tag: Tag
  hit: number
  total: number
  exposed: boolean
}

export function tagStats(reps: Rep[], scenarios: Map<string, Scenario>): TagStat[] {
  const hit = Object.fromEntries(TAGS.map((tag) => [tag, 0])) as Record<Tag, number>
  const total = Object.fromEntries(TAGS.map((tag) => [tag, 0])) as Record<Tag, number>
  for (const rep of reps) {
    if (rep.status !== "complete") continue
    const scenario = scenarios.get(rep.scenarioId)
    if (!scenario) continue
    scenario.angles.forEach((angle, index) => {
      total[angle.tag] += 1
      if (rep.ticks[index]) hit[angle.tag] += 1
    })
  }
  return TAGS.map((tag) => ({
    tag,
    hit: hit[tag],
    total: total[tag],
    exposed: total[tag] > 0,
  }))
}

export function calibrationBuckets(
  reps: Rep[],
): { confidence: number; n: number; survived: number }[] {
  return [1, 2, 3, 4, 5].map((confidence) => {
    const rows = reps.filter(
      (rep) =>
        rep.status === "complete" &&
        rep.confidence === confidence &&
        (rep.hypothesisOutcome === "supported" ||
          rep.hypothesisOutcome === "weakened" ||
          rep.hypothesisOutcome === "killed"),
    )
    const survived = rows.filter((rep) => rep.hypothesisOutcome === "supported").length
    return { confidence, n: rows.length, survived }
  })
}

export function calibrationSentence(buckets: { confidence: number; n: number; survived: number }[]): string {
  const usable = buckets.filter((bucket) => bucket.n >= 2)
  if (usable.length === 0) {
    return "After a few reps, this shows whether a 4 from you means the hypothesis actually held."
  }
  const high = [...usable].reverse().find((bucket) => bucket.confidence >= 4)
  if (!high) {
    return "Keep marking whether the top check supported, weakened, or killed the hypothesis. That is the calibration."
  }
  const rate = Math.round((high.survived / high.n) * 100)
  if (rate >= 70) return `When you say ${high.confidence}, the hypothesis held ${rate}% of the time. That is in the neighborhood.`
  if (rate <= 40) return `When you say ${high.confidence}, the hypothesis held ${rate}% of the time. You are running hot.`
  return `When you say ${high.confidence}, the hypothesis held ${rate}% of the time.`
}

export function outcomeLabel(outcome: HypothesisOutcome): string {
  if (outcome === "supported") return "Supported"
  if (outcome === "weakened") return "Weakened"
  if (outcome === "killed") return "Killed"
  return "Unmarked"
}
