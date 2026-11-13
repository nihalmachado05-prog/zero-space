import { useMemo, useRef } from 'react'
import {
  Line,
  LineChart,
  ReferenceLine,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from 'recharts'
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
const AXIS_TITLE = { fontSize: 12, fill: 'var(--color-muted)', fontFamily: 'var(--font-sans)' }
/** The blowoff branch of Eq. 6.1 at zero stretch: the report's conservative space limit. */
const BLOWOFF_AT_ZERO_PCT = blowoffBranch(0)
/** Where the labels that sit on the two straight lines start, cm/s. */
const LABEL_FROM_CM_S = 0.62

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
 * lines, and a dot at the current oxygen and airflow. Each line is labeled where it is drawn, so
 * there is no legend. The chart re-renders only when the rod changes; the dot is moved through a
 * ref every frame.
 */
export function Eq61Inset() {
  const rodMm = useTwin((state) => state.rodMm)
  const data = useMemo(() => limitCurve(rodMm), [rodMm])
  return (
    <Panel label="Orbit limit against airflow" className="h-44 w-[31rem] shrink-0">
      <LineChart
        responsive
        data={data}
        accessibilityLayer={false}
        margin={{ top: 10, right: 14, bottom: 4, left: 4 }}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label="Chart: the Eq. 6.1 oxygen limit for the selected rod against airflow, with the 15.4% Earth limit, the 13.4% line and a dot at the current oxygen and airflow."
      >
        <XAxis
          dataKey="flow"
          type="number"
          scale="log"
          domain={[FLOW_RANGE_CM_S.min, FLOW_RANGE_CM_S.max]}
          ticks={FLOW_TICKS}
          interval={0}
          height={38}
          tick={TICK}
          tickSize={4}
          stroke="var(--color-line)"
          label={{ value: 'Airflow, cm/s', position: 'insideBottom', offset: 0, ...AXIS_TITLE }}
        />
        <YAxis
          type="number"
          domain={[O2_RANGE_PCT.min, O2_RANGE_PCT.max]}
          ticks={O2_TICKS}
          interval={0}
          width={46}
          tick={TICK}
          tickSize={4}
          stroke="var(--color-line)"
          label={{
            value: 'Oxygen, %',
            angle: -90,
            position: 'insideLeft',
            offset: 12,
            style: { textAnchor: 'middle' },
            ...AXIS_TITLE,
          }}
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
        <LineLabels curveStartPct={data[0].limit} />
        <NowDot />
      </LineChart>
    </Panel>
  )
}

/** The three line labels, written on the plot beside the lines they name, each with its footnote. */
function LineLabels({ curveStartPct }: { curveStartPct: number }) {
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  const plot = usePlotArea()
  const left = xScale?.(LABEL_FROM_CM_S)
  const earthY = yScale?.(EARTH_LIMIT_O2_PCT)
  const blowoffY = yScale?.(BLOWOFF_AT_ZERO_PCT)
  const curveY = yScale?.(curveStartPct)
  if (!plot || left === undefined || earthY === undefined || blowoffY === undefined || curveY === undefined) {
    return null
  }
  const fromBottom = (y: number) => plot.y + plot.height - y
  return (
    <foreignObject x={plot.x} y={plot.y} width={plot.width} height={plot.height}>
      <div className="relative size-full text-xs leading-4 whitespace-nowrap text-ink">
        {/* The curve's label sits above its high left end; the Earth label keeps to the right,
            clear of the dot's usual place and of the curve's rise at the far right. */}
        <p className="absolute left-1.5" style={{ bottom: fromBottom(curveY) + 4 }}>
          Orbit limit, Eq. 6.1, model
          <Cite id="twin.orbit-limit" />
        </p>
        <p className="absolute right-12" style={{ bottom: fromBottom(earthY) + 2 }}>
          Earth limit <span className="num">{EARTH_LIMIT_O2_PCT.toFixed(1)}%</span>{' '}
          <Cite id="bass2.flam.vs-1g" />
        </p>
        <p className="absolute" style={{ left: left - plot.x, top: blowoffY - plot.y + 1 }}>
          <span className="num">{BLOWOFF_AT_ZERO_PCT.toFixed(1)}%</span>, blowoff branch at zero stretch,
          model
          <Cite id="bass2.flam.derate" />
        </p>
      </div>
    </foreignObject>
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
    // Off the plot until the first frame places it.
    <g ref={ref} pointerEvents="none" transform="translate(-99 -99)">
      <circle r={7} fill="none" stroke="var(--color-cyan)" strokeOpacity={0.4} />
      <circle r={3} fill="var(--color-cyan)" />
      <text x={11} y={4} fontSize={12} fill="var(--color-ink)" fontFamily="var(--font-sans)">
        now
      </text>
    </g>
  )
}
