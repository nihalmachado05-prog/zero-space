import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import type { Leaderboard as Board } from '../../lib/risk'
import { coverage, COMPONENT_KEYS, type Weights } from '../../lib/risk'
import { Cite } from '../Cite'
import { Fingerprint, type FingerprintCell, type FingerprintNotes } from './Fingerprint'
import { useReorder } from './reorder'
import { WeightSliders } from './WeightSliders'

/** Every row is this tall, so the still rank numerals line up with the rows sliding past them. */
const ROW_H = 'h-14'

type LeaderboardProps = {
  board: Board
  weights: Weights
  notes: FingerprintNotes
}

/**
 * F3a: the Orbital Risk Index leaderboard. The rank numerals stand still in their own column;
 * when a weight changes, the rows slide past them to their new places and the fingerprint bars
 * morph (the signature motion). Nothing else moves. Arrow keys step through the fingerprint bars,
 * up and down the rows and across the components.
 */
export function Leaderboard({ board, weights, notes }: LeaderboardProps) {
  const { move, fade } = useReorder()
  const listRef = useRef<HTMLOListElement>(null)
  const [active, setActive] = useState<FingerprintCell>({ row: 0, col: 0 })
  const rows = board.rows

  const onArrow = useCallback(
    (event: KeyboardEvent, cell: FingerprintCell) => {
      const step: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      const delta = step[event.key]
      if (!delta) return
      event.preventDefault()
      const row = Math.min(rows.length - 1, Math.max(0, cell.row + delta[0]))
      const col = Math.min(COMPONENT_KEYS.length - 1, Math.max(0, cell.col + delta[1]))
      listRef.current?.querySelector<HTMLElement>(`[data-fingerprint="${row}-${col}"]`)?.focus()
    },
    [rows.length],
  )

  // A row that leaves (no longer scored) can take the tab stop with it; fall back to the top.
  const tabCell = active.row < rows.length ? active : { row: 0, col: active.col }

  return (
    <section aria-labelledby="risk-heading" className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="risk-heading" className="text-xl leading-7 font-semibold">
          Orbital Risk Index
          <Cite id="rank.index" />
        </h2>
        <p className="text-sm leading-5 text-muted">
          ZERO-DRAFT Orbital Risk Index: our composite of measured BASS-II indicators. Not a NASA rating.
        </p>
        <p className="text-sm leading-5 text-muted">
          Index = 100 × Σ w<sub>i</sub>c<sub>i</sub> ÷ Σ w<sub>i</sub>, over the components each sample type has.
          Each score c<sub>i</sub> runs from 0 to 1, with 1 the riskiest.
        </p>
      </div>

      <WeightSliders weights={weights} />

      <div className="flex gap-2">
        {/* The rank numerals: still, while the rows slide past. The list itself says the rank. */}
        <div aria-hidden="true" className="flex w-16 shrink-0 flex-col">
          {rows.map((row, i) => (
            <span
              key={i}
              className={`num flex ${ROW_H} items-center text-[2.5rem] leading-none ${i === 0 ? 'text-ink' : 'text-muted'}`}
            >
              {row.rank}
            </span>
          ))}
        </div>
        <ol ref={listRef} aria-label="Sample types, riskiest first" className="relative min-w-0 flex-1">
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map((row, i) => {
              const { measured, of } = coverage(row.entity)
              return (
                <motion.li
                  key={row.entity.id}
                  layout="position"
                  transition={{ layout: move, opacity: fade }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`grid ${ROW_H} grid-cols-[minmax(0,15rem)_7rem_auto] items-center gap-x-8`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-base leading-6">
                      <span className="sr-only">Rank {row.rank}: </span>
                      {row.entity.label}
                    </p>
                    <p className="text-xs leading-4 text-muted tabular-nums">
                      {row.entity.tests} tests, {measured} of {of} components measured
                    </p>
                  </div>
                  <p className="num text-right text-[2rem] leading-none">
                    <span className="sr-only">Index </span>
                    {row.index.toFixed(1)}
                  </p>
                  <Fingerprint
                    entity={row.entity}
                    scores={row.scores}
                    weights={weights}
                    row={i}
                    active={tabCell}
                    onActivate={setActive}
                    onArrow={onArrow}
                    notes={notes}
                    move={move}
                  />
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ol>
      </div>
    </section>
  )
}
