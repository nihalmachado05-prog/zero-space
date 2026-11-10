import { useId, type ReactNode } from 'react'

// A small "+" mark centred on a panel corner (CLAUDE.md design rules).
function CornerTick({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 9 9"
      className={`pointer-events-none absolute size-[9px] text-muted ${className}`}
    >
      <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  )
}

type PanelProps = {
  /** Short label shown in the panel's top-left, in small capitals. */
  title: string
  /** Optional small label at the top-right, such as a status chip. */
  tag?: ReactNode
  className?: string
  children?: ReactNode
}

/** The instrument-panel frame: 1px border, square corners, "+" corner ticks. */
export function Panel({ title, tag, className = '', children }: PanelProps) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={`relative flex flex-col border border-line bg-panel ${className}`}
    >
      <CornerTick className="-top-[4.5px] -left-[4.5px]" />
      <CornerTick className="-top-[4.5px] -right-[4.5px]" />
      <CornerTick className="-bottom-[4.5px] -left-[4.5px]" />
      <CornerTick className="-right-[4.5px] -bottom-[4.5px]" />
      <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-1.5">
        <h2 id={headingId} className="text-xs font-semibold tracking-widest text-muted uppercase">
          {title}
        </h2>
        {tag}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  )
}

/** A small bordered text label, used for statuses like "Not built yet". */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="num border border-line px-1.5 py-0.5 text-xs text-muted">{children}</span>
  )
}

/** Muted text for areas a later milestone will fill in. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="p-3 text-sm text-muted">{children}</p>
}
