
import type { Lang, TripPlan, TravelLeg } from '../../types'

export const rupees = (n: number) =>
  `₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`

export function destinationName(
  plan: TripPlan,
  id: string | null,
  lang: Lang,
): string | null {
  if (!id) return null

  const destination = plan.stops.find((stop) => stop.id === id)

  return destination
    ? lang === 'kn'
      ? destination.name_kn
      : destination.name
    : null
}

/** Journey endpoints in the reader's language. */
export function legEnds(
  plan: TripPlan,
  leg: TravelLeg,
  lang: Lang,
) {
  const start =
    lang === 'kn'
      ? (plan.start.name_kn ?? plan.start.name)
      : plan.start.name

  return {
    from: destinationName(plan, leg.from_id, lang) ?? start,
    to: destinationName(plan, leg.to_id, lang) ?? start,
  }
}

export function totalRoadKm(plan: TripPlan): number {
  return Math.round(
    plan.legs.reduce((sum, leg) => sum + leg.est_road_km, 0),
  )
}

/** Google Maps directions through the ordered stops and back to the start. */
export function googleRouteUrl(plan: TripPlan): string {
  const start = `${plan.start.lat},${plan.start.lng}`

  const points = [
    start,
    ...plan.stops.map((stop) => `${stop.lat},${stop.lng}`),
    start,
  ]

  const origin = points[0]
  const destination = points[points.length - 1]
  const waypoints = points.slice(1, -1).join('|')

  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  })

  if (waypoints) {
    params.set('waypoints', waypoints)
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
}
