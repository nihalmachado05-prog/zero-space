import { EmptyNote, Panel, Tag } from '../components/Panel'

/** F3 RANK: Orbital Risk Index, flammability map, ignition race. Empty shell: built in M4. */
export function Rank() {
  return (
    <Panel title="Rank" tag={<Tag>Not built yet</Tag>} className="min-h-64">
      <EmptyNote>The risk ranking arrives in milestone M4.</EmptyNote>
    </Panel>
  )
}
