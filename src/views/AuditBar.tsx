import { Note } from '../components/Note'

/** F0 data hygiene audit bar: a 40px strip on every view. Counters and segments arrive in M3. */
export function AuditBar() {
  return (
    <section aria-label="Data audit" className="flex h-10 shrink-0 items-center gap-6 px-6">
      <Note className="shrink-0">Audit of NASA's raw PSI-25 data arrives in M3</Note>
      {/* Empty bar where one segment per test will go. */}
      <div aria-hidden="true" className="h-2 flex-1 bg-line" />
    </section>
  )
}
