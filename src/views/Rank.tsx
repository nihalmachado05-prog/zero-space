import { Note } from '../components/Note'

/**
 * #/rank : F3 Orbital Risk Index, flammability map, ignition race. Empty shell: built in M4.
 * Receives `params` (ViewProps) but reads none yet.
 */
export function Rank() {
  return (
    <div className="p-6">
      <h1 className="sr-only">Rank</h1>
      <Note>The risk ranking arrives in M4</Note>
    </div>
  )
}
