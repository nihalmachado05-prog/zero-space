import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { citePreview, getClaim } from '../lib/claims'
import { useCitation } from './citationContext'
import { FootnotePreview } from './FootnotePreview'
import { useFootnoteNumber } from './footnoteContext'

type CiteProps = {
  /** A claim id from src/data/claims.json. check:claims fails if it is missing. */
  id: string
  /** Only the citation drawer sets this, to link inputs that may not be verified. */
  showUnverified?: boolean
}

/** Hovering waits this long before the first preview, so a passing pointer doesn't flash one. */
const OPEN_DELAY_MS = 400
/** Leaving waits this long, so the pointer can cross the gap onto the preview. */
const CLOSE_DELAY_MS = 120
/** Within this time of one preview closing, the next opens at once (moving along a line). */
const WARM_MS = 600
let lastClosedAt = -Infinity

/**
 * A scientific footnote: a small cyan superscript number, ¹ ² ³ in order of appearance on the
 * current view (see FootnoteScope). Hover or keyboard focus shows a one-line preview of the
 * source; a click opens the citation drawer.
 * Unverified or unknown claims render nothing outside the drawer (CLAUDE.md rule 3).
 */
export function Cite({ id, showUnverified = false }: CiteProps) {
  const { openCitation } = useCitation()
  const claim = getClaim(id)
  const shown = claim !== undefined && (claim.verified || showUnverified)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const number = useFootnoteNumber(shown ? id : null, buttonRef)
  const preview = usePreview()
  const previewId = useId()

  if (!shown) return null

  function onPointerEnter(event: PointerEvent) {
    if (event.pointerType === 'mouse') preview.show(false)
  }

  function onFocus(event: FocusEvent<HTMLButtonElement>) {
    // Keyboard focus only: after a click the drawer opens, and focus coming back from it
    // by mouse shouldn't pop a preview.
    if (event.currentTarget.matches(':focus-visible')) preview.show(true)
  }

  function onKeyDown(event: KeyboardEvent) {
    // Esc closes the preview first; with no preview open, Esc goes on to close the drawer.
    if (event.key === 'Escape' && preview.open) {
      event.stopPropagation()
      preview.hide(true)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          preview.hide(true)
          openCitation(id)
        }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={() => preview.hide(false)}
        onFocus={onFocus}
        onBlur={() => preview.hide(true)}
        onKeyDown={onKeyDown}
        aria-haspopup="dialog"
        aria-describedby={preview.open ? previewId : undefined}
        aria-label={`Footnote ${number ?? ''}, show source: ${claim.text}`}
        className="relative -top-[0.6em] cursor-pointer px-[0.1em] align-baseline font-sans text-[0.75em] leading-none font-semibold text-cyan after:absolute after:-inset-x-1 after:-inset-y-1.5 after:content-[''] focus-visible:outline-offset-1"
      >
        {number}
      </button>
      {preview.open && (
        <FootnotePreview
          id={previewId}
          anchor={buttonRef}
          text={citePreview(claim)}
          onPointerEnter={() => preview.show(true)}
          onPointerLeave={() => preview.hide(false)}
        />
      )}
    </>
  )
}

/** Open and close timing for one footnote's preview. */
function usePreview() {
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  function set(next: boolean) {
    if (openRef.current && !next) lastClosedAt = performance.now()
    openRef.current = next
    setOpen(next)
  }

  function show(now: boolean) {
    window.clearTimeout(timer.current)
    if (now || performance.now() - lastClosedAt < WARM_MS) set(true)
    else timer.current = window.setTimeout(() => set(true), OPEN_DELAY_MS)
  }

  function hide(now: boolean) {
    window.clearTimeout(timer.current)
    if (now) set(false)
    else timer.current = window.setTimeout(() => set(false), CLOSE_DELAY_MS)
  }

  // A preview is pinned to where its footnote was; close it if anything scrolls.
  useEffect(() => {
    if (!open) return
    const close = () => {
      window.clearTimeout(timer.current)
      set(false)
    }
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [open])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { open, show, hide }
}
