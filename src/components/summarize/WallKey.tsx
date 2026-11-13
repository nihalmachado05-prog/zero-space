import {
  BURN_STATUS_LABELS,
  burnStatus,
  COLUMNS,
  SAMPLE_TYPE_LABELS,
  SEVERITY_LABELS,
  severityOf,
  type Bass2Row,
  type FlowConfig,
  type Severity,
} from '../../lib/audit'
import { o2FillColor } from '../../lib/testWall'
import { FlowGlyph, StatusGlyph } from './glyphs'
import { useWallHover } from './wallHover'

const SWATCHES = 5
const FLOWS: (FlowConfig | null)[] = ['Opposed', 'Concurrent', 'Stagnation', null]
const STATUSES: Severity[] = ['quarantined', 'co-over-range', 'warning']

/** The key under the wall: the initial-O2 scale in steps, then what the corner marks mean. */
export function WallLegend({ domain }: { domain: { min: number; max: number } }) {
  const steps = Array.from({ length: SWATCHES }, (_, i) => domain.min + ((domain.max - domain.min) * i) / (SWATCHES - 1))
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs leading-4 text-muted">
      <span className="flex items-center gap-2">
        Initial O2
        <span className="num text-ink">{domain.min.toFixed(1)}%</span>
        <span aria-hidden="true" className="flex gap-px">
          {steps.map((o2) => (
            <span key={o2} className="h-3 w-4" style={{ backgroundColor: o2FillColor(o2, domain) }} />
          ))}
        </span>
        <span className="num text-ink">{domain.max.toFixed(1)}%</span>
      </span>
      <span className="flex items-center gap-3">
        {FLOWS.map((flow) => (
          <span key={flow ?? 'none'} className="flex items-center gap-1.5">
            <FlowGlyph flow={flow} className="text-ink/70" />
            {flow ?? 'Flow not stated'}
          </span>
        ))}
      </span>
      <span className="flex items-center gap-3">
        {STATUSES.map((severity) => (
          <span key={severity} className="flex items-center gap-1.5">
            <StatusGlyph severity={severity} />
            {SEVERITY_LABELS[severity]}
          </span>
        ))}
      </span>
      <span>Outcome, AI-read from NASA’s notes: Not generated yet</span>
    </div>
  )
}

/** One line about the tile under the pointer or keyboard focus. */
export function WallReadout({ byId }: { byId: ReadonlyMap<string, Bass2Row> }) {
  const testId = useWallHover()
  const row = testId ? byId.get(testId) : undefined
  return (
    <p aria-live="off" className="flex h-5 min-w-0 items-baseline gap-3 text-xs leading-5 whitespace-nowrap">
      {row ? <Readout row={row} /> : <span className="text-muted">Hover or focus a tile to read it here. Click it for its full record.</span>}
    </p>
  )
}

function Readout({ row }: { row: Bass2Row }) {
  const severity = severityOf(row.flags)
  return (
    <>
      <span className="num text-sm text-ink">{row.testId}</span>
      <span className="text-muted">{row.pi}</span>
      <span className="num text-muted">{row.raw[COLUMNS.date]}</span>
      <span>{SAMPLE_TYPE_LABELS[row.sampleType]}</span>
      <span className="text-muted">
        O2 <span className="num text-ink">{row.raw[COLUMNS.o2Init].trim()}</span> to{' '}
        <span className="num text-ink">{row.raw[COLUMNS.o2Final].trim() || 'blank'}</span>
      </span>
      <span className="text-muted">{row.flowConfig ?? 'Flow not stated'}</span>
      <span className="truncate text-muted">
        {severity === 'clean' ? BURN_STATUS_LABELS[burnStatus(row)] : SEVERITY_LABELS[severity]}
      </span>
    </>
  )
}
