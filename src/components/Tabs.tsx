import type { KeyboardEvent, ReactNode } from 'react'

export type TabItem<Id extends string> = { id: Id; label: string }

type TabsProps<Id extends string> = {
  tabs: readonly TabItem<Id>[]
  active: Id
  onChange: (id: Id) => void
  label: string
  /** The content of the active tab. */
  children: ReactNode
}

/** An accessible tab strip with its panel: arrow keys, Home and End move between tabs. */
export function Tabs<Id extends string>({ tabs, active, onChange, label, children }: TabsProps<Id>) {
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    onChange(tabs[next].id)
    document.getElementById(`tab-${tabs[next].id}`)?.focus()
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={label} className="flex border-b border-line">
        {tabs.map((tab, index) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`-mb-px border-b-2 px-5 py-2.5 text-sm font-semibold tracking-widest uppercase ${
                selected
                  ? 'border-cyan text-cyan'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div id={`tabpanel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`}>
        {children}
      </div>
    </div>
  )
}
