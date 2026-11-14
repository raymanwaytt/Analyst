import type { AmbiguityType, Tag, Theme } from "./types"

export const TAG_LABEL: Record<Tag, string> = {
  time: "Time",
  volume: "Volume",
  mix: "Mix / segment",
  supply: "Supply / capacity",
  cause: "Cause",
  data: "Data & definitions",
  external: "External",
  finance: "Finance",
}

export const AMBIGUITY_LABEL: Record<AmbiguityType, string> = {
  missing_denominator: "Missing denominator",
  conflicting_metrics: "Metrics disagree",
  simpsons_slice: "Segment vs total",
  small_sample: "Small sample",
  definition_change: "Definition changed",
  none: "Nothing obvious",
}

export const THEME_LABEL: Record<Theme, string> = {
  "fintech-credit": "Fintech & credit",
  ops: "Operations",
  "growth-marketing": "Growth & marketing",
  mixed: "Mixed",
}

export const AMBIGUITY_HINT: Record<AmbiguityType, string> = {
  missing_denominator: "A rate moved, and the base underneath it is not on the page.",
  conflicting_metrics: "Two numbers that should agree are pointing different ways.",
  simpsons_slice: "The total looks fine, or a slice looks fine, and the other one doesn't.",
  small_sample: "The result is loud and the number of observations is small.",
  definition_change: "The word in the metric may not mean what it meant last period.",
  none: "The picture may actually be complete enough to decide.",
}
