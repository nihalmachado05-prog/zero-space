import { X } from 'lucide-react'
import { LayoutGroup } from 'motion/react'
import { useCallback, useEffect, useMemo } from 'react'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { Note } from '../components/Note'
import { BriefingBox } from '../components/summarize/BriefingBox'
import { CheckedAgainstNasa } from '../components/summarize/CheckedAgainstNasa'
import { DistributionStrip } from '../components/summarize/DistributionStrip'
import { FilterStrip } from '../components/summarize/FilterStrip'
import { QuarantineBay } from '../components/summarize/QuarantineBay'
import { RecordDrawer } from '../components/summarize/RecordDrawer'
import { TestWall } from '../components/summarize/TestWall'
import { WallLegend, WallReadout } from '../components/summarize/WallKey'
import { forensicClaimId, isQuarantined, o2Forensic, type Bass2File, type O2Forensic } from '../lib/audit'
import { useAuditData } from '../lib/bass2Data'
import { getClaim } from '../lib/claims'
import type { ViewProps } from '../lib/route'
import { summarizeStore, useSummarize } from '../lib/summarizeStore'
import {
  AUDIT_FILTER_LABELS,
  bayRows,
  hasFilters,
  linkFromParams,
  matchesFilters,
  o2Domain,
  wallColumns,
} from '../lib/testWall'

/** #/summarize : F2 telemetry explorer. Reads ?audit=, ?pi=, ?flow=, ?sample=, ?burn=, ?quarantine=on and ?test=. */
export function Summarize({ params }: ViewProps) {
  const data = useAuditData()
  return (
    <>
      <h1 className="sr-only">Summarize</h1>
      {data.status === 'loading' && <Note className="p-6">Loading NASA’s test table…</Note>}
      {data.status === 'error' && <p className="p-6 text-sm text-red">Couldn’t load the test table: {data.message}</p>}
      {data.status === 'ready' && <Explorer bass2={data.bass2} params={params} />}
    </>
  )
}

function Explorer({ bass2, params }: { bass2: Bass2File; params: ViewProps['params'] }) {
  const rows = bass2.rows
  const filters = useSummarize((state) => state.filters)
  const quarantine = useSummarize((state) => state.quarantine)
  const recordId = useSummarize((state) => state.recordId)
  const mathId = useSummarize((state) => state.mathId)

  const wall = useMemo(() => {
    const columns = wallColumns(rows)
    const bay = bayRows(columns)
    const forensics = new Map<string, O2Forensic>()
    for (const row of bay) {
      const claim = getClaim(forensicClaimId(row.testId))
      if (row.flags.includes('o2-impossible') && claim?.verified && claim.quote) {
        forensics.set(row.testId, o2Forensic(row, claim.quote))
      }
    }
    return {
      columns,
      bay,
      bayOrder: new Map(bay.map((row, order) => [row.testId, order])),
      byId: new Map(rows.map((row) => [row.testId, row])),
      domain: o2Domain(rows),
      forensics,
      pis: columns.map((column) => column.pi),
    }
  }, [rows])

  const shown = useMemo(() => rows.filter((row) => matchesFilters(row, filters)), [rows, filters])
  const matched = useMemo(() => new Set(shown.map((row) => row.testId)), [shown])

  // Deep links (#/summarize?test=P22b) and links from the audit bar.
  const paramKey = new URLSearchParams(params).toString()
  useEffect(() => {
    const link = linkFromParams(Object.fromEntries(new URLSearchParams(paramKey)))
    if (Object.keys(link).length === 0) return
    summarizeStore.applyLink(link, (testId) => {
      const row = wall.byId.get(testId)
      return row ? isQuarantined(row) : undefined
    })
  }, [paramKey, wall])

  const openRecord = useCallback((testId: string) => summarizeStore.openRecord(testId), [])
  const closeRecord = useCallback(() => {
    const testId = summarizeStore.get().recordId
    summarizeStore.closeRecord()
    if (testId) document.querySelector<HTMLElement>(`[data-test-id="${CSS.escape(testId)}"]`)?.focus()
  }, [])

  const record = recordId ? (wall.byId.get(recordId) ?? null) : null

  return (
    <>
      <div className="flex h-full min-h-[46rem] flex-col">
        <BriefingBox />
        <LayoutGroup>
          {/* A container: tiles shrink below a 1300px stage, and below 1100px (the Lab Partner dock
              open) the bay moves under the wall. */}
          <section aria-label="Test wall and quarantine bay" className="@container/stage flex flex-1 flex-col bg-window">
            <div className="flex flex-1 @max-[1100px]/stage:flex-col">
              <div className="flex min-w-0 shrink-0 flex-col gap-4 p-6">
                <div className="flex h-6 items-center gap-4 text-sm whitespace-nowrap">
                  <h2 className="leading-5 font-semibold">Test wall</h2>
                  <p className="text-muted">
                    Showing <AnimatedNumber value={shown.length} className="text-ink" /> of{' '}
                    <span className="num text-ink">{rows.length}</span> tests,{' '}
                    <AnimatedNumber value={shown.filter((row) => row.burnConfirmed).length} className="text-ink" /> burn
                    confirmed by sensors
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
                    <button
                      type="button"
                      onClick={summarizeStore.clearFilters}
                      className="text-xs text-cyan hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                <TestWall
                  columns={wall.columns}
                  quarantine={quarantine}
                  matched={matched}
                  domain={wall.domain}
                  bayOrder={wall.bayOrder}
                  onOpen={openRecord}
                />
                {/* w-0 min-w-full: the key wraps to the wall's width instead of widening the column. */}
                <div className="mt-auto flex w-0 min-w-full flex-col gap-3">
                  <WallReadout byId={wall.byId} />
                  <WallLegend domain={wall.domain} />
                </div>
              </div>
              <div
                aria-hidden="true"
                className="my-6 w-px shrink-0 bg-line @max-[1100px]/stage:mx-6 @max-[1100px]/stage:my-0 @max-[1100px]/stage:h-px @max-[1100px]/stage:w-auto"
              />
              {/* The wall sets the stage's height; the bay fills it and scrolls inside (absolute, so an
                  open "Show the math" never stretches the stage). Stacked, it takes its own height. */}
              <div className="relative min-w-64 flex-1 @max-[1100px]/stage:static">
                <div className="absolute inset-0 flex flex-col p-6 @max-[1100px]/stage:static">
                  <QuarantineBay
                    rows={wall.bay}
                    quarantine={quarantine}
                    onQuarantine={summarizeStore.setQuarantine}
                    matched={matched}
                    domain={wall.domain}
                    forensics={wall.forensics}
                    mathId={mathId}
                    onToggleMath={summarizeStore.toggleMath}
                    onOpen={openRecord}
                  />
                </div>
              </div>
            </div>
          </section>
        </LayoutGroup>
        <div className="shrink-0 border-t border-line px-6 py-4">
          <FilterStrip filters={filters} pis={wall.pis} domain={wall.domain} />
        </div>
      </div>

      <div className="flex flex-col gap-10 px-6 pt-8 pb-12">
        <section aria-labelledby="distribution-heading" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="distribution-heading" className="text-base leading-6 font-semibold">
              Distributions of the tests shown
            </h2>
            <p className="text-xs text-muted">Quarantined tests are left out: their O2 is unusable</p>
          </div>
          <DistributionStrip rows={shown} />
        </section>
        <CheckedAgainstNasa rows={rows} />
      </div>

      <RecordDrawer
        row={record}
        total={rows.length}
        flow={record ? bass2.flowEvidence[record.testId] : undefined}
        forensic={record ? wall.forensics.get(record.testId) : undefined}
        onClose={closeRecord}
      />
    </>
  )
}
