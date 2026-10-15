import type { Lang, TripPlan, TravelLeg } from '../../types'

export const rupees = (n: number) => `₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`

export function destinationName(plan: TripPlan, id: string | null, lang: Lang): string | null {
  if (!id) return null
  const d = plan.stops.find((s) => s.id === id)
  return d ? (lang === 'kn' ? d.name_kn : d.name) : null
}

/** Journey endpoints in the reader's language (the backend sends English names). */
export function legEnds(plan: TripPlan, leg: TravelLeg, lang: Lang) {
  const start = lang === 'kn' ? (plan.start.name_kn ?? plan.start.name) : plan.start.name
  return {
    from: destinationName(plan, leg.from_id, lang) ?? start,
    to: destinationName(plan, leg.to_id, lang) ?? start,
  }
}

export function totalRoadKm(plan: TripPlan): number {
  return Math.round(plan.legs.reduce((sum, leg) => sum + leg.est_road_km, 0))
}

/** Google Maps directions URL through the ordered stops. Opened in a new tab; no API key needed. */
export function googleRouteUrl(plan: TripPlan): string {
  const points = [
    `${plan.start.lat},${plan.start.lng}`,
    ...plan.stops.map((s) => `${s.lat},${s.lng}`),
  ]
  const origin = points[0]
  const destination = points[points.length - 1]
  const waypoints = points.slice(1, -1).join('|')
  const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'driving' })
  if (waypoints) params.set('waypoints', waypoints)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
