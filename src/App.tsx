import { useState, type ComponentType } from 'react'
import { CitationProvider } from './components/CitationProvider'
import { Header } from './components/Header'
import { ViewFrame } from './components/ViewFrame'
import type { ViewId, ViewProps } from './lib/route'
import { useRoute } from './lib/useRoute'
import { AuditBar } from './views/AuditBar'
import { Interpret } from './views/Interpret'
import { LabPartnerDock } from './views/LabPartnerDock'
import { Overview } from './views/Overview'
import { Rank } from './views/Rank'
import { Summarize } from './views/Summarize'

const VIEW_COMPONENTS: Record<ViewId, ComponentType<ViewProps>> = {
  overview: Overview,
  summarize: Summarize,
  rank: Rank,
  interpret: Interpret,
}

/**
 * The shell. The header, audit bar, Lab Partner dock and citation drawer (inside
 * CitationProvider) stay mounted on every view; only the main area changes.
 */
export default function App() {
  const route = useRoute()
  const [dockOpen, setDockOpen] = useState(false)
  const View = VIEW_COMPONENTS[route.view]

  return (
    <CitationProvider>
      <div className="flex h-dvh flex-col overflow-hidden">
        <Header active={route.view} />
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <AuditBar />
            <ViewFrame viewKey={route.view}>
              <View params={route.params} />
            </ViewFrame>
          </div>
          <LabPartnerDock open={dockOpen} onToggle={() => setDockOpen((open) => !open)} />
        </div>
      </div>
    </CitationProvider>
  )
}
