import { CircleAlert, CircleCheck, ExternalLink, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { getClaim, getSource, sourceFolder, sourceLink, type Claim } from '../lib/claims'
import { Cite } from './Cite'
import { SweptQuote } from './SweptQuote'

type CitationDrawerProps = {
  claimId: string | null
  onClose: () => void
}

const SLIDE_MS = 220
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * F6: slides in from the right over 220 ms, then the highlight sweeps across the quote.
 * Focus moves in and is trapped; Esc, the Close button or a click outside closes it.
 */
export function CitationDrawer({ claimId, onClose }: CitationDrawerProps) {
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const headingId = useId()
  const open = claimId !== null
  const claim = claimId === null ? undefined : getClaim(claimId)

  // Move focus into the drawer when it opens or switches to another claim.
  useEffect(() => {
    if (open) headingRef.current?.focus()
  }, [open, claimId])

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !panelRef.current) return
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (items.length === 0) return
    const index = items.indexOf(document.activeElement as HTMLElement)
    const last = items.length - 1
    let next: number | null = null
    if (event.shiftKey) next = index <= 0 ? last : null
    else next = index === -1 || index === last ? 0 : null
    if (next !== null) {
      event.preventDefault()
      items[next].focus()
    }
  }

  const duration = reduceMotion ? 0 : SLIDE_MS / 1000
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
          <motion.div
            className="absolute inset-0 bg-void/60"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="absolute inset-y-0 right-0 flex w-[28rem] max-w-full flex-col gap-6 overflow-y-auto border-l border-line bg-panel p-6"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id={headingId}
                ref={headingRef}
                tabIndex={-1}
                className="text-base leading-6 font-semibold"
              >
                {claim?.text ?? 'Claim not found'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex shrink-0 items-center gap-2 text-sm text-muted hover:text-ink"
              >
                <X aria-hidden="true" className="size-4" />
                Close
              </button>
            </div>
            {claim ? (
              <ClaimDetails key={claim.id} claim={claim} sweepDelayMs={SLIDE_MS} />
            ) : (
              <p className="text-sm text-muted">
                No claim with the id <span className="num">{claimId}</span>.
              </p>
            )}
            <StatusLine verified={claim?.verified === true} computed={claim?.kind === 'computed'} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

function ClaimDetails({ claim, sweepDelayMs }: { claim: Claim; sweepDelayMs: number }) {
  const source = getSource(claim.sourceId)
  const link = source ? sourceLink(source) : null
  const locator = claim.locator
  return (
    <>
      {claim.quote && (
        <SweptQuote quote={claim.quote} highlight={claim.verified} delayMs={sweepDelayMs} />
      )}
      {claim.kind === 'computed' && (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-muted">Formula</p>
          <p className="num">{claim.formula ?? 'Not stated'}</p>
          {claim.inputs && claim.inputs.length > 0 && (
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-muted">Inputs</span>
              {claim.inputs.map((input) => (
                <Cite key={input} id={input} showUnverified />
              ))}
            </p>
          )}
        </div>
      )}
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        {source && (
          <>
            <dt className="text-muted">Source</dt>
            <dd>
              {source.title}
              <span className="text-muted">
                , {source.publisher}
                {source.year !== null && <span className="num">, {source.year}</span>}
              </span>
            </dd>
          </>
        )}
        {locator?.pdfPage !== undefined && (
          <>
            <dt className="text-muted">Report page</dt>
            <dd className="num">{locator.reportPage ?? 'Not stated'}</dd>
            <dt className="text-muted">PDF page</dt>
            <dd className="num">
              {locator.pdfPage}
              {locator.spansNextPage && `–${locator.pdfPage + 1}`}
            </dd>
          </>
        )}
        {locator?.file && claim.sourceId && (
          <>
            <dt className="text-muted">File</dt>
            <dd className="break-all">
              {sourceFolder(claim.sourceId)}/{locator.file}
            </dd>
            <dt className="text-muted">Line</dt>
            <dd className="num">{locator.line}</dd>
          </>
        )}
      </dl>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="flex w-fit items-center gap-2 text-sm text-cyan hover:underline"
        >
          Open the source
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      )}
    </>
  )
}

function StatusLine({ verified, computed }: { verified: boolean; computed: boolean }) {
  if (!verified) {
    return (
      <p className="mt-auto flex items-center gap-2 text-sm text-red">
        <CircleAlert aria-hidden="true" className="size-4" />
        Not verified
      </p>
    )
  }
  return (
    <p className="mt-auto flex items-center gap-2 text-sm text-emerald">
      <CircleCheck aria-hidden="true" className="size-4" />
      {computed ? 'Inputs checked' : 'Quote checked'}
    </p>
  )
}
