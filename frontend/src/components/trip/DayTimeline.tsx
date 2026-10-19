
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
  const byId = new Map(plan.stops.map((stop) => [stop.id, stop]))

  return (
    <section aria-labelledby="itinerary-title">
      <div className="max-w-2xl">
        <h3
          id="itinerary-title"
          className="text-2xl font-semibold tracking-tight text-forest sm:text-3xl"
        >
          {t.trip.itinerary.title}
        </h3>
      </div>

      <ol className="journey-road mt-8 space-y-10 sm:mt-10 sm:space-y-14">
        {plan.days.map((day) => {
          const legs = plan.legs.filter((leg) => leg.day === day.day)

          return (
            <li
              key={day.day}
              className="journey-stop grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-8"
            >
              {/* The numbered stop on the shared journey road. */}
              <div
                className="journey-index relative z-10 flex size-11 items-center justify-center rounded-full border border-sage-line bg-ivory font-display text-lg text-forest sm:size-16 sm:text-2xl"
                aria-label={`Day ${day.day}`}
              >
                {String(day.day).padStart(2, '0')}
              </div>

              {/* All information for this day stays together. */}
              <div className="min-w-0 overflow-hidden rounded-sm border border-sage-line bg-paper">
                <header className="border-b border-sage-line bg-sage/50 px-5 py-5 sm:px-7 sm:py-6">
                  <h4 className="text-xl font-semibold leading-snug text-forest sm:text-2xl">
                    {day.theme}
                  </h4>
                </header>

                <div className="p-5 sm:p-7">
                  {legs.length > 0 && (
                    <div className="rounded-sm bg-sage px-4 py-4 sm:px-5">
                      <p className="flex items-center gap-2 font-semibold text-forest">
                        <Route size={17} aria-hidden="true" />
                        {t.trip.itinerary.travel}
                      </p>

                      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
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

                      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                        {t.trip.itinerary.legNote}
                      </p>
                    </div>
                  )}

                  <ul className="mt-5 divide-y divide-sage-line">
                    {SLOTS.map((slot) => {
                      const activity = day.activities.find(
                        (item) => item.slot === slot,
                      )

                      if (!activity) return null

                      const destination = byId.get(activity.destination_id)

                      return (
                        <li
                          key={slot}
                          className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-5"
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft sm:pt-1 sm:text-sm">
                            {t.trip.itinerary[slot]}
                          </span>

                          <div className="min-w-0">
                            <p className="font-semibold leading-snug text-forest">
                              {activity.title}
                            </p>

                            <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">
                              {activity.description}
                            </p>

                            {destination && (
                              <button
                                type="button"
                                onClick={() => onOpen(destination)}
                                className="no-print mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-forest underline-offset-4 transition-colors hover:text-terracotta hover:underline"
                              >
                                <MapPin size={14} aria-hidden="true" />
                                {lang === 'kn'
                                  ? destination.name_kn
                                  : destination.name}
                              </button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>

                  {(day.food.length > 0 || day.stay_note) && (
                    <div className="mt-6 grid gap-4 border-t border-sage-line pt-5 text-sm sm:grid-cols-2 sm:gap-6">
                      {day.food.length > 0 && (
                        <p className="flex items-start gap-2.5 leading-relaxed">
                          <Utensils
                            size={17}
                            className="mt-0.5 shrink-0 text-turmeric"
                            aria-hidden="true"
                          />
                          <span>
                            <span className="font-semibold text-forest">
                              {t.trip.itinerary.eat}:{' '}
                            </span>
                            <span className="text-ink-soft">
                              {day.food.join(', ')}
                            </span>
                          </span>
                        </p>
                      )}

                      {day.stay_note && (
                        <p className="flex items-start gap-2.5 leading-relaxed">
                          <BedDouble
                            size={17}
                            className="mt-0.5 shrink-0 text-turmeric"
                            aria-hidden="true"
                          />
                          <span>
                            <span className="font-semibold text-forest">
                              {t.trip.itinerary.stay}:{' '}
                            </span>
                            <span className="text-ink-soft">
                              {day.stay_note}
                            </span>
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
