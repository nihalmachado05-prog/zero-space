import { EmptyNote, Panel, Tag } from '../components/Panel'

/** F2 SUMMARIZE telemetry explorer. Empty shell: built in M3. */
export function Summarize() {
  return (
    <Panel title="Summarize" tag={<Tag>Not built yet</Tag>} className="min-h-64">
      <EmptyNote>The telemetry explorer arrives in milestone M3.</EmptyNote>
    </Panel>
  )
}
