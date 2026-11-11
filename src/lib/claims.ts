// Read access to src/data/claims.json and src/data/sources.json, with the shapes from SPEC §6.
// Locator also carries `file` and `line` for claims quoted from PSI metadata files.
import claimsData from '../data/claims.json'
import sourcesData from '../data/sources.json'

export interface Source {
  id: string
  title: string
  publisher: string
  year: number | null
  doi: string | null
  url: string | null
  kind: 'report' | 'dataset' | 'paper' | 'poster' | 'web'
  credit?: string
}

export interface Locator {
  pdfPage?: number
  reportPage?: number | null
  spansNextPage?: boolean
  table?: string
  row?: string
  /** File inside pipeline/sources/<SOURCE-ID>/, for PSI metadata quotes. */
  file?: string
  /** 1-based line number in `file`. */
  line?: number
}

export interface Claim {
  id: string
  topic: string
  text: string
  value?: number
  unit?: string
  kind: 'quoted' | 'computed'
  sourceId?: string
  locator?: Locator | null
  quote?: string
  formula?: string
  inputs?: string[]
  verified: boolean
}

export const CLAIMS = claimsData as unknown as readonly Claim[]
export const SOURCES = sourcesData as unknown as readonly Source[]

const claimsById = new Map(CLAIMS.map((claim) => [claim.id, claim]))
const sourcesById = new Map(SOURCES.map((source) => [source.id, source]))

export function getClaim(id: string): Claim | undefined {
  return claimsById.get(id)
}

export function getSource(id: string | undefined): Source | undefined {
  return id === undefined ? undefined : sourcesById.get(id)
}

/** Unverified claims never appear outside the citation drawer (CLAUDE.md rule 3). */
export function isVerified(id: string): boolean {
  return getClaim(id)?.verified === true
}

/** The folder under pipeline/sources/ that holds a source's files: "psi-98" → "PSI-98". */
export function sourceFolder(sourceId: string): string {
  return sourceId.toUpperCase()
}

/** The text of a Cite badge: [p. 76], [calc], [row 129], [PDF p. 4] or [PSI-69 line 42]. */
export function citeLabel(claim: Claim): string {
  if (claim.kind === 'computed') return '[calc]'
  const locator = claim.locator
  if (locator?.row) return `[row ${locator.row}]`
  if (typeof locator?.reportPage === 'number') return `[p. ${locator.reportPage}]`
  if (typeof locator?.pdfPage === 'number') return `[PDF p. ${locator.pdfPage}]`
  if (locator?.file && claim.sourceId) {
    return `[${sourceFolder(claim.sourceId)} line ${locator.line}]`
  }
  return '[source]'
}

/** A link for a source: its URL, else its DOI. */
export function sourceLink(source: Source): string | null {
  if (source.url) return source.url
  if (source.doi) return `https://doi.org/${source.doi}`
  return null
}
