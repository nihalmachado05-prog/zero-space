import { useMemo } from 'react'
import { Note } from '../components/Note'
import type { FingerprintNotes } from '../components/rank/Fingerprint'
import { FlammabilityMap } from '../components/rank/FlammabilityMap'
import { IgnitionRace } from '../components/rank/IgnitionRace'
import { Leaderboard } from '../components/rank/Leaderboard'
import { NotRanked } from '../components/rank/NotRanked'
import type { Bass2Row } from '../lib/audit'
import { useAuditData } from '../lib/bass2Data'
import { rodRug } from '../lib/rankCharts'
import { useWeights } from '../lib/rankStore'
import {
  familyFlows,
  leaderboard,
  lowestO2Tested,
  riskEntities,
  unrankedGroups,
  type RiskEntity,
  type UnrankedGroup,
} from '../lib/risk'

/** #/rank : F3 Orbital Risk Index, flammability map, ignition race. Receives `params` but reads none yet. */
export function Rank() {
  const data = useAuditData()
  return (
    <div className="min-h-full bg-window">
      <h1 className="sr-only">Rank</h1>
      {data.status === 'loading' && <Note className="p-6">Loading NASA’s test table…</Note>}
      {data.status === 'error' && <p className="p-6 text-sm text-red">Couldn’t load the test table: {data.message}</p>}
      {data.status === 'ready' && <RankStage rows={data.bass2.rows} />}
    </div>
  )
}

/**
 * One pure black stage, in the Overview's language: no cards, borders or shadows. The first
 * screen holds the leaderboard, its sliders and what isn't ranked; the map and the race sit below.
 */
function RankStage({ rows }: { rows: Bass2Row[] }) {
  const entities = useMemo(() => riskEntities(rows), [rows])
  const groups = useMemo(() => unrankedGroups(entities, rows), [entities, rows])
  const rug = useMemo(() => rodRug(rows), [rows])
  const notes = useMemo(() => fingerprintNotes(rows, entities), [rows, entities])

  return (
    <div className="@container/rank flex flex-col gap-16 px-6 pt-6 pb-16">
      <RiskIndex entities={entities} groups={groups} notes={notes} />
      <div className="grid gap-16 @min-[1100px]/rank:grid-cols-2 @min-[1100px]/rank:gap-12">
        <FlammabilityMap rug={rug} />
        <IgnitionRace />
      </div>
    </div>
  )
}

/**
 * The leaderboard and what isn't ranked: the only part of the view that hears about the weights,
 * so a weight change never re-renders the map or the race.
 */
function RiskIndex({
  entities,
  groups,
  notes,
}: {
  entities: RiskEntity[]
  groups: UnrankedGroup[]
  notes: FingerprintNotes
}) {
  const weights = useWeights()
  const board = useMemo(() => leaderboard(entities, weights), [entities, weights])
  return (
    <div className="grid gap-12 @min-[1000px]/rank:grid-cols-[minmax(0,1fr)_19rem]">
      <Leaderboard board={board} weights={weights} notes={notes} />
      <NotRanked groups={groups} unscored={board.unscored} />
    </div>
  )
}

/** The sentences the fingerprint hovers add, each only if the data bears it out. */
function fingerprintNotes(rows: Bass2Row[], entities: RiskEntity[]): FingerprintNotes {
  const slabFloor = lowestO2Tested(rows, 'slab')
  const slabFlows = familyFlows(entities, 'slab')
  const rodFlows = familyFlows(entities, 'rod')
  return {
    lowO2:
      slabFloor === null ? null : (
        <>
          Lowest O2 where BASS-II saw it burn. This depends on what was tested: slabs were never tested below{' '}
          {slabFloor.toFixed(1)}%.
        </>
      ),
    coYield:
      slabFlows.length === 1 && slabFlows[0] === 'Opposed' && rodFlows.length > 1
        ? 'Slabs were only tested in opposed flow; rods mix flow directions.'
        : null,
  }
}
