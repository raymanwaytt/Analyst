import { openDB } from "idb"
import type { AppState } from "../domain/types"
import { lagosDate } from "../domain/time"

const DB_NAME = "prior"
const STORE = "kv"

/**
 * One document, not a table per rep. Export is the same object the app saves,
 * which matters more here than query speed. A year of briefs is a small file.
 */

function emptyState(now: Date): AppState {
  const startDate = lagosDate(now)
  return {
    version: 1,
    startDate,
    assignments: {},
    reps: [],
    imported: [],
    settings: { blind: "auto" },
    retrievals: [],
    freeze: { month: startDate.slice(0, 7), remaining: 2, bridgedDates: [] },
  }
}

async function database() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    },
  })
}

export async function loadState(now = new Date()): Promise<AppState> {
  const db = await database()
  const saved = await db.get(STORE, "state")
  if (!saved || typeof saved !== "object" || (saved as AppState).version !== 1) return emptyState(now)
  const state = saved as AppState
  return {
    ...emptyState(now),
    ...state,
    freeze: state.freeze ?? emptyState(now).freeze,
    settings: state.settings ?? { blind: "auto" },
    retrievals: state.retrievals ?? [],
    imported: state.imported ?? [],
    reps: state.reps ?? [],
    assignments: state.assignments ?? {},
  }
}

export async function saveState(state: AppState): Promise<void> {
  const db = await database()
  await db.put(STORE, state, "state")
}

export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Safari may refuse. The export nag is the real backup.
  }
}
