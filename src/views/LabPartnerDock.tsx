import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Note } from '../components/Note'

type LabPartnerDockProps = {
  open: boolean
  onToggle: () => void
}

/**
 * F5 Lab Partner dock: full height on the right of every view. Collapsed to a 48px rail by
 * default, 384px when open. Text only, so no frame. The AI itself arrives in M6.
 */
export function LabPartnerDock({ open, onToggle }: LabPartnerDockProps) {
  return (
    <aside
      id="lab-partner-dock"
      aria-label="Lab Partner"
      className={`flex shrink-0 flex-col border-l border-line ${open ? 'w-96' : 'w-12'}`}
    >
      {open ? (
        <>
          <div className="flex h-10 shrink-0 items-center justify-between px-6">
            <h2 className="text-sm font-semibold">Lab Partner</h2>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={true}
              aria-controls="lab-partner-dock"
              className="flex items-center gap-2 text-sm text-muted hover:text-ink"
            >
              <PanelRightClose aria-hidden="true" className="size-4" />
              Close
            </button>
          </div>
          <div className="px-6 py-2">
            <Note>
              Lab Partner answers questions and drives the simulators. It arrives in M6.
            </Note>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-controls="lab-partner-dock"
          aria-label="Open Lab Partner"
          className="flex h-full w-full flex-col items-center text-sm text-muted hover:text-ink focus-visible:outline-offset-[-2px]"
        >
          <span className="flex h-10 items-center">
            <PanelRightOpen aria-hidden="true" className="size-4" />
          </span>
          <span className="py-2 [writing-mode:vertical-rl]">Lab Partner</span>
        </button>
      )}
    </aside>
  )
}
