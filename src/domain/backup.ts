import type { AppState, Rep } from "./types"

export interface BackupFile {
  kind: "prior-backup"
  exportedAt: string
  state: AppState
}

export function isBackup(data: unknown): data is BackupFile {
  if (!data || typeof data !== "object") return false
  const record = data as Partial<BackupFile>
  return record.kind === "prior-backup" && !!record.state && record.state.version === 1
}

function preferRep(local: Rep[], incoming: Rep[]): Rep[] {
  const byId = new Map<string, Rep>()
  for (const rep of incoming) byId.set(rep.id, rep)
  for (const rep of local) byId.set(rep.id, rep)
  return [...byId.values()]
}

/**
 * Merge keeps this device's assignments when both sides named a date, so a
 * backup cannot reshuffle a day you already started. Reps already on the
 * device win over the file when the id matches.
 */
export function mergeBackup(local: AppState, incoming: AppState): AppState {
  const assignments = { ...incoming.assignments, ...local.assignments }
  return {
    version: 1,
    startDate: incoming.startDate < local.startDate ? incoming.startDate : local.startDate,
    assignments,
    reps: preferRep(local.reps, incoming.reps),
    imported: [...local.imported, ...incoming.imported],
    settings: local.settings,
    retrievals: preferById(local.retrievals, incoming.retrievals),
    freeze: {
      month: local.freeze.month >= incoming.freeze.month ? local.freeze.month : incoming.freeze.month,
      remaining: Math.max(local.freeze.remaining, incoming.freeze.remaining),
      bridgedDates: [...new Set([...local.freeze.bridgedDates, ...incoming.freeze.bridgedDates])],
    },
  }
}

function preferById<T extends { id: string }>(local: T[], incoming: T[]): T[] {
  const byId = new Map<string, T>()
  for (const item of incoming) byId.set(item.id, item)
  for (const item of local) byId.set(item.id, item)
  return [...byId.values()]
}

export function replaceWithBackup(incoming: AppState): AppState {
  return {
    ...incoming,
    version: 1,
    reps: incoming.reps ?? [],
    assignments: incoming.assignments ?? {},
    imported: incoming.imported ?? [],
    retrievals: incoming.retrievals ?? [],
    settings: incoming.settings ?? { blind: "auto" },
    freeze: incoming.freeze ?? { month: incoming.startDate.slice(0, 7), remaining: 2, bridgedDates: [] },
  }
}
