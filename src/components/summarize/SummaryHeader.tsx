import { X } from 'lucide-react'
import { useId, useState } from 'react'
import { auditHeadline, type AuditFile } from '../../lib/audit'
import { summarizeStore } from '../../lib/summarizeStore'
import { AUDIT_FILTER_LABELS, hasFilters, type TestFilters } from '../../lib/testWall'
import { AnimatedNumber } from '../AnimatedNumber'
import { BriefingText, BriefingToggle } from './BriefingBox'

type SummaryHeaderProps = {
  audit: AuditFile
  filters: TestFilters
  shown: number
  shownBurning: number
}

/**
 * The top of SUMMARIZE, on the page background: a plain-words headline built from audit.json
 * alone (it stands even if the AI briefing never ships), then what the filters show, and the AI
 * briefing's toggle.
 */
export function SummaryHeader({ audit, filters, shown, shownBurning }: SummaryHeaderProps) {
  const headline = auditHeadline(audit)
  const [briefingOpen, setBriefingOpen] = useState(false)
  const briefingId = useId()
  const lowest = headline.lowestBurning

  return (
    <div className="flex shrink-0 flex-col gap-2 px-6 pt-3 pb-2">
      <p className="max-w-[80rem] text-xl leading-7 text-ink">
        <span className="tabular-nums">{headline.quarantined}</span> of{' '}
        <span className="tabular-nums">{headline.total}</span> rows fail basic physics checks and are set aside.{' '}
        <span className="tabular-nums">{headline.burnConfirmed}</span> tests show sensor-confirmed burning
        {lowest ? (
          <>
            ; the lowest oxygen a confirmed flame burned down to was{' '}
            <span className="tabular-nums">{lowest.value.toFixed(1)}%</span> (<span className="test-id">{lowest.testId}</span>).
          </>
        ) : (
          '.'
        )}
      </p>
      <div className="flex h-6 items-center gap-4 text-sm whitespace-nowrap">
        <p className="text-muted">
          Showing <AnimatedNumber value={shown} className="text-ink" /> of{' '}
          <span className="text-ink tabular-nums">{headline.total}</span> tests,{' '}
          <AnimatedNumber value={shownBurning} className="text-ink" /> burn confirmed by sensors
        </p>
        {filters.audit && (
          <button
            type="button"
            onClick={() => summarizeStore.setFilters({ audit: null })}
            aria-label={`Remove the filter: only ${AUDIT_FILTER_LABELS[filters.audit]}`}
            className="flex items-center gap-1.5 rounded-sm border border-cyan px-2 py-0.5 text-xs text-ink hover:bg-cyan/10"
          >
            Only: {AUDIT_FILTER_LABELS[filters.audit]}
            <X aria-hidden="true" className="size-3" />
          </button>
        )}
        {hasFilters(filters) && (
          <button type="button" onClick={summarizeStore.clearFilters} className="text-xs text-cyan hover:underline">
            Clear filters
          </button>
        )}
        <span className="ml-auto">
          <BriefingToggle open={briefingOpen} onToggle={() => setBriefingOpen((open) => !open)} controls={briefingId} />
        </span>
      </div>
      {briefingOpen && <BriefingText id={briefingId} />}
    </div>
  )
}
