const STOP = new Set([
  "about",
  "after",
  "again",
  "against",
  "because",
  "before",
  "being",
  "between",
  "could",
  "does",
  "doing",
  "from",
  "have",
  "into",
  "more",
  "only",
  "other",
  "over",
  "same",
  "should",
  "than",
  "that",
  "their",
  "there",
  "these",
  "this",
  "those",
  "through",
  "under",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your",
])

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function tokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((word) => word.length > 0)
}

export function containsTerm(haystack: string, term: string): boolean {
  const needle = normalize(term)
  if (needle.length < 3) return false
  return ` ${normalize(haystack)} `.includes(` ${needle} `)
}

export function deriveKeywords(check: string): string[] {
  const seen = new Set<string>()
  for (const word of tokens(check)) {
    if (word.length < 5 || STOP.has(word)) continue
    seen.add(word)
    if (seen.size >= 8) break
  }
  return [...seen]
}

export function corpusHasAny(corpus: string, keywords: string[]): boolean {
  return keywords.some((keyword) => containsTerm(corpus, keyword))
}
