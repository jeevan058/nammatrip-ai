import { MapPin, Route, Utensils, BedDouble } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { fmt } from '../../i18n/strings'
import { SLOTS, type Destination, type TripPlan } from '../../types'
import { legEnds } from './helpers'

interface Props {
  plan: TripPlan
  onOpen: (destination: Destination) => void
}

export function DayTimeline({ plan, onOpen }: Props) {
  const { lang, t } = useLanguage()
  const byId = new Map(plan.stops.map((s) => [s.id, s]))

  return (
    <section aria-labelledby="itinerary-title">
      <h3 id="itinerary-title" className="text-2xl font-semibold">
        {t.trip.itinerary.title}
      </h3>
      <ol className="mt-6 space-y-6">
        {plan.days.map((day) => {
          const legs = plan.legs.filter((leg) => leg.day === day.day)
          return (
            <li key={day.day} className="rounded-md border border-sage-line bg-paper p-5 sm:p-7">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-forest font-display text-lg font-semibold text-ivory"
                >
                  {day.day}
                </span>
                <h4 className="text-xl font-semibold">{day.theme}</h4>
              </div>

              {legs.length > 0 && (
                <div className="mt-5 rounded-sm bg-sage px-4 py-3 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-forest">
                    <Route size={16} aria-hidden="true" />
                    {t.trip.itinerary.travel}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {legs.map((leg) => {
                      const { from, to } = legEnds(plan, leg, lang)
                      return (
                        <li key={`${leg.from_name}-${leg.to_name}`}>
                          {fmt(t.trip.itinerary.leg, {
                            from,
                            to,
                            km: Math.round(leg.est_road_km),
                            hours: leg.approx_hours,
                          })}
                        </li>
                      )
                    })}
                  </ul>
                  <p className="mt-1 text-xs text-ink-soft">{t.trip.itinerary.legNote}</p>
                </div>
              )}

              <ul className="mt-5 divide-y divide-sage-line">
                {SLOTS.map((slot) => {
                  const activity = day.activities.find((a) => a.slot === slot)
                  if (!activity) return null
                  const destination = byId.get(activity.destination_id)
                  return (
                    <li key={slot} className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-5">
                      <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
                        {t.trip.itinerary[slot]}
                      </span>
                      <div>
                        <p className="font-semibold">{activity.title}</p>
                        <p className="mt-1 text-ink-soft">{activity.description}</p>
                        {destination && (
                          <button
                            type="button"
                            onClick={() => onOpen(destination)}
                            className="no-print mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-forest underline-offset-4 hover:underline"
                          >
                            <MapPin size={14} aria-hidden="true" />
                            {lang === 'kn' ? destination.name_kn : destination.name}
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>

              {(day.food.length > 0 || day.stay_note) && (
                <div className="mt-2 grid gap-3 border-t border-sage-line pt-4 text-sm sm:grid-cols-2">
                  {day.food.length > 0 && (
                    <p className="flex gap-2">
                      <Utensils size={16} className="mt-1 shrink-0 text-turmeric" aria-hidden="true" />
                      <span>
                        <span className="font-semibold">{t.trip.itinerary.eat}: </span>
                        {day.food.join(', ')}
                      </span>
                    </p>
                  )}
                  {day.stay_note && (
                    <p className="flex gap-2">
                      <BedDouble size={16} className="mt-1 shrink-0 text-turmeric" aria-hidden="true" />
                      <span>
                        <span className="font-semibold">{t.trip.itinerary.stay}: </span>
                        {day.stay_note}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
