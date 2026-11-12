// The orbit flame: a dome of light over the nose of a rod that faces into the airflow. An
// illustration, not data, shaped after NASA's photos of near-limit BASS-II flames (Fig. 6.3 of the
// BASS-II Summary Report, PDF p. 78): a thin bright blue shell standing off the tip, a translucent
// blue fill inside it, and a flat trailing edge where the flame stops along the rod.
// The Burn Twin uses it now; the INTERPRET simulator (M5) reuses it.
import { EQ61_MINIMUM } from '../lib/physics'
import { clamp01, glow, smoothstep } from './noise'

export interface StagnationFlameShape {
  /** Gap from the rod's nose, upstream, to the front of the shell, px. */
  standoff: number
  /** Half the flame's width across the flow, px. */
  halfWidth: number
  /** How far the flame reaches downstream of the nose, px. */
  tail: number
  /** 0 at the limit … 1 well above it. Sets the size. */
  vigor: number
  /** 0 translucent all-blue … 1 yellow-white. */
  heat: number
}

export interface StagnationFlameInput {
  /** The rod's nose, where the flow stagnates. The flow runs toward +x and the rod lies at x > 0. */
  x: number
  y: number
  shape: StagnationFlameShape
  /** 0 dark … 1 fully lit. Fades and the 1.1 Hz pulse come in here. */
  intensity: number
}

const MIN_FLATTEN = 0.4
const MAX_FLATTEN = 1.5
/** Where the shell's brightest ring sits, as a fraction of its gradient's radius. */
const SHELL_AT = 0.88

/**
 * Turns model state into the drawn shape. The proportions at zero margin are measured off
 * Fig. 6.3 (a) to (c). The rest is illustration:
 * - a bigger margin above the Eq. 6.1 limit gives a bigger, hotter flame;
 * - a higher stretch rate (more flow) flattens the dome against the tip.
 */
export function stagnationFlameShape(p: {
  /** Drawn radius of the 6.35 mm rod, px. */
  unit: number
  /** Drawn radius of this rod, px. */
  rodRadius: number
  /** Stretch rate a, 1/s. */
  stretchRate: number
  /** Points of O2 above the Eq. 6.1 limit. */
  marginPts: number
}): StagnationFlameShape {
  const margin = Math.max(0, p.marginPts)
  const vigor = 1 - Math.exp(-margin / 1.4)
  const heat = smoothstep(1, 3.2, margin)
  const thicker = p.rodRadius / p.unit - 1
  const flatten = Math.min(
    MAX_FLATTEN,
    Math.max(MIN_FLATTEN, Math.pow(EQ61_MINIMUM.a / Math.max(p.stretchRate, 1e-3), 0.4)),
  )
  const gap = p.unit * (2.6 + 0.8 * thicker + 0.9 * vigor) * (0.55 + 0.45 * flatten)
  return {
    standoff: p.unit * (2 + 0.35 * vigor) * flatten,
    halfWidth: p.rodRadius + gap,
    tail: p.unit * (2.35 + 4.6 * thicker + 1.8 * vigor),
    vigor,
    heat,
  }
}

/** The box that holds the flame's shell, relative to the nose. The annotation bracket tracks it. */
export function stagnationFlameBounds(shape: StagnationFlameShape) {
  return { left: -shape.standoff, right: shape.tail, top: -shape.halfWidth, bottom: shape.halfWidth }
}

// The flame is drawn on its own small canvas first, so its trailing edge can be faded with a
// mask, and then added to the stage as light.
let layer: HTMLCanvasElement | null = null

export function drawStagnationFlame(ctx: CanvasRenderingContext2D, input: StagnationFlameInput): void {
  const light = clamp01(input.intensity)
  if (light <= 0.003) return
  const { standoff, halfWidth, tail, vigor, heat } = input.shape
  const scale = ctx.getTransform().a
  const pad = 28
  const left = standoff + pad
  const right = tail * (1 + 0.6 * heat) + pad
  const half = halfWidth + pad
  const width = Math.ceil((left + right) * scale)
  const height = Math.ceil(half * 2 * scale)

  layer ??= document.createElement('canvas')
  if (layer.width < width) layer.width = width
  if (layer.height < height) layer.height = height
  const g = layer.getContext('2d')
  if (!g) return
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.globalCompositeOperation = 'source-over'
  g.clearRect(0, 0, layer.width, layer.height)
  // From here the nose is at (0, 0) and the flow runs toward +x.
  g.setTransform(scale, 0, 0, scale, left * scale, half * scale)
  g.globalCompositeOperation = 'lighter'

  // The shell and its fill: half an ellipse whose centre is on the trailing edge.
  const along = tail + standoff
  g.save()
  g.beginPath()
  g.rect(-left, -half, left + tail, half * 2)
  g.clip()
  g.translate(tail, 0)
  // The brightest part of the shell sits at SHELL_AT of the gradient's radius; the rest of the
  // radius is the soft falloff outside it.
  g.scale(along / SHELL_AT, halfWidth / SHELL_AT)
  const cool = 1 - 0.35 * heat
  const shell = g.createRadialGradient(0, 0, 0, 0, 0, 1)
  shell.addColorStop(0, `rgba(34,84,214,${0.22 * light * cool})`)
  shell.addColorStop(0.5, `rgba(38,96,224,${0.3 * light * cool})`)
  shell.addColorStop(0.74, `rgba(48,122,240,${0.42 * light})`)
  shell.addColorStop(0.845, `rgba(96,188,255,${0.92 * light})`)
  shell.addColorStop(SHELL_AT, `rgba(156,222,255,${light})`)
  shell.addColorStop(0.915, `rgba(72,156,255,${0.6 * light})`)
  shell.addColorStop(0.96, `rgba(26,72,220,${0.14 * light})`)
  shell.addColorStop(1, 'rgba(26,72,220,0)')
  g.fillStyle = shell
  g.beginPath()
  g.arc(0, 0, 1, 0, Math.PI * 2)
  g.fill()
  g.restore()

  // The trailing edge. Near the limit it is flat and crisp, as in Fig. 6.3; a hotter flame
  // thins out gradually along the rod instead.
  const edge = 9 + 3 * vigor + 0.5 * tail * heat
  const mask = g.createLinearGradient(tail - edge, 0, tail, 0)
  mask.addColorStop(0, 'rgba(0,0,0,1)')
  mask.addColorStop(1, 'rgba(0,0,0,0)')
  g.globalCompositeOperation = 'destination-in'
  g.fillStyle = mask
  g.fillRect(-left, -half, left + right, half * 2)
  g.globalCompositeOperation = 'lighter'

  // Well above the limit the inside glows yellow-white and trails along the rod. It stays
  // behind the blue shell: nothing hot shows upstream of the flame front.
  if (heat > 0.01) {
    const hot = heat * light
    const reach = tail * (0.55 + 0.45 * heat)
    g.save()
    g.beginPath()
    g.ellipse(tail, 0, along * 0.97, halfWidth * 0.97, 0, Math.PI / 2, (Math.PI * 3) / 2)
    g.lineTo(tail + right, -halfWidth)
    g.lineTo(tail + right, halfWidth)
    g.closePath()
    g.clip()
    glow(g, reach * 0.55, 0, reach * 1.1 + standoff * 0.75, halfWidth * 0.86, '255,116,30', 0.3 * hot, 'body')
    glow(g, reach * 0.35, 0, reach * 0.8 + standoff * 0.6, halfWidth * 0.62, '255,190,82', 0.36 * hot, 'body')
    glow(g, reach * 0.1, 0, reach * 0.45 + standoff * 0.5, halfWidth * 0.38, '255,240,210', 0.38 * hot)
    g.restore()
  }

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  // A wide, faint aura, so the flame lights the dark around it.
  glow(ctx, input.x + tail * 0.25, input.y, along * 1.7, halfWidth * 1.8, '28,84,255', 0.2 * light)
  ctx.drawImage(
    layer,
    0,
    0,
    width,
    height,
    input.x - left,
    input.y - half,
    width / scale,
    height / scale,
  )
  ctx.restore()
}

/**
 * What is left when the orbit flame goes out: a faint round haze that stays where it is,
 * because without buoyancy nothing carries it up.
 */
export function drawHalo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
): void {
  glow(ctx, x, y, radius, radius, '150,170,205', 0.1 * clamp01(alpha))
  glow(ctx, x, y, radius * 0.55, radius * 0.55, '170,185,215', 0.07 * clamp01(alpha))
}
