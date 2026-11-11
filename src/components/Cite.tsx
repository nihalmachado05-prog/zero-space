import { citeLabel, getClaim } from '../lib/claims'
import { useCitation } from './citationContext'

type CiteProps = {
  /** A claim id from src/data/claims.json. check:claims fails if it is missing. */
  id: string
  /** Only the citation drawer sets this, to link inputs that may not be verified. */
  showUnverified?: boolean
}

/**
 * A small bracket badge such as [p. 76], [calc] or [row 129] that opens the citation drawer.
 * Unverified or unknown claims render nothing outside the drawer (CLAUDE.md rule 3).
 */
export function Cite({ id, showUnverified = false }: CiteProps) {
  const { openCitation } = useCitation()
  const claim = getClaim(id)
  if (!claim || (!claim.verified && !showUnverified)) return null
  return (
    <button
      type="button"
      onClick={() => openCitation(id)}
      aria-haspopup="dialog"
      aria-label={`Show source: ${claim.text}`}
      className="num text-xs text-muted hover:text-cyan"
    >
      {citeLabel(claim)}
    </button>
  )
}
