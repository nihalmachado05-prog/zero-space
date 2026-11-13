import { CircleCheck, ExternalLink, Play } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  BURN_CO2_RISE_PCT,
  BURN_STATUS_LABELS,
  burnStatus,
  COLUMNS,
  FLAG_LABELS,
  GROUP_FLAGS,
  quarantineReason,
  SAMPLE_TYPE_LABELS,
  SEVERITY_LABELS,
  severityOf,
  type Bass2Row,
  type CheckedFlowEvidence,
  type Flag,
  type O2Forensic,
  type Severity,
} from '../../lib/audit'
import { getClaim, getSource, sourceLink, testNoteClaimIds } from '../../lib/claims'
import { OUTCOME_LABELS, useTestOutcomes } from '../../lib/generatedData'
import { replayPresetFor } from '../../lib/interpret'
import { formatHash } from '../../lib/route'
import { Cite } from '../Cite'
import { StatusGlyph } from './glyphs'
import { ShowTheMath } from './ShowTheMath'

/** Appendix A tables quoted in claims.json, by PI. */
const APPENDIX_TABLE_CLAIM: Record<string, string> = { Miller: 'bass2.table.a4', Olson: 'bass2.table.a5' }

type Field = { label: string; column: string; read?: (row: Bass2Row) => ReactNode }

const num = (value: number | null, missing = 'Not a number') =>
  value === null ? <span className="font-sans text-muted">{missing}</span> : value

const FIELDS: Field[] = [
  { label: 'PI', column: COLUMNS.pi },
  { label: 'Test', column: COLUMNS.test },
  { label: 'Date', column: COLUMNS.date, read: (row) => row.date },
  { label: 'GMT day of year', column: COLUMNS.gmt, read: (row) => num(row.gmtDay) },
  { label: 'Sample', column: COLUMNS.sample },
  {
    label: 'Material',
    column: COLUMNS.material,
    read: (row) => <span className="font-sans">{SAMPLE_TYPE_LABELS[row.sampleType]}</span>,
  },
  { label: 'Flow restrictor', column: COLUMNS.restrictor },
  { label: 'Fan display', column: COLUMNS.fan },
  { label: 'Air display', column: COLUMNS.air },
  { label: 'Radiometer gain', column: COLUMNS.radiometer },
  { label: 'Frames shot', column: COLUMNS.frames },
  { label: 'Initial O2, %', column: COLUMNS.o2Init, read: (row) => num(row.o2InitPct, 'Not recorded') },
  { label: 'Final O2, %', column: COLUMNS.o2Final, read: (row) => num(row.o2FinalPct, 'Not recorded') },
  { label: 'Initial CO2, %', column: COLUMNS.co2Init, read: (row) => num(row.co2InitPct, 'Not recorded') },
  { label: 'Final CO2, %', column: COLUMNS.co2Final, read: (row) => num(row.co2FinalPct, 'Not recorded') },
  { label: 'Initial CO, ppm', column: COLUMNS.coInit, read: (row) => num(row.coInitPpm) },
  { label: 'Final CO, ppm', column: COLUMNS.coFinal, read: (row) => num(row.coFinalPpm) },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm leading-5 font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function groupSeverity(flag: Flag): Severity | null {
  if (GROUP_FLAGS.quarantined.includes(flag)) return 'quarantined'
  if (GROUP_FLAGS['co-over-range'].includes(flag)) return 'co-over-range'
  if (flag.startsWith('note-')) return null
  return 'warning'
}

function flowReason(row: Bass2Row, flow: CheckedFlowEvidence | undefined): string {
  if (!flow?.quote) return `Not in Appendix A: this test ran in ${row.date.slice(0, 4)}.`
  if (/\s\?\s/.test(` ${flow.quote} `)) return 'NASA’s table shows “?” for its flow direction.'
  return 'Its Appendix A table has no flow column.'
}

/** The body of a test's record drawer. */
export function RecordDetails({ row, flow, forensic }: { row: Bass2Row; flow?: CheckedFlowEvidence; forensic?: O2Forensic }) {
  const severity = severityOf(row.flags)
  const burn = burnStatus(row)
  const notes = testNoteClaimIds(row.testId)
  const dataset = getSource('psi-25')
  const datasetLink = dataset ? sourceLink(dataset) : null
  const tableClaim = APPENDIX_TABLE_CLAIM[row.pi]
  const outcome = useTestOutcomes()?.outcomes.find((o) => o.testId === row.testId)
  const replay = replayPresetFor(row.testId)

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-center gap-2 text-sm">
        {severity === 'clean' ? (
          <CircleCheck aria-hidden="true" className="size-4 text-emerald" />
        ) : (
          <StatusGlyph severity={severity} className="size-2.5" />
        )}
        {SEVERITY_LABELS[severity]}
        {severity === 'quarantined' && <span className="text-muted">{quarantineReason(row)}</span>}
      </p>

      {replay && (
        <a
          href={formatHash('interpret', { preset: replay })}
          className="flex w-fit items-center gap-2 text-sm text-cyan hover:underline"
        >
          <Play aria-hidden="true" className="size-4" />
          Replay this test
        </a>
      )}

      {forensic && (
        <Section title="Show the math">
          <ShowTheMath forensic={forensic} />
        </Section>
      )}

      <Section title="Burn check">
        <p className="text-sm leading-6">
          {BURN_STATUS_LABELS[burn]}
          {row.dCo2Pct !== null && burn !== 'not-checked' && (
            <span className="text-muted">
              : CO2 rose <span className="tabular-nums text-ink">{row.dCo2Pct.toFixed(2)}</span> points;{' '}
              {burn === 'confirmed' ? 'at least' : 'under'} <span className="tabular-nums text-ink">{BURN_CO2_RISE_PCT.toFixed(1)}</span>,
              twice the CO2 sensor’s resolution
              <Cite id="bass2.sensor.co2-res" />
            </span>
          )}
        </p>
        {burn === 'confirmed' && (
          <p className="text-sm leading-6 text-muted">
            CO per 1% CO2:{' '}
            {row.coPerCo2 === null ? (
              'not worked out, a CO cell is not a number'
            ) : (
              <>
                <span className="tabular-nums text-ink">{Math.round(row.coPerCo2)}</span> ppm
              </>
            )}
          </p>
        )}
        {outcome && (
          <p className="text-sm leading-6">
            Outcome: {OUTCOME_LABELS[outcome.outcome]}{' '}
            <span className="text-muted">(AI-read from NASA’s notes, quote checked)</span>
            {outcome.quote && <span className="block font-serif text-base">“{outcome.quote}”</span>}
          </p>
        )}
      </Section>

      <Section title="Flow direction">
        <p className="text-sm leading-6">{row.flowConfig ?? 'Not stated'}</p>
        {row.flowConfig === null && <p className="text-sm text-muted">{flowReason(row, flow)}</p>}
        {flow?.quote && flow.quoteChecked && (
          <figure className="flex flex-col gap-1">
            <blockquote className="border-l-2 border-cyan pl-3 font-serif text-base leading-6 text-ink">
              {flow.quote.trim()}
            </blockquote>
            <figcaption className="flex items-center gap-2 pl-3.5 text-xs text-muted">
              Appendix A, report p. <span className="tabular-nums">{flow.reportPage}</span>, PDF p.{' '}
              <span className="tabular-nums">{flow.pdfPage}</span>
              <span className="flex items-center gap-1 text-emerald">
                <CircleCheck aria-hidden="true" className="size-3.5" />
                Quote checked
              </span>
            </figcaption>
          </figure>
        )}
      </Section>

      {notes.length > 0 && (
        <Section title="NASA’s note">
          {notes.map((id) => (
            <p key={id} className="font-serif text-base leading-6">
              {getClaim(id)?.quote}
              <Cite id={id} />
            </p>
          ))}
        </Section>
      )}

      <Section title="Flags">
        {row.flags.length === 0 ? (
          <p className="text-sm text-muted">None</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm leading-6">
            {row.flags.map((flag) => {
              const glyph = groupSeverity(flag)
              return (
                <li key={flag} className="flex items-center gap-2">
                  {glyph ? <StatusGlyph severity={glyph} /> : <span className="size-[7px]" />}
                  {FLAG_LABELS[flag]}
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section title="Every field">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="w-32 pb-2 font-normal">Field</th>
              <th className="pb-2 font-normal">Raw CSV cell</th>
              <th className="w-36 pb-2 font-normal">Read as</th>
            </tr>
          </thead>
          <tbody>
            {FIELDS.map((field) => {
              const raw = row.raw[field.column] ?? ''
              return (
                <tr key={field.column} className="border-t border-line align-top">
                  <td className="py-1.5 pr-3 text-muted">{field.label}</td>
                  <td className="num py-1.5 pr-3 break-words whitespace-pre-wrap">
                    {raw === '' ? <span className="font-sans text-muted">Empty</span> : raw}
                  </td>
                  <td className="num py-1.5">{field.read ? field.read(row) : <span className="text-muted">–</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Section>

      <Section title="Sources">
        <p className="text-sm leading-6">
          {dataset?.title}, {dataset?.publisher}, row <span className="tabular-nums">{row.rowIndex}</span>
        </p>
        <p className="text-sm leading-6">
          BASS-II report, Appendix A, which lists calibrated and uncalibrated O2 and observations for every test
          <Cite id="bass2.table.o2-columns" />
          {tableClaim && <Cite id={tableClaim} />}
        </p>
        {datasetLink && (
          <a
            href={datasetLink}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-2 text-sm text-cyan hover:underline"
          >
            Open the PSI-25 dataset
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        )}
      </Section>
    </div>
  )
}
