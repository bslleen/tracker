import { useEffect, useRef, useState } from 'react'

const PLACEHOLDER_EXAMPLES = ['French', 'Linear algebra', 'Chess openings', 'Machine learning']
const CYCLE_MS = 2600

export interface NameStepProps {
  name: string
  onChange: (name: string) => void
  onSubmit: () => void
}

export function NameStep({ name, onChange, onSubmit }: NameStepProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEmpty = name.length === 0

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isEmpty) return
    const interval = window.setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % PLACEHOLDER_EXAMPLES.length)
    }, CYCLE_MS)
    return () => window.clearInterval(interval)
  }, [isEmpty])

  return (
    <div className="flex flex-col gap-10">
      <h2 className="text-[length:var(--text-small)] text-text-2">What are you learning?</h2>

      <div>
        <input
          ref={inputRef}
          value={name}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onSubmit()
            }
          }}
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
          maxLength={60}
          autoComplete="off"
          aria-label="Goal name"
          className="w-full border-none bg-transparent text-title text-text outline-none placeholder:text-text-2"
          style={{ caretColor: 'var(--accent)' }}
        />
        <div
          className="mt-3 h-px w-full bg-hairline"
          style={{ transformOrigin: 'left', animation: 'underline-draw-in 420ms var(--ease-out) both' }}
        />
      </div>
    </div>
  )
}
