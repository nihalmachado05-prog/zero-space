// The one module that talks to Gemini (SPEC §7.3). Nothing else imports @google/genai; the
// pipeline scripts and api/ call complete() from here.
//
// The key and model come from GEMINI_API_KEY and GEMINI_MODEL: .env.local on this machine
// (scripts call loadLocalEnv()), Vercel environment variables when deployed. No model name is
// hardcoded.
import { existsSync } from 'node:fs'
import { GoogleGenAI, type FunctionDeclaration } from '@google/genai'

export type CompleteRequest = {
  system: string
  user: string
  /** Function declarations for Gemini's function calling (Lab Partner's tools). */
  tools?: FunctionDeclaration[]
  /** Ask for JSON output (the pipeline). */
  json?: boolean
  /** Defaults to 0, as the pipeline needs. */
  temperature?: number
  /** Give up after this long, in ms. Defaults to 60 s. */
  timeoutMs?: number
}

export type CompleteResult = {
  text: string
  functionCalls: Array<{ name: string; args: Record<string, unknown> }>
  /** The model that answered, to record next to every output. */
  model: string
}

/** Loads .env.local into process.env when it exists (scripts only; Vercel sets env vars itself). */
export function loadLocalEnv(path = '.env.local'): void {
  if (existsSync(path)) process.loadEnvFile(path)
}

function requireEnv(name: 'GEMINI_API_KEY' | 'GEMINI_MODEL'): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is not set. Put it in .env.local, or in Vercel's environment variables.`)
  }
  return value
}

let client: GoogleGenAI | undefined

export async function complete(request: CompleteRequest): Promise<CompleteResult> {
  client ??= new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') })
  const model = requireEnv('GEMINI_MODEL')
  const response = await client.models.generateContent({
    model,
    contents: request.user,
    config: {
      systemInstruction: request.system,
      temperature: request.temperature ?? 0,
      abortSignal: AbortSignal.timeout(request.timeoutMs ?? 60_000),
      ...(request.json ? { responseMimeType: 'application/json' } : {}),
      ...(request.tools?.length ? { tools: [{ functionDeclarations: request.tools }] } : {}),
    },
  })
  return {
    text: response.text ?? '',
    functionCalls: (response.functionCalls ?? []).map((call) => ({
      name: call.name ?? '',
      args: call.args ?? {},
    })),
    model,
  }
}
