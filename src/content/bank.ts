import seed from "../../scenarios/seed.json"
import { mergeScenarioLists, validateScenarioFile } from "../domain/scenario"
import type { Issue, Scenario } from "../domain/types"

export function loadBank(imported: unknown[]): { scenarios: Scenario[]; issues: Issue[] } {
  const seeded = validateScenarioFile(seed)
  const extra =
    imported.length > 0 ? validateScenarioFile(imported) : { scenarios: [], issues: [] as Issue[] }
  return {
    scenarios: mergeScenarioLists(seeded.scenarios, extra.scenarios),
    issues: [...seeded.issues, ...extra.issues],
  }
}

export function mergeRaw(existing: unknown[], incoming: unknown[]): unknown[] {
  const map = new Map<string, unknown>()
  const put = (item: unknown) => {
    if (!item || typeof item !== "object" || !("id" in item)) return
    map.set(String((item as { id: unknown }).id), item)
  }
  existing.forEach(put)
  incoming.forEach(put)
  return [...map.values()]
}

export function acceptedRawItems(data: unknown, acceptedIds: Set<string>): unknown[] {
  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object" && "scenarios" in data && Array.isArray((data as { scenarios: unknown[] }).scenarios)
      ? (data as { scenarios: unknown[] }).scenarios
      : []
  return items.filter((item) => {
    if (!item || typeof item !== "object" || !("id" in item)) return false
    return acceptedIds.has(String((item as { id: unknown }).id))
  })
}
