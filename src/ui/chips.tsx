import type { Difficulty, Tag } from "../domain/types"
import { TAG_LABEL } from "../domain/labels"

/** Colour names follow the brief: timing, metric, segment, ops, risk, data, external, money. */
export const TAG_CHIP: Record<Tag, string> = {
  time: "bg-sky-100 text-sky-950 ring-sky-400",
  volume: "bg-amber-100 text-amber-950 ring-amber-400",
  mix: "bg-violet-100 text-violet-950 ring-violet-400",
  supply: "bg-teal-100 text-teal-950 ring-teal-400",
  cause: "bg-rose-100 text-rose-950 ring-rose-400",
  data: "bg-blue-100 text-blue-950 ring-blue-400",
  external: "bg-lime-100 text-lime-950 ring-lime-600",
  finance: "bg-orange-100 text-orange-950 ring-orange-400",
}

export const TAG_BAR: Record<Tag, string> = {
  time: "bg-sky-600",
  volume: "bg-amber-500",
  mix: "bg-violet-600",
  supply: "bg-teal-600",
  cause: "bg-rose-600",
  data: "bg-blue-600",
  external: "bg-lime-600",
  finance: "bg-orange-600",
}

const DIFFICULTY_CHIP: Record<Difficulty, string> = {
  easy: "bg-emerald-100 text-emerald-950 ring-emerald-400",
  medium: "bg-amber-100 text-amber-950 ring-amber-400",
  hard: "bg-fuchsia-100 text-fuchsia-950 ring-fuchsia-400",
}

export function TagChip({ tag }: { tag: Tag }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TAG_CHIP[tag]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TAG_BAR[tag]}`} aria-hidden="true" />
      {TAG_LABEL[tag]}
    </span>
  )
}

export function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${DIFFICULTY_CHIP[difficulty]}`}>
      {difficulty}
    </span>
  )
}
