import { EmptyNote, Panel, Tag } from '../components/Panel'

type LabPartnerDockProps = {
  open: boolean
}

/** F5 Lab Partner dock. Empty shell: the AI arrives in M6. Hidden, not removed, when closed. */
export function LabPartnerDock({ open }: LabPartnerDockProps) {
  return (
    <aside id="lab-partner-dock" aria-label="Lab Partner" hidden={!open}>
      <Panel title="Lab Partner" tag={<Tag>Not connected yet</Tag>} className="min-h-64 lg:h-full">
        <EmptyNote>
          The Lab Partner answers questions and drives the simulators. It arrives in milestone M6.
        </EmptyNote>
      </Panel>
    </aside>
  )
}
