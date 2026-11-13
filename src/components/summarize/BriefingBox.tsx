import { ChevronDown } from 'lucide-react'

/**
 * The AI dataset briefing (F2). The pipeline writes it in M7 from the computed statistics only,
 * with every number checked; until then it says so. The toggle sits at the right end of the
 * SUMMARIZE header row, and the text opens under that row.
 */
export function BriefingToggle({ open, onToggle, controls }: { open: boolean; onToggle: () => void; controls: string }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className="flex shrink-0 items-center gap-2 text-sm leading-6"
    >
      <ChevronDown
        aria-hidden="true"
        className={`size-4 text-muted transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
      />
      AI dataset briefing
      <span className="text-muted">Not generated yet</span>
    </button>
  )
}

export function BriefingText({ id }: { id: string }) {
  return (
    <p id={id} className="max-w-3xl text-sm leading-6 text-muted">
      Not generated yet. It will be written from the computed statistics only, labeled “AI-written, numbers
      checked”, and the build fails if any number in it isn’t in those statistics.
    </p>
  )
}
