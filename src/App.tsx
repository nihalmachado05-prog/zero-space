import { useState, type ComponentType } from 'react'
import { Header } from './components/Header'
import { Tabs, type TabItem } from './components/Tabs'
import { AuditBar } from './views/AuditBar'
import { BurnTwin } from './views/BurnTwin'
import { Interpret } from './views/Interpret'
import { LabPartnerDock } from './views/LabPartnerDock'
import { Rank } from './views/Rank'
import { Summarize } from './views/Summarize'

type ModuleId = 'summarize' | 'rank' | 'interpret'

const MODULES: readonly TabItem<ModuleId>[] = [
  { id: 'summarize', label: 'Summarize' },
  { id: 'rank', label: 'Rank' },
  { id: 'interpret', label: 'Interpret' },
]

const MODULE_VIEWS: Record<ModuleId, ComponentType> = {
  summarize: Summarize,
  rank: Rank,
  interpret: Interpret,
}

export default function App() {
  const [active, setActive] = useState<ModuleId>('summarize')
  const [dockOpen, setDockOpen] = useState(true)
  const ActiveView = MODULE_VIEWS[active]

  return (
    <div className="flex min-h-full flex-col">
      <Header dockOpen={dockOpen} onToggleDock={() => setDockOpen((open) => !open)} />
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4">
        <AuditBar />
        <BurnTwin />
        <div
          className={`grid items-start gap-4 ${
            dockOpen ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''
          }`}
        >
          <section aria-label="Investigation modules">
            <Tabs tabs={MODULES} active={active} onChange={setActive} label="Modules">
              <ActiveView />
            </Tabs>
          </section>
          <LabPartnerDock open={dockOpen} />
        </div>
      </main>
    </div>
  )
}
