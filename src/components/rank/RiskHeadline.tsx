import type { ReactNode } from 'react'
import { leaderHeadline, TEST1_IGNITION_S, type ComponentKey, type Leaderboard, type Measured, type Weights } from '../../lib/risk'
import { Cite } from '../Cite'

/** The biggest factor in words, with its measured value and footnotes. */
function factorPhrase(factor: ComponentKey, measured: Measured): ReactNode {
  if (factor === 'lowO2') {
    return (
      <>
        it burned down to {measured.value.toFixed(1)}% oxygen (<span className="test-id">{measured.testId}</span>)
        <Cite id="rank.low-o2" />
      </>
    )
  }
  if (factor === 'coYield') {
    return (
      <>
        it made a median {measured.value.toFixed(1)} ppm CO per 1% CO2 <Cite id="rank.co-yield" />
      </>
    )
  }
  // The ignition gap is measured as t_s ÷ 25 s.
  return (
    <>
      it needs {(measured.value * TEST1_IGNITION_S).toFixed(1)} s of heating
      <Cite id="rank.solid-time" />, {measured.value.toFixed(1)} times the Earth test’s {TEST1_IGNITION_S} s igniter
      <Cite id="bass2.ign.test1-25s" />
    </>
  )
}

/**
 * The headline above the leaderboard, worked out by risk.leaderHeadline from the current weights:
 * who ranks riskiest, and the component that adds the most to its index. It changes with the
 * sliders, in place.
 */
export function RiskHeadline({ board, weights }: { board: Leaderboard; weights: Weights }) {
  const headline = leaderHeadline(board, weights)
  if (!headline) return null
  return (
    <p className="text-xl leading-7 tabular-nums">
      {headline.entity.label} ranks riskiest at these weights. Its biggest factor:{' '}
      {factorPhrase(headline.factor, headline.measured)}.
    </p>
  )
}
