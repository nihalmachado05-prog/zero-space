import { EmptyNote, Panel, Tag } from '../components/Panel'

/** F0 data hygiene audit bar. Empty shell: counters and segments arrive in M3. */
export function AuditBar() {
  return (
    <Panel title="Data audit" tag={<Tag>Not built yet</Tag>}>
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <EmptyNote>Audit counters arrive in milestone M3.</EmptyNote>
        {/* Empty track where one segment per test will go. */}
        <div aria-hidden="true" className="h-3 flex-1 border border-line" />
      </div>
    </Panel>
  )
}
