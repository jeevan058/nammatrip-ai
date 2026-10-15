import type { Destination, TripPlan, TripRequest } from '../types'

// Empty in development (Vite proxies /api to the backend on port 8000).
const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export async function fetchDestinations(signal?: AbortSignal): Promise<Destination[]> {
  const response = await fetch(`${BASE}/api/destinations`, { signal })
  if (!response.ok) {
    throw new Error(`Destinations request failed with status ${response.status}`)
  }
  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Unexpected destinations response')
  }
  return data as Destination[]
}

export type TripErrorKind = 'network' | 'timeout' | 'no_match' | 'validation' | 'server'

export class TripError extends Error {
  kind: TripErrorKind
  constructor(kind: TripErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

const TIMEOUT_MS = 120_000 // the AI step can take a while on free tiers

/** Light shape check so a malformed response never reaches the renderer. */
function isTripPlan(value: unknown): value is TripPlan {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    Array.isArray(v.days) &&
    v.days.length > 0 &&
    Array.isArray(v.stops) &&
    Array.isArray(v.legs) &&
    Array.isArray(v.tips) &&
    Array.isArray(v.warnings) &&
    typeof v.budget === 'object' &&
    v.budget !== null &&
    Array.isArray((v.budget as Record<string, unknown>).lines)
  )
}

export async function generateTrip(request: TripRequest, signal?: AbortSignal): Promise<TripPlan> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(`${BASE}/api/trips/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: combined,
    })
  } catch (error) {
    if (signal?.aborted) throw error // the caller cancelled on purpose
    if (timeout.aborted) throw new TripError('timeout', 'The request timed out')
    throw new TripError('network', 'Could not reach the server')
  }

  if (response.status === 422) {
    const body: { detail?: unknown } = await response.json().catch(() => ({}))
    // Our own "no destinations match" error carries a plain string; field errors carry a list.
    throw new TripError(typeof body.detail === 'string' ? 'no_match' : 'validation', 'Invalid request')
  }
  if (!response.ok) throw new TripError('server', `Server error ${response.status}`)

  const data: unknown = await response.json().catch(() => null)
  if (!isTripPlan(data)) throw new TripError('server', 'Unexpected response from the server')
  return data
}
