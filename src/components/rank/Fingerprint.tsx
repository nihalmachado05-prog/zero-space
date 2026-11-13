import { motion, type Transition } from 'motion/react'
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { citePreview, getClaim } from '../../lib/claims'
import {
  COMPONENT_CLAIMS,
  COMPONENT_KEYS,
  COMPONENT_LABELS,
  MIN_BURN_CONFIRMED,
  TEST1_IGNITION_S,
  type ComponentKey,
  type RiskEntity,
  type Scores,
  type Weights,
} from '../../lib/risk'
import { useCitation } from '../citationContext'
import { useFootnoteNumber } from '../footnoteContext'
import { useHoverPreview } from '../useHoverPreview'
import { BarPreview } from './BarPreview'

/** Bar height and widest width, px. A bar's width follows its weight; its height is its score. */
const BAR_H = 44
const BAR_W = 5
/** The thinnest a bar gets (weight 0), and the shortest (score 0), as fractions. */
const MIN_WIDTH = 1 / BAR_W
const MIN_HEIGHT = 1 / BAR_H

/** Sentences the hover adds, worked out from the data by the leaderboard. Null hides one. */
export type FingerprintNotes = { lowO2: ReactNode | null; coYield: ReactNode | null }

export type FingerprintCell = { row: number; col: number }

type FingerprintProps = {
  entity: RiskEntity
  scores: Scores
  weights: Weights
  row: number
  /** The one bar on the leaderboard that is in the tab order (roving tabindex). */
  active: FingerprintCell
  onActivate: (cell: FingerprintCell) => void
  onArrow: (event: KeyboardEvent, cell: FingerprintCell) => void
  notes: FingerprintNotes
  move: Transition
}

/**
 * A row's risk fingerprint: three thin cyan bars, one per component. Height is the score and
 * brightness rises with it; width follows the component's weight, so a weight change morphs every
 * bar. A missing component is an empty outline labelled "Not measured". Each bar is its
 * component's citation: hover or focus previews the value, n tests and footnote; click opens it.
 */
export function Fingerprint({ entity, scores, weights, row, active, onActivate, onArrow, notes, move }: FingerprintProps) {
  const heaviest = Math.max(...COMPONENT_KEYS.map((key) => weights[key]))
  const missing = COMPONENT_KEYS.some((key) => !entity.components[key])
  return (
    <div className="flex items-end gap-3">
      <div role="group" aria-label={`Risk fingerprint, ${entity.label}`} className="flex items-end border-b border-line">
        {COMPONENT_KEYS.map((key, col) => (
          <Bar
            key={key}
            component={key}
            entity={entity}
            score={scores[key]}
            weight={weights[key]}
            heaviest={heaviest}
            cell={{ row, col }}
            tabbable={active.row === row && active.col === col}
            onActivate={onActivate}
            onArrow={onArrow}
            notes={notes}
            move={move}
          />
        ))}
      </div>
      {missing && <span className="pb-px text-xs leading-4 text-muted">Not measured</span>}
    </div>
  )
}

type BarProps = {
  component: ComponentKey
  entity: RiskEntity
  score: number | undefined
  weight: number
  heaviest: number
  cell: FingerprintCell
  tabbable: boolean
  onActivate: (cell: FingerprintCell) => void
  onArrow: (event: KeyboardEvent, cell: FingerprintCell) => void
  notes: FingerprintNotes
  move: Transition
}

function Bar({ component, entity, score, weight, heaviest, cell, tabbable, onActivate, onArrow, notes, move }: BarProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const claimId = COMPONENT_CLAIMS[component]
  const claim = getClaim(claimId)
  const number = useFootnoteNumber(claim?.verified ? claimId : null, ref)
  const { openCitation } = useCitation()
  const preview = useHoverPreview()
  const previewId = useId()
  const measured = entity.components[component]
  const shown = measured !== undefined && score !== undefined
  const widthFactor = heaviest > 0 ? Math.max(MIN_WIDTH, weight / heaviest) : MIN_WIDTH
  const lit = shown ? (0.3 + 0.7 * score) * (weight > 0 ? 1 : 0.35) : 0

  const label = COMPONENT_LABELS[component]
  const spoken = shown
    ? `${label}: ${valueWords(component, entity)}, score ${score.toFixed(2)}, weight ${weight.toFixed(2)}`
    : `${label}: not measured`

  return (
    <>
      <button
        ref={ref}
        type="button"
        data-fingerprint={`${cell.row}-${cell.col}`}
        tabIndex={tabbable ? 0 : -1}
        aria-label={`${spoken}. Footnote ${number ?? ''}, show source`}
        aria-describedby={preview.open ? previewId : undefined}
        aria-haspopup="dialog"
        onClick={() => {
          preview.hide(true)
          openCitation(claimId)
        }}
        {...preview.triggerProps}
        onFocus={(event) => {
          onActivate(cell)
          preview.triggerProps.onFocus(event)
        }}
        onKeyDown={(event) => {
          preview.triggerProps.onKeyDown(event)
          onArrow(event, cell)
        }}
        // The hit area is the whole 14 px slot, wider than the bar it draws.
        className="relative block w-3.5 cursor-pointer focus-visible:outline-offset-0"
        style={{ height: BAR_H }}
      >
        {shown ? (
          <motion.span
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 origin-bottom bg-cyan"
            style={{ width: BAR_W, height: BAR_H, marginLeft: -BAR_W / 2 }}
            initial={false}
            animate={{ scaleY: Math.max(MIN_HEIGHT, score), scaleX: widthFactor, opacity: lit }}
            transition={move}
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 border border-muted/70"
            style={{ width: BAR_W + 2, height: BAR_H, marginLeft: -(BAR_W + 2) / 2 }}
          />
        )}
      </button>
      {preview.open && (
        <BarPreview id={previewId} anchor={ref} {...preview.previewProps}>
          <p className="font-semibold">
            {label}
            {number !== undefined && <sup className="ml-0.5 font-semibold text-cyan">{number}</sup>}
          </p>
          {shown ? (
            <>
              <p className="tabular-nums">{valueLine(component, entity)}</p>
              <p className="text-muted tabular-nums">
                Score {score.toFixed(2)} of 1, weight {weight.toFixed(2)}
              </p>
              {component === 'lowO2' && notes.lowO2 && <p className="text-muted">{notes.lowO2}</p>}
              {component === 'coYield' && notes.coYield && <p className="text-muted">{notes.coYield}</p>}
            </>
          ) : (
            <p>Not measured: {missingReason(component)}</p>
          )}
          {claim && (
            <p className="text-muted">
              {citePreview(claim)}. Click or press Enter for the source.
            </p>
          )}
        </BarPreview>
      )}
    </>
  )
}

/** The measured value and the n tests behind it, in a line of the hover. */
function valueLine(component: ComponentKey, entity: RiskEntity): ReactNode {
  const measured = entity.components[component]
  if (!measured) return null
  if (component === 'lowO2') {
    return (
      <>
        Lowest final O2 {measured.value.toFixed(1)}% (<span className="test-id">{measured.testId}</span>), over{' '}
        {measured.n} burn-confirmed tests
      </>
    )
  }
  if (component === 'coYield') {
    return (
      <>
        Median {measured.value.toFixed(1)} ppm CO per 1% CO2, over {measured.n} burn-confirmed tests
      </>
    )
  }
  const tsS = measured.value * TEST1_IGNITION_S
  return (
    <>
      t<sub>s</sub> {tsS.toFixed(1)} s, {measured.value.toFixed(2)} times Test 1’s {TEST1_IGNITION_S} s. From the rod’s
      diameter, not from tests
    </>
  )
}

/** The same, for screen readers, without markup. */
function valueWords(component: ComponentKey, entity: RiskEntity): string {
  const measured = entity.components[component]
  if (!measured) return 'not measured'
  if (component === 'lowO2') return `lowest final O2 ${measured.value.toFixed(1)}% in test ${measured.testId}, ${measured.n} tests`
  if (component === 'coYield') return `median ${measured.value.toFixed(1)} ppm CO per 1% CO2, ${measured.n} tests`
  return `t_s ${(measured.value * TEST1_IGNITION_S).toFixed(1)} seconds, from the rod's diameter`
}

function missingReason(component: ComponentKey): string {
  if (component === 'ignitionGap') return 'the ignition gap is for rods only.'
  return `fewer than ${MIN_BURN_CONFIRMED} burn-confirmed tests.`
}
