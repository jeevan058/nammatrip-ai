import { useLanguage } from '../../i18n/LanguageContext'

const bar = 'animate-pulse rounded-sm bg-sage-line/70'

/** Placeholder shown while the planner works. Shape matches the real results. */
export function TripSkeleton() {
  const { t } = useLanguage()
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <p className="mb-6 font-medium text-forest">{t.trip.loading}</p>
      <div className="grid gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${bar} h-24`} />
        ))}
      </div>
      <div className={`${bar} mt-8 h-72`} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${bar} h-44`} />
          ))}
        </div>
        <div className={`${bar} h-96`} />
      </div>
    </div>
  )
}
