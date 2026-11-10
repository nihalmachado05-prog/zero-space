import { EmptyNote, Panel, Tag } from '../components/Panel'

/** F1 Earth vs Orbit Burn Twin. Empty shell: chambers, inset and controls arrive in M2. */
export function BurnTwin() {
  return (
    <section aria-label="Earth vs orbit burn twin" className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,18rem)]">
        <Panel title="Earth · 1g · upward burning" tag={<Tag>Not built yet</Tag>} className="h-56">
          <EmptyNote>Earth chamber arrives in milestone M2.</EmptyNote>
        </Panel>
        <Panel title="Orbit · forced flow" tag={<Tag>Not built yet</Tag>} className="h-56">
          <EmptyNote>Orbit chamber arrives in milestone M2.</EmptyNote>
        </Panel>
        <Panel title="Eq. 6.1 inset" tag={<Tag>Not built yet</Tag>} className="h-56">
          <EmptyNote>Oxygen-versus-flow chart arrives in milestone M2.</EmptyNote>
        </Panel>
      </div>
      <Panel title="Burn twin controls" tag={<Tag>Not built yet</Tag>}>
        <EmptyNote>Oxygen, flow and rod-size controls arrive in milestone M2.</EmptyNote>
      </Panel>
    </section>
  )
}
