import { PanelRightClose, PanelRightOpen } from 'lucide-react'

type HeaderProps = {
  dockOpen: boolean
  onToggleDock: () => void
}

export function Header({ dockOpen, onToggleDock }: HeaderProps) {
  const Icon = dockOpen ? PanelRightClose : PanelRightOpen
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-void px-4 py-2.5">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-bold tracking-[0.2em]">ZERO-DRAFT</h1>
        <p className="hidden text-sm text-muted sm:block">BASS-II microgravity fire experiments</p>
      </div>
      <button
        type="button"
        onClick={onToggleDock}
        aria-expanded={dockOpen}
        aria-controls="lab-partner-dock"
        className="flex items-center gap-2 border border-line bg-panel px-3 py-1.5 text-sm hover:border-cyan hover:text-cyan"
      >
        <Icon aria-hidden="true" className="size-4" />
        {dockOpen ? 'Close Lab Partner' : 'Open Lab Partner'}
      </button>
    </header>
  )
}
