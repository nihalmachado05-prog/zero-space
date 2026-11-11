import { Note } from '../components/Note'

/**
 * #/interpret : F4 cabin fire, toxicity and suppression simulator. Empty shell: built in M5.
 * Receives `params` (ViewProps) but reads none yet; M5 will read e.g. ?preset=m5.
 */
export function Interpret() {
  return (
    <div className="p-6">
      <h1 className="sr-only">Interpret</h1>
      <Note>The cabin fire simulator arrives in M5</Note>
    </div>
  )
}
