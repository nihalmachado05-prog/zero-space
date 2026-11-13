import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Which AI pipeline outputs (M7) exist. The app fetches only these, so a file that hasn't been
// generated never costs a 404 in the console; once the pipeline writes one, the next build (or dev
// server start) shows it. Read by src/lib/generatedData.ts.
const generated = (name: string) => existsSync(fileURLToPath(new URL(`./public/data/${name}`, import.meta.url)))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __GENERATED_DATA__: JSON.stringify({
      briefing: generated('briefing.json'),
      testOutcomes: generated('test-outcomes.json'),
    }),
  },
})
