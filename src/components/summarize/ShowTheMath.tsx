import { CircleCheck } from 'lucide-react'
import type { O2Forensic } from '../../lib/audit'
import { getClaim } from '../../lib/claims'
import { Cite } from '../Cite'

const fmt = (value: number) => value.toFixed(1)

type ShowTheMathProps = {
  forensic: O2Forensic
  id?: string
}

/**
 * The forensic line behind an impossible O2 value (docs/fixtures/o2-forensics.json): the sum
 * large in mono, e.g. "19.1 + 20.0 = 39.1", how the offset was made, and NASA's Appendix A row
 * quoted in Source Serif beneath it. Every number is worked out in lib/audit.ts from the CSV and
 * the quoted row; nothing is typed in.
 */
export function ShowTheMath({ forensic, id }: ShowTheMathProps) {
  const claim = getClaim(forensic.claimId)
  const blankInitial = forensic.blank === 'uncalibrated-initial'
  const blankFinal = forensic.blank === 'uncalibrated-final'
  return (
    <div id={id} className="flex flex-col gap-4 py-4">
      <div
        role="math"
        aria-label={`${fmt(forensic.uncalibratedFinal ?? 0)} plus ${fmt(forensic.offset)} equals ${fmt(forensic.reproduced)}`}
        className="grid w-fit grid-cols-[repeat(5,auto)] items-baseline gap-x-2 gap-y-1"
      >
        <span className="num text-[1.75rem] leading-8 text-ink">{fmt(forensic.uncalibratedFinal ?? 0)}</span>
        <span className="num text-[1.75rem] leading-8 text-muted">+</span>
        <span className="num text-[1.75rem] leading-8 text-ink">{fmt(forensic.offset)}</span>
        <span className="num text-[1.75rem] leading-8 text-muted">=</span>
        <span className="num text-[1.75rem] leading-8 text-red">{fmt(forensic.reproduced)}</span>
        <span className="max-w-20 text-xs leading-4 text-muted">
          Uncalibrated final{blankFinal && ', blank, read as 0'}
        </span>
        <span />
        <span className="max-w-20 text-xs leading-4 text-muted">That day’s offset</span>
        <span />
        <span className="max-w-20 text-xs leading-4 text-muted">Calibrated final in the CSV</span>
      </div>

      <p className="text-xs leading-5 text-muted">
        Offset = calibrated initial <span className="tabular-nums text-ink">{fmt(forensic.calibratedInitial)}</span> −
        uncalibrated initial <span className="tabular-nums text-ink">{fmt(forensic.uncalibratedInitial ?? 0)}</span>
        {blankInitial && ', blank, read as 0'}. NASA calibrated each reading by that day’s offset
        <Cite id="bass2.sensor.mca-offset" />
      </p>

      {claim?.verified && claim.quote && (
        <figure className="flex flex-col gap-1">
          <blockquote className="border-l-2 border-cyan pl-3 font-serif text-lg leading-7 text-ink">
            {claim.quote}
          </blockquote>
          <figcaption className="pl-3.5 text-xs leading-5 text-muted">
            NASA’s Appendix A row for <span className="test-id">{forensic.testId}</span>: calibrated initial, calibrated final, then the
            uncalibrated initial and final. Dashes are a blank reading.
            <Cite id={forensic.claimId} />
          </figcaption>
        </figure>
      )}

      {forensic.matches && forensic.appendixMatchesCsv && (
        <p className="flex items-center gap-2 text-xs text-emerald">
          <CircleCheck aria-hidden="true" className="size-3.5" />
          Reproduces the CSV’s value exactly
        </p>
      )}
    </div>
  )
}
