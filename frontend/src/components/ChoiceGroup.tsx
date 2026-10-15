import type { ReactNode } from 'react'

export interface ChoiceOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  lang?: string
}

interface BaseProps<T extends string> {
  name: string
  legend: string
  hint?: string
  options: ChoiceOption<T>[]
  error?: string
  errorId?: string
}

const pill =
  'flex cursor-pointer items-center gap-2 rounded-full border border-sage-line bg-paper px-4 py-2 text-[0.95rem] font-medium text-ink-soft transition-colors ' +
  'hover:border-forest peer-checked:border-forest peer-checked:bg-forest peer-checked:text-ivory ' +
  'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-turmeric'

function Legend({ legend, hint }: { legend: string; hint?: string }) {
  return (
    <legend className="mb-2.5 flex flex-wrap items-baseline gap-x-3 text-[0.95rem] font-semibold text-ink">
      {legend}
      {hint && <span className="text-sm font-normal text-ink-soft">{hint}</span>}
    </legend>
  )
}

export function SingleChoice<T extends string>({
  name,
  legend,
  hint,
  options,
  value,
  onChange,
}: BaseProps<T> & { value: T; onChange: (value: T) => void }) {
  return (
    <fieldset>
      <Legend legend={legend} hint={hint} />
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className={pill} lang={option.lang}>
              {option.icon}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function MultiChoice<T extends string>({
  name,
  legend,
  hint,
  options,
  values,
  onToggle,
  error,
  errorId,
}: BaseProps<T> & { values: T[]; onToggle: (value: T) => void }) {
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <Legend legend={legend} hint={hint} />
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <label key={option.value} className="relative">
            <input
              id={index === 0 ? `${name}-first` : undefined}
              type="checkbox"
              name={name}
              value={option.value}
              checked={values.includes(option.value)}
              onChange={() => onToggle(option.value)}
              aria-invalid={error ? true : undefined}
              className="peer sr-only"
            />
            <span className={pill}>
              {option.icon}
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
