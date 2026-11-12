// A PMMA rod with a rounded nose, seen in the dark. An illustration, not to scale. It is nearly
// invisible until its flame lights it: a highlight near the nose that fades with the flame.
import { clamp01 } from './noise'

export interface RodInput {
  /** The nose of the rod. */
  x: number
  y: number
  /** The direction the rod runs away from its nose, radians: 0 is toward +x, π/2 is down. */
  angle: number
  radius: number
  length: number
  /** Light falling on the rod from its flame. */
  light?: {
    /** "r,g,b" */
    rgb: string
    /** 0 none … 1 full. */
    intensity: number
    /** How far along the rod the light reaches, px. */
    reach: number
  }
}

function rodPath(ctx: CanvasRenderingContext2D, radius: number, length: number) {
  ctx.beginPath()
  ctx.moveTo(radius, -radius)
  ctx.lineTo(length, -radius)
  ctx.lineTo(length, radius)
  ctx.lineTo(radius, radius)
  ctx.arc(radius, 0, radius, Math.PI / 2, (Math.PI * 3) / 2)
  ctx.closePath()
}

/** Draw it after the flame: the rod sits inside the light, so it dims what is behind it. */
export function drawRod(ctx: CanvasRenderingContext2D, rod: RodInput): void {
  const { radius, length } = rod
  ctx.save()
  ctx.translate(rod.x, rod.y)
  ctx.rotate(rod.angle)

  // The body: dark, and half see-through, so the flame behind it shows faintly (as in Fig. 6.3).
  rodPath(ctx, radius, length)
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = 'rgba(5,6,8,0.5)'
  ctx.fill()

  // A cylinder's own faint sheen: brighter at the edges, one thin streak off-centre.
  ctx.globalCompositeOperation = 'lighter'
  const sheen = ctx.createLinearGradient(0, -radius, 0, radius)
  sheen.addColorStop(0, 'rgba(217,214,207,0.1)')
  sheen.addColorStop(0.1, 'rgba(217,214,207,0.025)')
  sheen.addColorStop(0.27, 'rgba(217,214,207,0.07)')
  sheen.addColorStop(0.4, 'rgba(217,214,207,0.015)')
  sheen.addColorStop(0.9, 'rgba(217,214,207,0.02)')
  sheen.addColorStop(1, 'rgba(217,214,207,0.08)')
  ctx.fillStyle = sheen
  ctx.fill()

  const level = clamp01(rod.light?.intensity ?? 0)
  if (rod.light && level > 0.003) {
    const { rgb, reach } = rod.light
    ctx.save()
    ctx.clip()
    // Light pooling on the nose and falling off along the rod.
    ctx.translate(radius * 0.4, 0)
    ctx.scale(reach, radius * 2.4)
    const lit = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    lit.addColorStop(0, `rgba(${rgb},${0.2 * level})`)
    lit.addColorStop(0.22, `rgba(${rgb},${0.09 * level})`)
    lit.addColorStop(0.55, `rgba(${rgb},${0.03 * level})`)
    lit.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = lit
    ctx.fillRect(-1, -1, 2, 2)
    ctx.restore()

    // The lit rim, so the rod's outline reads near the flame and fades into the dark.
    const rim = ctx.createLinearGradient(0, 0, reach, 0)
    rim.addColorStop(0, `rgba(${rgb},${0.3 * level})`)
    rim.addColorStop(1, `rgba(${rgb},0)`)
    rodPath(ctx, radius, length)
    ctx.strokeStyle = rim
    ctx.lineWidth = 1
    ctx.stroke()
  }
  ctx.restore()
}
