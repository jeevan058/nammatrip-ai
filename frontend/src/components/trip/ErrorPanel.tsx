import { RotateCcw, TriangleAlert } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import type { TripErrorKind } from '../../lib/api'

interface Props {
  kind: TripErrorKind
  onRetry: () => void
  onEdit: () => void
}

export function ErrorPanel({ kind, onRetry, onEdit }: Props) {
  const { t } = useLanguage()
  const copy = t.trip.errors[kind]
  // Retrying identical input cannot fix a rejected request, so offer "edit" instead.
  const canRetry = kind !== 'validation' && kind !== 'no_match'
  return (
    <div role="alert" className="rounded-md border border-danger/40 bg-paper p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <TriangleAlert className="mt-1 shrink-0 text-danger" size={26} aria-hidden="true" />
        <div>
          <h3 className="text-xl font-semibold">{copy.title}</h3>
          <p className="mt-2 max-w-[60ch] text-ink-soft">{copy.body}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {canRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 font-medium text-ivory transition-colors hover:bg-forest-deep"
              >
                <RotateCcw size={16} aria-hidden="true" />
                {t.trip.retry}
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-forest px-5 py-2.5 font-medium text-forest transition-colors hover:bg-forest hover:text-ivory"
            >
              {t.trip.edit}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
