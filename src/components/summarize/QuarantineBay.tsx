import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'
import { COLUMNS, type Bass2Row, type O2Forensic } from '../../lib/audit'
import { o2FillColor, tileLabel } from '../../lib/testWall'
import { Switch } from '../Switch'
import { flyIn, landedAt } from './flight'
import { StatusGlyph } from './glyphs'
import { ShowTheMath } from './ShowTheMath'
import { TestTile } from './TestTile'
import { wallHover } from './wallHover'

type QuarantineBayProps = {
  rows: Bass2Row[]
  quarantine: boolean
  onQuarantine: (on: boolean) => void
  matched: ReadonlySet<string>
  domain: { min: number; max: number }
  forensics: ReadonlyMap<string, O2Forensic>
  mathId: string | null
  onToggleMath: (testId: string) => void
  onOpen: (testId: string) => void
}

/** Why a tile is here, in words, with the number in mono. */
function ReasonChip({ row }: { row: Bass2Row }) {
  const impossible = row.flags.includes('o2-impossible')
  return (
    <span className="flex items-center gap-2 text-xs leading-4 whitespace-nowrap text-ink">
      <StatusGlyph severity="quarantined" />
      {impossible ? (
        <span>
          Final O2 <span className="tabular-nums">{row.raw[COLUMNS.o2Final].trim()}%</span>: impossible
        </span>
      ) : (
        'Final O2 not recorded'
      )}
    </span>
  )
}

/**
 * The quarantine bay (F2): its toggle, and a slot for each quarantined test. Turned on, the tiles
 * fly in from the wall one after another, each landing with its reason chip; impossible values get
 * "Show the math". Turned off, they fly back and the slots wait empty.
 */
export function QuarantineBay(props: QuarantineBayProps) {
  const { rows, quarantine, onQuarantine, matched, domain, forensics, mathId, onToggleMath, onOpen } = props
  const reduceMotion = useReducedMotion() ?? false
  const headingId = useId()
  const mathIdPrefix = useId()

  return (
    <section aria-labelledby={headingId} className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id={headingId} className="text-sm leading-5 font-semibold">
          Quarantine bay
        </h2>
        <Switch label="Quarantine" checked={quarantine} onChange={onQuarantine} />
      </div>
      <p className="max-w-md text-xs leading-5 text-muted">
        Spreadsheet anomalies we flagged: <span className="tabular-nums text-ink">{rows.length}</span> tests whose final O2
        is missing or physically impossible. Every statistic leaves them out, with the toggle on or off.
      </p>

      <ol className="-mx-2 flex min-h-0 flex-col gap-2 overflow-y-auto px-2 py-1">
        {rows.map((row, order) => {
          const forensic = forensics.get(row.testId)
          const mathOpen = quarantine && mathId === row.testId
          const mathRegion = `${mathIdPrefix}-${row.testId}`
          return (
            <li key={row.testId} className="flex flex-col">
              <div className="flex min-h-10 items-center gap-3">
                {quarantine ? (
                  <TestTile
                    row={row}
                    fill={o2FillColor(row.o2InitPct, domain)}
                    dimmed={!matched.has(row.testId)}
                    flight={flyIn(order)}
                    layoutKey={quarantine}
                    label={tileLabel(row)}
                    onClick={() => onOpen(row.testId)}
                    onFocus={() => wallHover.set(row.testId)}
                    onPointerEnter={() => wallHover.set(row.testId)}
                  />
                ) : (
                  <div aria-hidden="true" className="size-9 shrink-0 border border-dashed border-line @min-[1300px]/stage:size-10" />
                )}
                <motion.div
                  className="flex flex-wrap items-center gap-x-3 gap-y-1"
                  initial={false}
                  animate={{ opacity: quarantine ? 1 : 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.2,
                    delay: quarantine && !reduceMotion ? landedAt(order) : 0,
                  }}
                  aria-hidden={!quarantine}
                >
                  <ReasonChip row={row} />
                  {forensic && quarantine && (
                    <button
                      type="button"
                      aria-expanded={mathOpen}
                      aria-controls={mathRegion}
                      onClick={() => onToggleMath(row.testId)}
                      className="text-xs whitespace-nowrap text-cyan hover:underline"
                    >
                      {mathOpen ? 'Hide the math' : 'Show the math'}
                    </button>
                  )}
                </motion.div>
              </div>
              {mathOpen && forensic && (
                <div className="@min-[1300px]/stage:pl-[3.25rem]">
                  <ShowTheMath forensic={forensic} id={mathRegion} />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
