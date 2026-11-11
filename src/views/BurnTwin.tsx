import { Note } from '../components/Note'
import { Panel } from '../components/Panel'

/**
 * F1 Earth vs Orbit Burn Twin. Empty shell: the flames, readouts, inset chart and controls
 * arrive in M2. Two columns, so the chambers, the controls and the inset share their edges.
 */
export function BurnTwin() {
  return (
    <div className="grid h-full min-h-[34rem] grid-cols-2 grid-rows-[minmax(0,1fr)_12rem] gap-6 p-6">
      <Panel title="Earth, 1g" />
      <Panel title="Orbit, ISS glovebox" />
      <Note>Controls arrive in M2</Note>
      <Note>Eq. 6.1 inset arrives in M2</Note>
    </div>
  )
}
