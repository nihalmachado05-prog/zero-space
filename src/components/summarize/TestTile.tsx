import { motion, type Transition } from 'motion/react'
import type { Ref } from 'react'
import { severityOf, type Bass2Row } from '../../lib/audit'
import { FlowGlyph, StatusGlyph } from './glyphs'

/** The faint red glow of a quarantined tile. A shadow, so it never takes a click. */
const QUARANTINE_GLOW = '0 0 10px 1px rgb(239 68 68 / 0.45), 0 0 0 1px rgb(239 68 68 / 0.35)'

type TestTileProps = {
  row: Bass2Row
  /** Initial O2 on the cyan scale. */
  fill: string
  /** Not matched by the filters: dimmed in place. */
  dimmed: boolean
  /** The flight between wall and bay (motion's shared layout), for this tile's destination. */
  flight: Transition
  /** Changes when the quarantine toggles: the only time a tile measures for a flight. */
  layoutKey: boolean
  label: string
  tabIndex?: number
  buttonRef?: Ref<HTMLButtonElement>
  onClick: () => void
  onFocus?: () => void
  onPointerEnter?: () => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
}

/**
 * One test: a small square, its id in mono, its fill only from data (initial O2). Corner marks
 * give its flow direction (bottom left) and most serious flag (top right). The same tile, by
 * its layoutId, flies between the wall and the quarantine bay.
 */
export function TestTile({
  row,
  fill,
  dimmed,
  flight,
  layoutKey,
  label,
  tabIndex,
  buttonRef,
  onClick,
  onFocus,
  onPointerEnter,
  onKeyDown,
}: TestTileProps) {
  const severity = severityOf(row.flags)
  return (
    <motion.button
      ref={buttonRef}
      type="button"
      layoutId={`tile-${row.testId}`}
      layoutDependency={layoutKey}
      transition={flight}
      tabIndex={tabIndex}
      aria-label={label}
      data-test-id={row.testId}
      onClick={onClick}
      onFocus={onFocus}
      onPointerEnter={onPointerEnter}
      onKeyDown={onKeyDown}
      style={{ backgroundColor: fill, boxShadow: severity === 'quarantined' ? QUARANTINE_GLOW : 'none' }}
      className={`num relative grid size-9 shrink-0 @min-[1300px]/stage:size-10 cursor-pointer place-items-center text-xs leading-none text-ink transition-opacity duration-200 after:pointer-events-none after:absolute after:inset-0 after:border after:border-transparent hover:after:border-ink/70 ${
        dimmed ? 'opacity-[0.18]' : 'opacity-100'
      } ${severity === 'quarantined' ? 'z-10' : ''}`}
    >
      {row.testId}
      <StatusGlyph severity={severity} className="absolute top-1 right-1" />
      <FlowGlyph flow={row.flowConfig} className="absolute bottom-1 left-1 text-ink/70" />
    </motion.button>
  )
}
