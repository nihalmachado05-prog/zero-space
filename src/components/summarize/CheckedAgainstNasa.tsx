import type { ReactNode } from 'react'
import { nasaChecks, type Bass2Row } from '../../lib/audit'
import { getClaim } from '../../lib/claims'
import { Cite } from '../Cite'

function Quote({ id }: { id: string }) {
  const claim = getClaim(id)
  if (!claim?.verified || !claim.quote) return null
  return (
    <span className="font-serif text-base leading-6">
      “{claim.quote}”
      <Cite id={id} />
    </span>
  )
}

const n = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined ? 'Not stated' : value.toFixed(digits)

/**
 * "Checked against NASA" (F2): our numbers recomputed from the raw CSV, beside the report's own
 * words. Computed over every test, whatever the filters, by lib/audit.ts nasaChecks().
 */
export function CheckedAgainstNasa({ rows }: { rows: Bass2Row[] }) {
  const checks = nasaChecks(rows)
  const tests = (count: number) => (
    <>
      (<span className="num">{count}</span> tests)
    </>
  )
  const lines: { ours: ReactNode; nasa: ReactNode }[] = [
    {
      ours: (
        <>
          Opposed slabs: median <span className="num">{n(checks.opposedSlabs.median)}</span> ppm CO per 1% CO2{' '}
          {tests(checks.opposedSlabs.n)}
        </>
      ),
      nasa: <Quote id="bass2.co.370" />,
    },
    {
      ours: (
        <>
          Concurrent and stagnation rods together: median{' '}
          <span className="num">{n(checks.concurrentAndStagnationRods.median)}</span>{' '}
          {tests(checks.concurrentAndStagnationRods.n)}
        </>
      ),
      nasa: (
        <span className="flex flex-col gap-1">
          <Quote id="bass2.co.550" />
          <span className="text-xs text-muted">
            The report doesn’t say how it grouped stagnation tests, so ours puts them with the concurrent rods.
          </span>
        </span>
      ),
    },
    {
      ours: (
        <>
          Opposed rods: median <span className="num">{n(checks.opposedRods.median)}</span>, ranging{' '}
          <span className="num">{n(checks.opposedRods.min)}</span> to <span className="num">{n(checks.opposedRods.max)}</span>{' '}
          {tests(checks.opposedRods.n)}
        </>
      ),
      nasa: <Quote id="bass2.co.opposed-rods" />,
    },
    {
      ours: (
        <>
          Lowest final O2 with confirmed burning: <span className="num">{n(checks.lowestBurning?.value, 1)}%</span> (
          <span className="num">{checks.lowestBurning?.testId}</span>)
        </>
      ),
      nasa: (
        <span className="flex flex-col gap-1">
          <Quote id="bass2.ign.survive-13.6" />
          <Quote id="bass2.note.o4" />
        </span>
      ),
    },
    {
      ours: (
        <>
          Lowest final O2 in the whole file: <span className="num">{n(checks.lowestUsable?.value, 1)}%</span> (
          <span className="num">{checks.lowestUsable?.testId}</span>), a test with no sustained flame
        </>
      ),
      nasa: <Quote id="bass2.note.o12" />,
    },
  ]

  return (
    <section aria-labelledby="checked-against-nasa" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="checked-against-nasa" className="text-base leading-6 font-semibold">
          Checked against NASA
        </h2>
        <p className="text-xs text-muted">
          Recomputed from all <span className="num">{rows.length}</span> rows of the raw CSV, whatever the filters
        </p>
      </div>
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="w-1/2 pr-6 pb-2 font-normal">Recomputed from the CSV</th>
            <th className="pb-2 font-normal">NASA’s report</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className="border-t border-line align-top">
              <td className="py-3 pr-6 leading-6">{line.ours}</td>
              <td className="py-3">{line.nasa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
