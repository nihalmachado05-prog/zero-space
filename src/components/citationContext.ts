import { createContext, useContext } from 'react'

export type CitationApi = {
  /** Opens the citation drawer on a claim id from src/data/claims.json. */
  openCitation: (claimId: string) => void
}

export const CitationContext = createContext<CitationApi | null>(null)

/** Use inside <CitationProvider>. */
export function useCitation(): CitationApi {
  const api = useContext(CitationContext)
  if (!api) throw new Error('useCitation must be used inside <CitationProvider>')
  return api
}
