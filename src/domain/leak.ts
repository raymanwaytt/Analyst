import type { Scenario } from "./types"

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0)
}

/** Runs of words from the locked answer key. Short filler runs are skipped. */
export function answerRuns(scenario: Scenario, size = 3): string[] {
  const sources = [
    ...scenario.angles.map((angle) => angle.check),
    scenario.top_check.check,
    scenario.top_check.why,
    scenario.what_would_change_your_mind,
    scenario.teach_me_prompt,
    ...scenario.red_herrings.flatMap((herring) => [herring.text, herring.why_irrelevant]),
    ...scenario.framings.flatMap((framing) => [framing.framing, framing.reason]),
  ]
  const runs = new Set<string>()
  for (const source of sources) {
    const tokens = words(source)
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const run = tokens.slice(index, index + size)
      const substantial = run.filter((word) => word.length >= 4).length
      if (substantial >= 2) runs.add(run.join(" "))
    }
  }
  return [...runs]
}

/** The first answer-key phrase found in text shown before the checklist unlocks. */
export function leakedRun(surface: string, scenario: Scenario): string | null {
  const hay = ` ${words(surface).join(" ")} `
  for (const run of answerRuns(scenario)) {
    if (hay.includes(` ${run} `)) return run
  }
  return null
}
