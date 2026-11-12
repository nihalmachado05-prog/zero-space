import { useMemo, useRef, type ReactNode } from 'react'
import { Line, LineChart, ReferenceLine, useXAxisScale, useYAxisScale, XAxis, YAxis } from 'recharts'
import { useTwin } from '../../lib/burnStore'
import { FLOW_RANGE_CM_S, O2_RANGE_PCT } from '../../lib/burnTwin'
import { blowoffBranch, EARTH_LIMIT_O2_PCT, o2LimitPct, type RodMm } from '../../lib/physics'
import { Cite } from '../Cite'
import { Panel } from '../Panel'
import { useTwinFrame } from './twinFrame'

const CURVE_STEPS = 72
const FLOW_TICKS = [0.2, 1, 2, 10, 40]
const O2_TICKS = [13, 15, 17, 19, 21, 23]
const TICK = { fontSize: 12, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }
/** The blowoff branch of Eq. 6.1 at zero stretch: the report's conservative space limit. */
const BLOWOFF_AT_ZERO_PCT = blowoffBranch(0)

/** Eq. 6.1 as O2 limit against flow for one rod, on evenly spaced log steps of flow. */
function limitCurve(rodMm: RodMm) {
  const ratio = FLOW_RANGE_CM_S.max / FLOW_RANGE_CM_S.min
  return Array.from({ length: CURVE_STEPS + 1 }, (_, step) => {
    const flow = FLOW_RANGE_CM_S.min * Math.pow(ratio, step / CURVE_STEPS)
    return { flow, limit: o2LimitPct(flow, rodMm) }
  })
}

/**
 * The Eq. 6.1 inset: the orbit limit against airflow for the selected rod, the 15.4 % and 13.4 %
 * lines, and a dot at the current oxygen and airflow. The chart re-renders only when the rod
 * changes; the dot is moved through a ref every frame.
 */
export function Eq61Inset() {
  const rodMm = useTwin((state) => state.rodMm)
  const data = useMemo(() => limitCurve(rodMm), [rodMm])
  return (
    <Panel label="Orbit limit against airflow" className="h-[9.5rem] w-[29rem] shrink-0">
      <div className="flex h-full">
        <div
          role="img"
          aria-label="Chart: the Eq. 6.1 oxygen limit for the selected rod against airflow, with the 15.4% Earth limit, the 13.4% line and a dot at the current oxygen and airflow."
          className="h-full w-[16.5rem] shrink-0"
        >
          <LineChart
            responsive
            data={data}
            accessibilityLayer={false}
            margin={{ top: 10, right: 12, bottom: 2, left: 2 }}
            style={{ width: '100%', height: '100%' }}
          >
            <XAxis
              dataKey="flow"
              type="number"
              scale="log"
              domain={[FLOW_RANGE_CM_S.min, FLOW_RANGE_CM_S.max]}
              ticks={FLOW_TICKS}
              interval={0}
              height={24}
              tick={TICK}
              tickSize={4}
              stroke="var(--color-line)"
            />
            <YAxis
              type="number"
              domain={[O2_RANGE_PCT.min, O2_RANGE_PCT.max]}
              ticks={O2_TICKS}
              interval={0}
              width={30}
              tick={TICK}
              tickSize={4}
              stroke="var(--color-line)"
            />
            <ReferenceLine y={EARTH_LIMIT_O2_PCT} stroke="var(--color-amber)" strokeDasharray="5 3" />
            <ReferenceLine y={BLOWOFF_AT_ZERO_PCT} stroke="var(--color-cyan)" strokeDasharray="1 3" />
            <Line
              dataKey="limit"
              type="linear"
              stroke="var(--color-cyan)"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <NowDot />
          </LineChart>
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1 py-2 pr-3 text-xs leading-4">
          <h3 className="font-semibold">Orbit limit against airflow</h3>
          <LegendRow swatch={<span className="h-px w-4 bg-cyan" />}>
            Eq. 6.1 for this rod, model
            <Cite id="bass2.flam.eq61-branches" />
          </LegendRow>
          <LegendRow swatch={<span className="w-4 border-t border-dashed border-amber" />}>
            Earth limit <span className="num">{EARTH_LIMIT_O2_PCT.toFixed(1)}%</span>
            <Cite id="bass2.flam.vs-1g" />
          </LegendRow>
          <LegendRow swatch={<span className="w-4 border-t border-dotted border-cyan" />}>
            <span className="num">{BLOWOFF_AT_ZERO_PCT.toFixed(1)}%</span>, blowoff branch at zero
            stretch, model
            <Cite id="bass2.flam.derate" />
          </LegendRow>
          <LegendRow swatch={<span className="mx-1 size-2 rounded-full bg-cyan" />}>
            Oxygen and airflow now
          </LegendRow>
          <p className="text-muted">Across: airflow U, cm/s. Up: oxygen, %.</p>
        </div>
      </div>
    </Panel>
  )
}

function LegendRow({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2">
      <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center">
        {swatch}
      </span>
      <span>{children}</span>
    </p>
  )
}

/** The dot at the current oxygen and airflow. It moves by an SVG attribute, never by a re-render. */
function NowDot() {
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  const ref = useRef<SVGGElement>(null)
  useTwinFrame((frame) => {
    const x = xScale?.(frame.flowCmS)
    const y = yScale?.(frame.o2Pct)
    if (!ref.current || x === undefined || y === undefined) return
    const transform = `translate(${x.toFixed(1)} ${y.toFixed(1)})`
    if (ref.current.getAttribute('transform') !== transform) {
      ref.current.setAttribute('transform', transform)
    }
  })
  return (
    <g ref={ref} pointerEvents="none">
      <circle r={7} fill="none" stroke="var(--color-cyan)" strokeOpacity={0.4} />
      <circle r={3} fill="var(--color-cyan)" />
    </g>
  )
}
