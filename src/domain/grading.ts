import type { Rep, Scenario } from "./types"

/**
 * Model grading is a seam, not a feature. Nothing in the app calls a network
 * model. A later setting can plug in a grader that uses a key stored only on
 * this device. Until then the seam throws, and the daily loop does not need it.
 */

export interface GradeInput {
  scenario: Scenario
  rep: Rep
}

export interface GradeNotes {
  coverageNotes: string
  generic: boolean
}

export interface Grader {
  grade(input: GradeInput): Promise<GradeNotes>
}

export function disabledGrader(): Grader {
  return {
    async grade() {
      throw new Error("Model grading is off.")
    },
  }
}
