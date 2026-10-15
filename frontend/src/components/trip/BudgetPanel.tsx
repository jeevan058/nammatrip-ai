import { useLanguage } from '../../i18n/LanguageContext'
import { fmt } from '../../i18n/strings'
import type { TripPlan } from '../../types'
import { rupees } from './helpers'

export function BudgetPanel({ plan }: { plan: TripPlan }) {
  const { lang, t } = useLanguage()
  const b = plan.budget
  const used = Math.min(100, Math.round((b.total_inr / b.budget_inr) * 100))
  const maxLine = Math.max(...b.lines.map((l) => l.amount_inr), 1)

  return (
    <aside
      aria-labelledby="budget-title"
      className="rounded-md border border-sage-line bg-paper p-6 lg:sticky lg:top-24"
    >
      <h3 id="budget-title" className="text-xl font-semibold">
        {t.trip.budget.title}
      </h3>

      <p className="mt-4 text-sm text-ink-soft">{t.trip.budget.total}</p>
      <p className="font-display text-4xl font-semibold text-forest">{rupees(b.total_inr)}</p>

      <div
        role="img"
        aria-label={`${rupees(b.total_inr)} / ${rupees(b.budget_inr)}`}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-sage"
      >
        <div
          className={`h-full rounded-full ${b.within_budget ? 'bg-forest' : 'bg-danger'}`}
          style={{ width: `${used}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-sm text-ink-soft">
        <span>
          {t.trip.budget.yours}: {rupees(b.budget_inr)}
        </span>
        <span className={`font-semibold ${b.within_budget ? 'text-forest' : 'text-danger'}`}>
          {fmt(b.within_budget ? t.trip.budget.within : t.trip.budget.over, {
            n: rupees(b.difference_inr).slice(1),
          })}
        </span>
      </div>

      <ul className="mt-6 space-y-4">
        {b.lines.map((line) => (
          <li key={line.category}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{t.trip.budget.categories[line.category]}</span>
              <span className="tabular-nums">{rupees(line.amount_inr)}</span>
            </div>
            <div aria-hidden="true" className="mt-1.5 h-1.5 rounded-full bg-sage">
              <div
                className="h-full rounded-full bg-turmeric"
                style={{ width: `${(line.amount_inr / maxLine) * 100}%` }}
              />
            </div>
            {/* The backend explains each line in English; Kannada readers get the generic note. */}
            {lang === 'en' && <p className="mt-1 text-xs text-ink-soft">{line.basis}</p>}
          </li>
        ))}
      </ul>

      {b.suggestions.length > 0 && (
        <div className="mt-6 rounded-sm bg-sage p-4">
          <h4 className="font-semibold">{t.trip.budget.suggestionsTitle}</h4>
          <ul className="mt-2 space-y-2 text-sm">
            {b.suggestions.map((s) => (
              <li key={s.kind}>{fmt(t.trip.budget.suggestions[s.kind], { n: rupees(s.saving_inr).slice(1) })}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-5 text-xs text-ink-soft">{t.trip.budget.note}</p>
    </aside>
  )
}
