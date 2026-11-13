// The AI pipeline's outputs (M7): the dataset briefing (F2) and the test-outcome reader (F2b).
// Until the pipeline writes them, they don't exist, and every place that shows them renders
// nothing. vite.config.ts records which files exist when the app is built (or the dev server
// starts), so the app never asks for a missing file and never logs a 404.
import { useSyncExternalStore } from 'react'

declare const __GENERATED_DATA__: { briefing: boolean; testOutcomes: boolean }

/** public/data/briefing.json (SPEC §6 BriefingFile). */
export interface BriefingFile {
  generatedBy: string
  generatedAt: string
  model: string
  promptVersion: string
  /** 4 to 6 sentences; the pipeline fails if a number in them isn't in the stats JSON. */
  sentences: string[]
}

export type Outcome = 'sustained' | 'brief' | 'no-ignition' | 'not-stated'

export const OUTCOME_LABELS: Record<Outcome, string> = {
  sustained: 'Sustained flame',
  brief: 'Brief ignition only',
  'no-ignition': 'No ignition',
  'not-stated': 'Not stated',
}

export interface TestOutcome {
  testId: string
  outcome: Outcome
  /** At most 15 words from the test's observation text, checked on its page; null if not stated. */
  quote: string | null
}

/** public/data/test-outcomes.json (SPEC §6 TestOutcomesFile). */
export interface TestOutcomesFile {
  generatedBy: string
  generatedAt: string
  model: string
  promptVersion: string
  outcomes: TestOutcome[]
}

function isBriefing(value: unknown): value is BriefingFile {
  const v = value as BriefingFile
  return typeof v?.model === 'string' && Array.isArray(v.sentences) && v.sentences.every((s) => typeof s === 'string')
}

function isTestOutcomes(value: unknown): value is TestOutcomesFile {
  const v = value as TestOutcomesFile
  return (
    typeof v?.model === 'string' &&
    Array.isArray(v.outcomes) &&
    v.outcomes.every((o) => typeof o?.testId === 'string' && o.outcome in OUTCOME_LABELS)
  )
}

/** One optional JSON file: fetched once, and only if it exists; null until it arrives or if it's malformed. */
function optionalJson<T>(exists: boolean, path: string, valid: (value: unknown) => value is T) {
  let data: T | null = null
  let started = false
  const listeners = new Set<() => void>()
  function subscribe(listener: () => void) {
    listeners.add(listener)
    if (exists && !started) {
      started = true
      fetch(`${import.meta.env.BASE_URL}${path}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((json: unknown) => {
          data = valid(json) ? json : null
          for (const l of listeners) l()
        })
        .catch(() => {})
    }
    return () => {
      listeners.delete(listener)
    }
  }
  return () => useSyncExternalStore(subscribe, () => data)
}

/** The AI dataset briefing, or null when it hasn't been generated. */
export const useBriefing = optionalJson(__GENERATED_DATA__.briefing, 'data/briefing.json', isBriefing)

/** The AI-read test outcomes, or null when they haven't been generated. */
export const useTestOutcomes = optionalJson(__GENERATED_DATA__.testOutcomes, 'data/test-outcomes.json', isTestOutcomes)
