import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

type SweptQuoteProps = {
  quote: string
  /** Highlight the words only when the quote was checked against its source. */
  highlight: boolean
  /** Wait this long before the sweep starts (the drawer's slide-in), in ms. */
  delayMs: number
}

const STEP_MS = 18

/**
 * The verbatim quote. When it is checked, an emerald highlight sweeps across its words left to
 * right (F6's signature motion). Under reduced motion the highlight is there at once.
 */
export function SweptQuote({ quote, highlight, delayMs }: SweptQuoteProps) {
  const reduceMotion = useReducedMotion()
  const [swept, setSwept] = useState(false)

  useEffect(() => {
    if (!highlight || reduceMotion) return
    const timer = window.setTimeout(() => setSwept(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [highlight, reduceMotion, delayMs])

  const lit = highlight && (swept || reduceMotion === true)
  // Each word keeps its trailing space, so the highlight runs on without gaps.
  const words = quote.match(/\S+\s*/g) ?? []
  return (
    <blockquote className="border-l-2 border-line pl-4 text-sm leading-6">
      {words.map((word, index) => (
        <span
          key={index}
          className={`transition-colors duration-150 ${lit ? 'bg-emerald/25' : 'bg-transparent'}`}
          style={{ transitionDelay: lit && !reduceMotion ? `${index * STEP_MS}ms` : '0ms' }}
        >
          {word}
        </span>
      ))}
    </blockquote>
  )
}
