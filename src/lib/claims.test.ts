import { describe, expect, it } from 'vitest'
import {
  CO2_PER_O2,
  CO_PPM_PER_PCT_CO2,
  CO_SENSOR_CEILING_PPM,
  HUGGETT_J_PER_G_O2,
  MSG_N2_FLOW_CC_MIN,
  MSG_VOLUME_M3,
  R_CM3_ATM_PER_MOL_K,
  SMAC_1_HOUR_PPM,
  SMAC_LONG_TERM_PPM,
  US_LAB_VOLUME_M3,
} from './cabin'
import { CLAIMS, citePreview, getClaim, SOURCES, sourceLink, splitEmphasis } from './claims'
import { normalize } from './normalize'
import { ALPHA_PMMA_CM2_S, EARTH_LIMIT_O2_PCT, R0_CM } from './physics'

const claim = (id: string) => {
  const found = getClaim(id)
  if (!found) throw new Error(`missing claim ${id}`)
  return found
}
const quoteOf = (id: string) => normalize(claim(id).quote ?? '')

describe('claims.json', () => {
  it('holds the 80 report claims and the 36 PSI claims, each id once', () => {
    expect(CLAIMS).toHaveLength(116)
    expect(new Set(CLAIMS.map((c) => c.id)).size).toBe(116)
    expect(CLAIMS.filter((c) => typeof c.locator?.pdfPage === 'number')).toHaveLength(80)
    expect(CLAIMS.filter((c) => typeof c.locator?.file === 'string')).toHaveLength(36)
  })

  it('gives every quoted claim a quote, a locator and a source in sources.json', () => {
    const sourceIds = new Set(SOURCES.map((s) => s.id))
    for (const c of CLAIMS.filter((c) => c.kind === 'quoted')) {
      expect(c.quote, c.id).toBeTruthy()
      expect(c.locator, c.id).toBeTruthy()
      expect(sourceIds.has(c.sourceId ?? ''), `${c.id} → ${c.sourceId}`).toBe(true)
    }
  })

  it('gives every emphasis as an exact phrase of its own quote', () => {
    const emphasized = CLAIMS.filter((c) => c.emphasis !== undefined)
    expect(emphasized.length).toBeGreaterThan(0)
    for (const c of emphasized) {
      expect(c.emphasis, c.id).toBeTruthy()
      expect(c.quote ?? '', c.id).toContain(c.emphasis)
    }
  })

  it('underlines the 1g part of the header thesis quote (psi26.impacts)', () => {
    expect(claim('psi26.impacts').emphasis).toBe(
      'based on 1-g behavior without consideration of low gravity effects',
    )
  })
})

describe('sources.json', () => {
  it('lists the 11 sources from SPEC §8.5, each with a link except the cited-only paper', () => {
    expect(SOURCES).toHaveLength(11)
    for (const s of SOURCES) {
      if (s.id !== 'olson-ferkul-2017') expect(sourceLink(s), s.id).toBeTruthy()
    }
  })

  it('gives every source a short name for footnote previews', () => {
    for (const s of SOURCES) expect(s.short, s.id).toBeTruthy()
    expect(SOURCES.find((s) => s.id === 'nasa-tm-20210011385')?.short).toBe('BASS-II report')
    expect(SOURCES.find((s) => s.id === 'psi-102')?.short).toBe('PSI-102')
  })
})

// The footnote preview replaced the old [p. 76] badge; the same five locator cases are covered.
describe('citePreview', () => {
  it('names the source, then the report page, the PDF page when there is no report page, or the PSI file line', () => {
    expect(citePreview(claim('bass2.flam.vs-1g'))).toBe('BASS-II report, p. 76')
    expect(citePreview(claim('bass2.lab-partner'))).toBe('BASS-II report, PDF p. 4')
    expect(citePreview(claim('psi69.pressure'))).toBe('PSI-69, line 42')
    expect(citePreview(claim('psi26.impacts'))).toBe('PSI-26, line 69')
  })

  it('says a computed value is calculated, and gives the row for data rows', () => {
    expect(citePreview({ id: 'x', topic: '', text: '', kind: 'computed', verified: true })).toBe(
      'Calculated from cited inputs',
    )
    const row = {
      id: 'y',
      topic: '',
      text: '',
      kind: 'quoted',
      sourceId: 'psi-25',
      verified: true,
      locator: { row: '129' },
    } as const
    expect(citePreview(row)).toBe('PSI-25, row 129')
  })
})

describe('splitEmphasis', () => {
  it('cuts the quote around its emphasis, keeping every character', () => {
    const quote = claim('psi26.impacts').quote ?? ''
    const parts = splitEmphasis(quote, claim('psi26.impacts').emphasis)
    expect(parts.emphasis).toBe('based on 1-g behavior without consideration of low gravity effects')
    expect(parts.before.endsWith('segregates material ')).toBe(true)
    expect(parts.after).toBe('.')
    expect(parts.before + parts.emphasis + parts.after).toBe(quote)
  })

  it('leaves the quote whole when there is no emphasis or it is not in the quote', () => {
    expect(splitEmphasis('A quote.', undefined)).toEqual({ before: 'A quote.', emphasis: '', after: '' })
    expect(splitEmphasis('A quote.', 'missing')).toEqual({ before: 'A quote.', emphasis: '', after: '' })
  })
})

// Every model constant that cites a claim must match that claim's value or appear in its quote.
describe('model constants match their quotes', () => {
  it('physics.ts', () => {
    expect(claim('bass2.flam.r0').value).toBe(R0_CM)
    expect(claim('bass2.ign.alpha-pmma').value).toBe(ALPHA_PMMA_CM2_S)
    expect(claim('bass2.flam.vs-1g').value).toBe(EARTH_LIMIT_O2_PCT)
    expect(quoteOf('bass2.flam.stretch-def')).toContain('a = (3/2)(U/r)')
  })

  it('cabin.ts', () => {
    expect(quoteOf('bass2.calorimetry-inputs')).toContain(`R = ${R_CM3_ATM_PER_MOL_K}`)
    expect(claim('bass2.hrr.huggett').value).toBe(HUGGETT_J_PER_G_O2 / 1000)
    expect(quoteOf('bass2.stoich')).toContain('6 O2 > 5 CO2')
    expect(CO2_PER_O2).toBe(5 / 6)
    expect(claim('bass2.co.370').value).toBe(CO_PPM_PER_PCT_CO2['opposed-slab'])
    expect(claim('bass2.co.550').value).toBe(CO_PPM_PER_PCT_CO2['concurrent-rod'])
    expect(quoteOf('bass2.co.smac')).toContain(`(${SMAC_LONG_TERM_PPM} ppm)`)
    expect(quoteOf('bass2.co.smac')).toContain(`SMAC of ${SMAC_1_HOUR_PPM} ppm`)
    expect(claim('bass2.co.sensor-range').value).toBe(CO_SENSOR_CEILING_PPM)
    expect(claim('bass2.cstr.volume').value).toBe(MSG_VOLUME_M3)
    expect(claim('bass2.cstr.n2-flow').value).toBe(MSG_N2_FLOW_CC_MIN)
    expect(claim('bass2.us-lab-volume').value).toBe(US_LAB_VOLUME_M3)
  })
})
