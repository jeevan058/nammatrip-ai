
export const INTERESTS = [
  'nature',
  'heritage',
  'beaches',
  'adventure',
  'wildlife',
  'food',
  'culture',
  'photography',
  'spiritual',
] as const
export type Interest = (typeof INTERESTS)[number]

export const STYLES = [
  'relaxing',
  'adventurous',
  'cultural',
  'family-friendly',
  'romantic',
  'budget-friendly',
] as const
export type TravelStyle = (typeof STYLES)[number]

export const TRANSPORTS = ['bus', 'train', 'car', 'two-wheeler'] as const
export type Transport = (typeof TRANSPORTS)[number]

export const ACCOMMODATIONS = ['budget', 'midrange', 'premium'] as const
export type Accommodation = (typeof ACCOMMODATIONS)[number]

export type Lang = 'en' | 'kn'

/** Mirrors backend/app/schemas.py TripRequest. */
export interface TripRequest {
  start_city: string
  start_lat?: number
  start_lng?: number
  days: number
  budget_inr: number
  travellers: number
  interests: Interest[]
  style: TravelStyle
  transport: Transport
  accommodation: Accommodation
  language: Lang
}

/** Mirrors backend/app/schemas.py Destination. */
export interface Destination {
  id: string
  name: string
  name_kn: string
  region: string
  lat: number
  lng: number
  categories: Interest[]
  description: string
  description_kn: string
  suggested_duration_hours: number
  activity_cost_inr: { min: number; max: number }
  best_season: string
  highlights: string[]
  food: string[]
  practical_notes: string[]
  nearby: string[]
  image: string
}

/** Mirrors backend/app/schemas.py itinerary models. */
export type Slot = 'morning' | 'afternoon' | 'evening'
export const SLOTS: Slot[] = ['morning', 'afternoon', 'evening']

export interface Activity {
  slot: Slot
  destination_id: string
  title: string
  description: string
}

export interface DayPlan {
  day: number
  theme: string
  destination_ids: string[]
  activities: Activity[]
  food: string[]
  stay_note: string | null
}

export interface TravelLeg {
  day: number
  from_name: string
  to_name: string
  from_id: string | null
  to_id: string | null
  straight_km: number
  est_road_km: number
  approx_hours: number
  is_estimate: boolean
}

export type BudgetCategory =
  | 'transportation'
  | 'accommodation'
  | 'food'
  | 'activities'
  | 'local_transport'
  | 'buffer'

export interface BudgetLine {
  category: BudgetCategory
  amount_inr: number
  basis: string
}

export interface BudgetSuggestion {
  kind: 'cheaper_accommodation' | 'cheaper_transport' | 'fewer_days'
  saving_inr: number
  detail: string
}

export interface BudgetBreakdown {
  lines: BudgetLine[]
  total_inr: number
  budget_inr: number
  difference_inr: number
  within_budget: boolean
  disclaimer: string
  suggestions: BudgetSuggestion[]
}

export interface TripPlan {
  request: TripRequest
  start: {
    name: string
    name_kn: string | null
    lat: number
    lng: number
    assumed: boolean
  }
  summary: string
  days: DayPlan[]
  stops: Destination[]
  legs: TravelLeg[]
  budget: BudgetBreakdown
  tips: string[]
  warnings: string[]
  source: 'llm' | 'fallback'
  fallback_reason: string | null
  estimates_note: string
}
