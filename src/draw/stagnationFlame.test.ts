import { describe, expect, it } from 'vitest'
import { stretchRate } from '../lib/physics'
import { stagnationFlameBounds, stagnationFlameShape } from './stagnationFlame'

const unit = 21
const at = (marginPts: number, flowCmS = 2, rodMm = 6.35) =>
  stagnationFlameShape({
    unit,
    rodRadius: (unit * rodMm) / 6.35,
    stretchRate: stretchRate(flowCmS, rodMm),
    marginPts,
  })

// The drawn shape is an illustration, but it must follow the model the way SPEC F1 says.
describe('stagnationFlameShape', () => {
  it('shrinks as the margin to the limit shrinks', () => {
    const margins = [3.4, 2, 1, 0.5, 0.1, 0]
    for (let i = 1; i < margins.length; i++) {
      const bigger = at(margins[i - 1])
      const smaller = at(margins[i])
      expect(smaller.halfWidth).toBeLessThan(bigger.halfWidth)
      expect(smaller.tail).toBeLessThan(bigger.tail)
      expect(smaller.standoff).toBeLessThan(bigger.standoff)
    }
  })

  it('is yellow-white well above the limit and all-blue near it', () => {
    expect(at(3.39).heat).toBe(1)
    expect(at(1).heat).toBe(0)
    expect(at(0.1).heat).toBe(0)
    expect(at(2).heat).toBeGreaterThan(0)
    expect(at(2).heat).toBeLessThan(1)
  })

  it('flattens against the tip as the airflow rises', () => {
    expect(at(1, 20).standoff).toBeLessThan(at(1, 2).standoff)
    expect(at(1, 40).standoff).toBeLessThan(at(1, 20).standoff)
    expect(at(1, 20).halfWidth).toBeLessThan(at(1, 2).halfWidth)
  })

  it('still has a size at the limit and below it, so the bracket never collapses', () => {
    expect(at(0).halfWidth).toBeGreaterThan(unit)
    expect(at(-3)).toEqual(at(0))
  })

  it('matches the proportions of the 6.35 mm near-limit flame in Fig. 6.3 (a)', () => {
    // Measured off the photo in rod radii: standoff about 2, half-width about 3.6, tail about 2.35.
    const minimum = stagnationFlameShape({ unit, rodRadius: unit, stretchRate: 10.38, marginPts: 0 })
    expect(minimum.standoff / unit).toBeCloseTo(2, 1)
    expect(minimum.halfWidth / unit).toBeCloseTo(3.6, 1)
    expect(minimum.tail / unit).toBeCloseTo(2.35, 1)
  })

  it('fills about a quarter to a third of its half of the stage at the defaults', () => {
    // 1392 px stage: each half is 696 px and the unit is about 21 px.
    const shape = at(17 - 13.611)
    const bounds = stagnationFlameBounds(shape)
    const tall = bounds.bottom - bounds.top
    expect(tall / 696).toBeGreaterThan(0.25)
    expect(tall / 696).toBeLessThan(1 / 3)
  })

  it('wraps further along a thicker rod', () => {
    expect(at(1, 2, 12.7).tail).toBeGreaterThan(at(1, 2, 6.35).tail)
  })
})
