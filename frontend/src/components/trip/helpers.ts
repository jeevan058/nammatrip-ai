
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

/** Total estimated road distance for the itinerary. */
export function totalRoadKm(plan: TripPlan): number {
  return Math.round(
    plan.legs.reduce((sum, leg) => sum + leg.est_road_km, 0),
  )
}

/**
 * Build a Google Maps directions URL using readable place names.
 * Known Karnataka destinations use Google Maps-friendly names.
 */
export function googleRouteUrl(plan: TripPlan): string {
  const resolveMapName = (name: string): string => {
    const normalized = name.toLowerCase()

    if (normalized.includes('bandipur')) {
      return 'Bandipur National Park, Karnataka, India'
    }

    if (
      normalized.includes('coorg') ||
      normalized.includes('kodagu') ||
      normalized.includes('madikeri')
    ) {
      return 'Madikeri, Karnataka, India'
    }

    if (normalized.includes('mysuru') || normalized.includes('mysore')) {
      return 'Mysuru, Karnataka, India'
    }

    return `${name}, Karnataka, India`
  }

  const start = resolveMapName(plan.start.name)
  const stops = plan.stops.map((stop) => resolveMapName(stop.name))

  const params = new URLSearchParams({
    api: '1',
    origin: start,
    destination: start,
    travelmode: 'driving',
  })

  if (stops.length > 0) {
    params.set('waypoints', stops.join('|'))
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
}
