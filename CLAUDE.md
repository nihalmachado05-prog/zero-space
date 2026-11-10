# CLAUDE.md: ZERO-DRAFT

## What we're building

ZERO-DRAFT is our entry for NASA Space Apps 2026, challenge "Flame in Freefall". It's a mission-control style web app that summarizes, ranks and interprets NASA's BASS-II microgravity fire experiments, with an AI "Lab Partner" that answers questions and drives the simulators. Every number on screen comes from NASA data or NASA's own published models.

The full plan is `docs/SPEC.md`. Before writing code for a milestone, read that milestone in SPEC §9 and every section it points to. Build only that milestone.

## Working with me

- I'm learning to code. After every change, tell me in plain words what changed, which files changed, and exactly how to check it: the command to run, what to click, what I should see.
- One milestone per session. If you notice something broken outside the milestone, tell me; don't fix it silently.
- Ask me before you add a dependency that isn't listed below, change a data shape in SPEC §6, delete files, or change any value or quote in `src/data/claims.json`.
- When a test fails, show me the failure and your fix. Never weaken, skip or delete a test to make it pass.
- If SPEC and this file disagree, this file wins. If SPEC is unclear, ask; don't guess.

## Stack (installed in M0; don't swap)

- Vite 8, React 19, TypeScript
- Tailwind CSS v4 through `@tailwindcss/vite`. There is no `tailwind.config.js`; tokens live in `@theme` in `src/index.css`.
- Recharts 3 for charts, `motion` (import from `motion/react`) for animation, lucide-react for icons, MiniSearch for text search
- Fonts: `@fontsource-variable/archivo` for words, `@fontsource-variable/jetbrains-mono` for numbers
- Vitest for tests, tsx to run scripts, unpdf to read PDF text
- Deploy on Vercel: static site plus serverless functions in `api/`
- Gemini through `@google/genai` (SPEC §7.3). Only `pipeline/scripts/llm.ts` imports it; `api/` uses that module. Keys and the model name come from `GEMINI_API_KEY` and `GEMINI_MODEL`.
- Node 22 or newer.

## Commands

- `npm run dev`: local site
- `npm test`: unit tests (`vitest run`)
- `npm run build`: must pass before a milestone is done
- `npm run check:claims`: confirms every quote in `src/data/claims.json` is on its stated PDF page, or its stated line of a PSI file
- `npm run data:bass2`: rebuilds `public/data/bass2.json` and `audit.json` from the raw CSV
- `npm run pipeline:text`, `pipeline:extract`, `pipeline:verify`, `pipeline:briefing`, `pipeline:chunks`: the AI pipeline (SPEC §7)

## Folder layout

```
api/lab-partner.ts           Lab Partner AI endpoint (M6)
api/_data/chunks.json        generated search chunks
pipeline/
  sources/<ID>/              raw files: NASA CSV, PSI metadata, PDFs. Never edit these.
  text/<ID>.pages.json       normalized text, split by page
  prompts/                   LLM prompts. Changing one means bumping its version line.
  out/raw/                   untouched LLM responses. Keep them; they're our evidence.
  out/review.md              fields that failed verification, for human review
  scripts/                   compile-bass2.ts, check-claims.ts, llm.ts, text.ts, extract.ts, verify.ts, outcomes.ts, briefing.ts, chunks.ts
docs/fixtures/               expected values from the verified audit. Tests must reproduce them; never edit them to make a test pass.
public/data/                 JSON the site loads. Generated, never hand-edited.
public/img/                  NASA figures we extracted, credited in sources.json
src/
  lib/normalize.ts           the single text-normalizing function used everywhere
  lib/physics.ts             Eq. 6.1, stretch rate, t_s. Pure, fully tested.
  lib/cabin.ts               cabin fire, toxicity and N2 dilution model. Pure, fully tested.
  lib/audit.ts               BASS-II spreadsheet checks. Pure, fully tested.
  lib/risk.ts                Orbital Risk Index. Pure, fully tested.
  lib/relevance.ts           investigation relevance scoring (P1). Pure, fully tested.
  data/claims.json           every sourced number and sentence shown in the UI
  data/sources.json          bibliography
  components/                one component per file, under 250 lines
  views/                     AuditBar, BurnTwin, Summarize, Rank, Interpret, LabPartnerDock
```

## Data integrity rules (non-negotiable; this is how we win "Validity")

1. **No invented numbers.** Every scientific number in the UI comes from `src/data/claims.json` (quoted from a source), from the CSV through `lib/audit.ts`, or from a function in `src/lib/` with cited inputs. Components never hardcode scientific values, including the audit counts.
2. **Every claim is clickable.** Wrap sourced values and sentences in `<Cite id="..." />`. The drawer shows the verbatim quote, source, report page and PDF page, and for computed values the formula and its inputs. Row-level data shows the raw CSV cells.
3. **Quotes are machine-checked.** `check:claims` confirms each quote is on its stated page after `normalize()`. Anything unverified is hidden from the main UI.
4. **Unknown means unknown.** If a source doesn't state a value, store `null` and show "Not stated". Never fill a gap with a typical value.
5. **Alarms are earned.** Every verdict, alarm and color state (burns, out, above SMAC, sensor ceiling) comes from model state in `src/lib/`. Never trigger or style an alarm the model didn't produce.
6. **Models say where they stop.** Eq. 6.1 is for PMMA rods at 1 atm. The cabin model is for a sealed, well-mixed volume at 1 atm. Outside those ranges the UI shows "Outside tested range" and makes no prediction.
7. **Label what isn't data.** Flame drawings say "Illustration". Readouts from models say "Model". Replays calibrated from a test's own numbers say "Replay".
8. **No fake instruments.** No simulated values styled as live sensor channels. No real hardware part numbers next to model values.
9. **Scope the words.** Say "PMMA rods", not "materials". Say "in BASS-II tests", not "in space". 15.4% is a 1g research limit for PMMA rods with 4 cm/s forced flow (Olson & Ferkul 2017, cited in the BASS-II report p. 76), not a NASA-STD-6001 Test 1 result. Never say "safe"; say "extinguishes (model)" or "below the 1-hour limit".
10. **The AI never makes up numbers.** Lab Partner chooses parameters and calls tools; numbers come from `src/lib/` or verified quotes. The server strips any answer sentence containing a number it can't trace to a tool result or a verified quote.
11. **AI output is labeled.** Anything an LLM wrote shows "AI-written, checked". Every generated JSON file carries `generatedBy`, `model` and `promptVersion` fields.
12. **No NASA logos or insignia** anywhere (Space Apps rule). NASA figures and photos are allowed with a credit in `sources.json`.
13. **Secrets** live in `.env.local`, which is git-ignored. Nothing secret goes in `src/` or `public/`.

## Design rules

- Mission-control look. Tokens go in `@theme` in `src/index.css`:
  - `void #060911` page background, `panel #0b101b` surfaces, `line #1e293b` borders
  - `ink #cbd5e1` text, `muted #64748b` secondary text
  - `cyan #06b6d4`: microgravity, active selection, live model values
  - `amber #f59e0b`: 1g reference, cautions, 10 ppm limit
  - `red #ef4444`: flammable region, 55 ppm limit, quarantined data
  - `emerald #10b981`: verified data and checks
- Archivo for words. JetBrains Mono with `tabular-nums` for every number, slider value, axis tick, table cell and timestamp.
- Square or near-square corners (`rounded-none` or `rounded-sm`), 1px borders, small `+` corner ticks on instrument panels. No gradients or emoji in the interface chrome. Only the flame illustrations may use blur and glow.
- **Every view has one signature motion** (listed in SPEC §5). Make it excellent and keep everything else still.
  - Animate with `motion` or `requestAnimationFrame` plus refs; never re-render the whole page every frame.
  - Under `prefers-reduced-motion`, every animation becomes an instant state change.
- Never rely on color alone. Pair every status color with a text label or icon.
- Desktop-first: 1440×900 is the demo size, and nothing may break at 1280 wide. Text in charts is at least 12px so it reads in a video.
- Sentence case and plain words. Buttons say what they do ("Drain oxygen", "Show source").
- Visible keyboard focus everywhere.

## Definition of done (every milestone)

- `npm test` and `npm run build` pass with zero TypeScript errors.
- Each acceptance criterion for the milestone in SPEC is met, and you've told me how you checked it.
- No errors in the browser console; animations hold 60 fps on my laptop.
- You've told me how to see it working.
- Commit with a message naming the milestone, e.g. `M2: burn twin`.
