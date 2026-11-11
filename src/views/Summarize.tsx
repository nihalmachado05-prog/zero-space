import { Note } from '../components/Note'

/**
 * #/summarize : F2 telemetry explorer. Empty shell: built in M3.
 * Receives `params` (ViewProps) but reads none yet; M3 will read e.g. ?test=P22b.
 */
export function Summarize() {
  return (
    <div className="p-6">
      <h1 className="sr-only">Summarize</h1>
      <Note>The telemetry explorer arrives in M3</Note>
    </div>
  )
}
