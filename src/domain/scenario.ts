import { z } from "zod"
import { AMBIGUITY_TYPES, DIFFICULTIES, TAGS, THEMES } from "./types"
import type { Issue, Scenario } from "./types"
import { deriveKeywords } from "./words"

/**
 * Scenarios arrive as JSON the user edits by hand. Missing keywords are filled
 * from the check text and reported as a warning. A real company with no source,
 * or a broken field, is rejected so a bad row cannot silently enter the daily draw.
 */

const angleSchema = z.object({
  check: z.string().min(8),
  tag: z.enum(TAGS),
  keywords: z.array(z.string().min(1)).optional(),
})

const herringSchema = z.object({
  text: z.string().min(8),
  why_irrelevant: z.string().min(8),
  keywords: z.array(z.string().min(1)).optional(),
})

const scenarioSchema = z.object({
  id: z.string().min(2).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens."),
  company_type: z.enum(["real", "fictional"]),
  company: z.string().min(1),
  industry: z.string().min(1),
  function: z.string().min(1),
  difficulty: z.enum(DIFFICULTIES),
  theme: z.enum(THEMES),
  metric: z.string().min(1),
  direction: z.string().min(1),
  size: z.string().min(1),
  timeframe: z.string().min(1),
  context: z.string().min(8),
  ambiguity_type: z.enum(AMBIGUITY_TYPES),
  blind_text: z.string().min(8),
  decision: z.string().min(4),
  angles: z.array(angleSchema).min(3),
  red_herrings: z.array(herringSchema).default([]),
  top_check: z.object({
    check: z.string().min(8),
    why: z.string().min(8),
  }),
  what_would_change_your_mind: z.string().min(8),
  framings: z
    .array(
      z.object({
        framing: z.string().min(8),
        strength: z.enum(["stronger", "weaker"]),
        reason: z.string().min(8),
      }),
    )
    .optional(),
  teach_me_prompt: z.string().min(8).optional(),
  based_on: z.string().min(1).optional(),
  source: z
    .object({
      title: z.string().min(1),
      outlet: z.string().min(1),
      date: z.string().min(4),
      url: z.string().refine((value) => httpUrl(value) !== null, "Use an http or https link."),
    })
    .optional(),
})

const KNOWN_KEYS = new Set(Object.keys(scenarioSchema.shape))

/** Only ordinary web links. `javascript:` and `data:` parse as URLs and must not become hrefs. */
export function httpUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.toString()
  } catch {
    return null
  }
}

export interface ValidationResult {
  scenarios: Scenario[]
  issues: Issue[]
}

function labelFor(raw: unknown, index: number): string {
  if (raw && typeof raw === "object" && "id" in raw && typeof raw.id === "string" && raw.id) {
    return raw.id
  }
  return `item ${index + 1}`
}

function parseOne(raw: unknown, index: number, issues: Issue[]): Scenario | null {
  const name = labelFor(raw, index)
  if (raw && typeof raw === "object") {
    for (const key of Object.keys(raw)) {
      if (!KNOWN_KEYS.has(key)) {
        issues.push({
          severity: "warning",
          message: `${name}: unknown field "${key}" was ignored.`,
        })
      }
    }
  }

  const parsed = scenarioSchema.safeParse(raw)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.length ? issue.path.join(".") : "scenario"
      issues.push({
        severity: "error",
        message: `${name}: ${path} — ${issue.message}`,
      })
    }
    return null
  }

  const value = parsed.data
  if (value.company_type === "real" && !value.source) {
    issues.push({
      severity: "error",
      message: `${name}: real scenarios need a source with title, outlet, date, and url. This one was left out of the draw.`,
    })
    return null
  }

  if (value.difficulty === "hard") {
    const framings = value.framings ?? []
    const strengths = new Set(framings.map((item) => item.strength))
    if (!strengths.has("stronger") || !strengths.has("weaker")) {
      issues.push({
        severity: "warning",
        message: `${name}: a hard scenario should include at least one stronger and one weaker framing.`,
      })
    }
  }

  const angles = value.angles.map((angle) => {
    if (angle.keywords && angle.keywords.length > 0) {
      return { ...angle, keywords: angle.keywords }
    }
    issues.push({
      severity: "warning",
      message: `${name}: angle is missing keywords. Generated them from the check text. Add your own synonyms when you can.`,
    })
    return { ...angle, keywords: deriveKeywords(angle.check) }
  })

  const herrings = value.red_herrings.map((herring) => {
    if (herring.keywords && herring.keywords.length > 0) {
      return { ...herring, keywords: herring.keywords }
    }
    return { ...herring, keywords: deriveKeywords(herring.text) }
  })

  if (!angles.some((angle) => angle.check === value.top_check.check)) {
    issues.push({
      severity: "warning",
      message: `${name}: top_check is not one of the angles, so the checklist cannot record a hit on it. Paste the same sentence into an angle.`,
    })
  }

  const teach =
    value.teach_me_prompt ??
    `In one sentence, how would the answer to this check change the decision: ${value.top_check.check}`

  return {
    ...value,
    angles,
    red_herrings: herrings,
    framings: value.framings ?? [],
    teach_me_prompt: teach,
  }
}

export function validateScenarioFile(data: unknown): ValidationResult {
  const issues: Issue[] = []
  let items: unknown[] = []
  if (Array.isArray(data)) {
    items = data
  } else if (
    data &&
    typeof data === "object" &&
    "scenarios" in data &&
    Array.isArray((data as { scenarios: unknown[] }).scenarios)
  ) {
    items = (data as { scenarios: unknown[] }).scenarios
  } else {
    return {
      scenarios: [],
      issues: [
        {
          severity: "error",
          message: "Expected a JSON array of scenarios, or an object with a scenarios array.",
        },
      ],
    }
  }

  const scenarios: Scenario[] = []
  const seen = new Set<string>()
  items.forEach((item, index) => {
    const scenario = parseOne(item, index, issues)
    if (!scenario) return
    if (seen.has(scenario.id)) {
      issues.push({
        severity: "error",
        message: `${scenario.id}: duplicate id. Kept the first one.`,
      })
      return
    }
    seen.add(scenario.id)
    scenarios.push(scenario)
  })
  return { scenarios, issues }
}

export function mergeScenarioLists(seed: Scenario[], imported: Scenario[]): Scenario[] {
  const byId = new Map<string, Scenario>()
  for (const scenario of seed) byId.set(scenario.id, scenario)
  for (const scenario of imported) byId.set(scenario.id, scenario)
  return [...byId.values()]
}
