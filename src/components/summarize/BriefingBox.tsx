import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'

/**
 * The AI dataset briefing (F2), collapsible at the top of the view. The pipeline writes it in M7
 * from the computed statistics only, with every number checked; until then it says so.
 */
export function BriefingBox() {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  return (
    <div className="flex shrink-0 flex-col gap-1 px-6 py-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-fit items-center gap-2 text-sm leading-6"
      >
        <ChevronDown
          aria-hidden="true"
          className={`size-4 text-muted transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
        />
        AI dataset briefing
        <span className="text-muted">Not generated yet</span>
      </button>
      {open && (
        <p id={bodyId} className="max-w-3xl pl-6 text-sm leading-6 text-muted">
          Not generated yet. It will be written from the computed statistics only, labeled “AI-written, numbers
          checked”, and the build fails if any number in it isn’t in those statistics.
        </p>
      )}
    </div>
  )
}
