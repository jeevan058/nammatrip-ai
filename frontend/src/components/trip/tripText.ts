import type { Dict } from '../../i18n/strings'
import { fmt } from '../../i18n/strings'
import type { Lang, TripPlan } from '../../types'
import { legEnds, rupees } from './helpers'

/** Plain-text version of the itinerary for the copy button. */
export function tripToText(plan: TripPlan, t: Dict, lang: Lang): string {
  const out: string[] = [`NammaTrip AI: ${t.trip.title}`, plan.summary, '']

  for (const day of plan.days) {
    out.push(day.theme)
    for (const leg of plan.legs.filter((l) => l.day === day.day)) {
      const { from, to } = legEnds(plan, leg, lang)
      out.push(
        `  ${fmt(t.trip.itinerary.leg, { from, to, km: Math.round(leg.est_road_km), hours: leg.approx_hours })}`,
      )
    }
    for (const a of day.activities) {
      out.push(`  ${t.trip.itinerary[a.slot]}: ${a.title}. ${a.description}`)
    }
    if (day.food.length) out.push(`  ${t.trip.itinerary.eat}: ${day.food.join(', ')}`)
    if (day.stay_note) out.push(`  ${t.trip.itinerary.stay}: ${day.stay_note}`)
    out.push('')
  }

  out.push(`${t.trip.budget.title}: ${rupees(plan.budget.total_inr)} / ${t.trip.budget.yours} ${rupees(plan.budget.budget_inr)}`)
  for (const line of plan.budget.lines) {
    out.push(`  ${t.trip.budget.categories[line.category]}: ${rupees(line.amount_inr)}`)
  }
  out.push(`  ${t.trip.budget.note}`, '')

  if (plan.tips.length) {
    out.push(t.trip.tips.title)
    for (const tip of plan.tips) out.push(`  - ${tip}`)
  }
  return out.join('\n')
}
