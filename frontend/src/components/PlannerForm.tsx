
import {
  Bike,
  Bus,
  Camera,
  Car,
  Drama,
  Flower2,
  Landmark,
  MapPin,
  Mountain,
  PawPrint,
  RotateCcw,
  TrainFront,
  Trees,
  Utensils,
  Waves,
  CalendarDays,
  Users,
  Wallet,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ACCOMMODATIONS,
  INTERESTS,
  STYLES,
  TRANSPORTS,
  type Accommodation,
  type Interest,
  type Lang,
  type Transport,
  type TravelStyle,
  type TripRequest,
} from '../types'
import { MultiChoice, SingleChoice } from './ChoiceGroup'

const INTEREST_ICONS: Record<Interest, ReactNode> = {
  nature: <Trees size={18} />,
  heritage: <Landmark size={18} />,
  beaches: <Waves size={18} />,
  adventure: <Mountain size={18} />,
  wildlife: <PawPrint size={18} />,
  food: <Utensils size={18} />,
  culture: <Drama size={18} />,
  photography: <Camera size={18} />,
  spiritual: <Flower2 size={18} />,
}

const TRANSPORT_ICONS: Record<Transport, ReactNode> = {
  bus: <Bus size={18} />,
  train: <TrainFront size={18} />,
  car: <Car size={18} />,
  'two-wheeler': <Bike size={18} />,
}

interface FormState {
  startCity: string
  days: string
  travellers: string
  budget: string
  interests: Interest[]
  style: TravelStyle
  transport: Transport
  accommodation: Accommodation
}

type ErrorKey = 'startCity' | 'days' | 'travellers' | 'budget' | 'interests'
type Errors = Partial<Record<ErrorKey, true>>

interface LocationSuggestion {
  label: string
  lat: number
  lng: number
}

const INITIAL: FormState = {
  startCity: '',
  days: '3',
  travellers: '2',
  budget: '',
  interests: [],
  style: 'relaxing',
  transport: 'bus',
  accommodation: 'budget',
}

function wholeNumber(text: string): number | null {
  const trimmed = text.trim()
  if (!/^\d+$/.test(trimmed)) return null

  const value = Number(trimmed)
  return Number.isSafeInteger(value) ? value : null
}

function validate(form: FormState): Errors {
  const errors: Errors = {}

  if (form.startCity.trim().length < 2) {
    errors.startCity = true
  }

  const days = wholeNumber(form.days)
  if (days === null || days < 1 || days > 10) {
    errors.days = true
  }

  const travellers = wholeNumber(form.travellers)
  if (travellers === null || travellers < 1 || travellers > 12) {
    errors.travellers = true
  }

  const budget = wholeNumber(form.budget)
  if (budget === null || budget < 1000 || budget > 1_000_000) {
    errors.budget = true
  }

  if (form.interests.length === 0) {
    errors.interests = true
  }

  return errors
}

const FIRST_FIELD_IDS: Record<ErrorKey, string> = {
  startCity: 'start-city',
  days: 'days',
  travellers: 'travellers',
  budget: 'budget',
  interests: 'interests-first',
}

const FIELD_ORDER: ErrorKey[] = [
  'startCity',
  'days',
  'travellers',
  'budget',
  'interests',
]

const inputClass =
  'w-full rounded-xl border border-[#DCE3D8] bg-white px-4 py-3 text-base text-[#183A2B] outline-none transition duration-200 placeholder:text-[#849087] hover:border-[#8FA493] focus:border-[#28553D] focus:ring-4 focus:ring-[#28553D]/10 aria-[invalid=true]:border-red-500'

function Field({
  id,
  label,
  hint,
  error,
  icon,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#21392D]"
      >
        {icon && <span className="text-[#52745B]">{icon}</span>}
        {label}
      </label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      ) : (
        hint && (
          <p className="mt-2 text-xs leading-relaxed text-[#758176]">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function PlannerForm({
  onSubmit,
}: {
  onSubmit: (request: TripRequest) => void
}) {
  const { lang, t } = useLanguage()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [planLang, setPlanLang] = useState<Lang | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [attempted, setAttempted] = useState(false)
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isSearchingLocations, setIsSearchingLocations] = useState(false)

  useEffect(() => {
    const query = form.startCity.trim()
    if (query.length < 2 || selectedLocation?.label === query) {
      setLocationSuggestions([])
      setIsSearchingLocations(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsSearchingLocations(true)
      try {
        const params = new URLSearchParams({ q: query, limit: '6', lang: 'en' })
        const response = await fetch(
          `https://photon.komoot.io/api/?${params.toString()}`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error('Location search failed')

        const data: {
          features?: Array<{
            geometry?: { coordinates?: [number, number] }
            properties?: {
              name?: string
              city?: string
              town?: string
              village?: string
              state?: string
              country?: string
            }
          }>
        } = await response.json()

        const results = (data.features ?? []).flatMap((feature) => {
          const coordinates = feature.geometry?.coordinates
          const props = feature.properties
          const name = props?.name ?? props?.city ?? props?.town ?? props?.village
          if (!coordinates || !props || !name) return []

          const area = [
            props.city && props.city !== name ? props.city : undefined,
            props.town && props.town !== name && props.town !== props.city ? props.town : undefined,
            props.state,
            props.country,
          ].filter((part): part is string => Boolean(part))

          return [{
            label: [name, ...area].join(', '),
            lng: coordinates[0],
            lat: coordinates[1],
          }]
        })

        setLocationSuggestions(results)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setLocationSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) setIsSearchingLocations(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [form.startCity, selectedLocation])

  const effectiveLang = planLang ?? lang

  const errorText: Record<ErrorKey, string> = {
    startCity: t.form.errors.startCity,
    days: t.form.errors.days,
    travellers: t.form.errors.travellers,
    budget: t.form.errors.budget,
    interests: t.form.errors.interests,
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    const next = { ...form, [key]: value }
    setForm(next)

    if (attempted) setErrors(validate(next))
  }

  function toggleInterest(interest: Interest) {
    const has = form.interests.includes(interest)

    update(
      'interests',
      has
        ? form.interests.filter((item) => item !== interest)
        : [...form.interests, interest],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setAttempted(true)

    const found = validate(form)
    setErrors(found)

    const firstBad = FIELD_ORDER.find((key) => found[key])

    if (firstBad) {
      document.getElementById(FIRST_FIELD_IDS[firstBad])?.focus()
      return
    }

    onSubmit({
      start_city: form.startCity.trim(),
      ...(selectedLocation
        ? { start_lat: selectedLocation.lat, start_lng: selectedLocation.lng }
        : {}),
      days: wholeNumber(form.days)!,
      travellers: wholeNumber(form.travellers)!,
      budget_inr: wholeNumber(form.budget)!,
      interests: form.interests,
      style: form.style,
      transport: form.transport,
      accommodation: form.accommodation,
      language: effectiveLang,
    })
  }

  function reset() {
    setForm(INITIAL)
    setPlanLang(null)
    setErrors({})
    setAttempted(false)
    setSelectedLocation(null)
    setLocationSuggestions([])
    setIsSearchingLocations(false)
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <section
      id="plan"
      className="relative scroll-mt-16 overflow-hidden bg-[#F7F6F0] py-16 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-24 size-80 rounded-full bg-[#DDE6D9]/50 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 max-w-3xl sm:mb-14">
          <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#52745B]">
            <span className="h-px w-8 bg-[#D9A21B]" />
            YOUR JOURNEY, YOUR WAY
          </p>

          <h2 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#173D2B] sm:text-5xl lg:text-6xl">
            {t.form.title}
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#647267] sm:text-lg">
            {t.form.intro}
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
          <form
            noValidate
            onSubmit={handleSubmit}
            className="min-w-0 rounded-3xl border border-[#E1E5DC] bg-white p-5 shadow-[0_16px_60px_rgba(23,61,43,0.06)] sm:p-8 lg:p-10"
          >
            <div className="space-y-10">
              <section aria-labelledby="trip-basics-heading">
                <div className="mb-6 flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7EEE5] text-[#28553D]">
                    <MapPin size={21} />
                  </span>

                  <div>
                    <h3
                      id="trip-basics-heading"
                      className="text-xl font-semibold text-[#173D2B] sm:text-2xl"
                    >
                      {t.form.groupWhere}
                    </h3>
                    <p className="mt-1 text-sm text-[#788379]">
                      Start with the basics of your journey.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field
                      id="start-city"
                      label={t.form.startCity}
                      hint="Enter any city, town, village or starting location."
                      error={errors.startCity ? errorText.startCity : undefined}
                      icon={<MapPin size={16} />}
                    >
                      <div className="relative">
                        <input
                          id="start-city"
                          type="text"
                          autoComplete="off"
                          role="combobox"
                          aria-autocomplete="list"
                          aria-expanded={locationSuggestions.length > 0}
                          aria-controls="start-city-suggestions"
                          value={form.startCity}
                          onChange={(event) => {
                            setSelectedLocation(null)
                            update('startCity', event.target.value)
                          }}
                          aria-invalid={errors.startCity ? true : undefined}
                          aria-describedby={
                            errors.startCity ? 'start-city-error' : undefined
                          }
                          placeholder="e.g. Bengaluru, Hassan, or your town"
                          className={inputClass}
                        />
                        {isSearchingLocations && (
                          <p className="mt-2 text-xs text-[#758176]" role="status">
                            Searching locations?
                          </p>
                        )}
                        {locationSuggestions.length > 0 && (
                          <ul
                            id="start-city-suggestions"
                            role="listbox"
                            className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[#DCE3D8] bg-white p-1 shadow-lg"
                          >
                            {locationSuggestions.map((suggestion) => (
                              <li key={`${suggestion.label}-${suggestion.lat}-${suggestion.lng}`}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={selectedLocation?.label === suggestion.label}
                                  className="w-full rounded-lg px-3 py-3 text-left text-sm text-[#183A2B] hover:bg-[#F2F5EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28553D]"
                                  onClick={() => {
                                    setSelectedLocation(suggestion)
                                    update('startCity', suggestion.label)
                                    setLocationSuggestions([])
                                  }}
                                >
                                  <span className="block font-semibold">{suggestion.label.split(',')[0]}</span>
                                  <span className="mt-0.5 block text-xs text-[#758176]">{suggestion.label}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </Field>
                  </div>

                  <Field
                    id="days"
                    label={t.form.days}
                    hint="Choose between 1 and 10 days."
                    error={errors.days ? errorText.days : undefined}
                    icon={<CalendarDays size={16} />}
                  >
                    <input
                      id="days"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={10}
                      step={1}
                      value={form.days}
                      onChange={(event) => update('days', event.target.value)}
                      aria-invalid={errors.days ? true : undefined}
                      aria-describedby={errors.days ? 'days-error' : undefined}
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    id="travellers"
                    label={t.form.travellers}
                    hint="Choose between 1 and 12 travellers."
                    error={
                      errors.travellers ? errorText.travellers : undefined
                    }
                    icon={<Users size={16} />}
                  >
                    <input
                      id="travellers"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={12}
                      step={1}
                      value={form.travellers}
                      onChange={(event) =>
                        update('travellers', event.target.value)
                      }
                      aria-invalid={errors.travellers ? true : undefined}
                      aria-describedby={
                        errors.travellers ? 'travellers-error' : undefined
                      }
                      className={inputClass}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field
                      id="budget"
                      label={t.form.budget}
                      hint="Total trip budget: ₹1,000 to ₹10,00,000."
                      error={errors.budget ? errorText.budget : undefined}
                      icon={<Wallet size={16} />}
                    >
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-[#52745B]">
                          ₹
                        </span>

                        <input
                          id="budget"
                          type="number"
                          inputMode="numeric"
                          min={1000}
                          max={1000000}
                          step={1}
                          placeholder="e.g. 8000"
                          value={form.budget}
                          onChange={(event) =>
                            update('budget', event.target.value)
                          }
                          aria-invalid={errors.budget ? true : undefined}
                          aria-describedby={
                            errors.budget ? 'budget-error' : undefined
                          }
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              </section>

              <div className="h-px bg-[#E8ECE5]" />

              <section
                aria-labelledby="trip-interests-heading"
                className="space-y-7"
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7EDD4] text-[#86631A]">
                    <Sparkles size={21} />
                  </span>

                  <div>
                    <h3
                      id="trip-interests-heading"
                      className="text-xl font-semibold text-[#173D2B] sm:text-2xl"
                    >
                      {t.form.groupLike}
                    </h3>
                    <p className="mt-1 text-sm text-[#788379]">
                      Pick what makes a trip memorable for you.
                    </p>
                  </div>
                </div>

                <MultiChoice
                  name="interests"
                  legend={t.form.interests}
                  hint={t.form.interestsHint}
                  options={INTERESTS.map((value) => ({
                    value,
                    label: t.interests[value],
                    icon: INTEREST_ICONS[value],
                  }))}
                  values={form.interests}
                  onToggle={toggleInterest}
                  error={errors.interests ? errorText.interests : undefined}
                  errorId="interests-error"
                />

                <SingleChoice
                  name="style"
                  legend={t.form.style}
                  options={STYLES.map((value) => ({
                    value,
                    label: t.styles[value],
                  }))}
                  value={form.style}
                  onChange={(value) => update('style', value)}
                />
              </section>

              <div className="h-px bg-[#E8ECE5]" />

              <section
                aria-labelledby="trip-logistics-heading"
                className="space-y-7"
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7EEE5] text-[#28553D]">
                    <Bus size={21} />
                  </span>

                  <div>
                    <h3
                      id="trip-logistics-heading"
                      className="text-xl font-semibold text-[#173D2B] sm:text-2xl"
                    >
                      {t.form.groupTravel}
                    </h3>
                    <p className="mt-1 text-sm text-[#788379]">
                      Choose how you want to explore.
                    </p>
                  </div>
                </div>

                <SingleChoice
                  name="transport"
                  legend={t.form.transport}
                  options={TRANSPORTS.map((value) => ({
                    value,
                    label: t.transports[value],
                    icon: TRANSPORT_ICONS[value],
                  }))}
                  value={form.transport}
                  onChange={(value) => update('transport', value)}
                />

                <SingleChoice
                  name="accommodation"
                  legend={t.form.accommodation}
                  options={ACCOMMODATIONS.map((value) => ({
                    value,
                    label: t.accommodations[value],
                  }))}
                  value={form.accommodation}
                  onChange={(value) => update('accommodation', value)}
                />

                <SingleChoice
                  name="plan-language"
                  legend={t.form.language}
                  options={(['en', 'kn'] as Lang[]).map((value) => ({
                    value,
                    label: t.languages[value],
                    lang: value,
                  }))}
                  value={effectiveLang}
                  onChange={setPlanLang}
                />
              </section>
            </div>

            {hasErrors && (
              <p
                role="alert"
                className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {t.form.errors.summary}
              </p>
            )}

            <div className="mt-10 flex flex-col gap-3 border-t border-[#E8ECE5] pt-6 sm:flex-row sm:items-center">
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#173D2B] px-7 py-3.5 text-base font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#0F2A1D] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#173D2B]/20"
              >
                <Sparkles size={18} />
                {t.form.submit}
              </button>

              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-[#647267] transition hover:bg-[#F2F4EF] hover:text-[#173D2B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#173D2B]/15"
              >
                <RotateCcw size={16} />
                {t.form.reset}
              </button>
            </div>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl bg-[#173D2B] p-6 text-[#F8F6F0] sm:p-7">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-[#E7C46A]">
                <Sparkles size={23} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9C991]">
                YOUR NEXT ADVENTURE
              </p>

              <h3 className="mt-3 text-2xl font-semibold leading-tight">
                Karnataka, made personal.
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/75">
                Tell us what you love. We’ll help shape a journey around your
                time, budget and travel style.
              </p>

              <div className="mt-6 space-y-4 border-t border-white/15 pt-5">
                <div className="flex items-center gap-3 text-sm text-white/85">
                  <MapPin size={17} className="shrink-0 text-[#E7C46A]" />
                  <span className="break-words">
                    {form.startCity.trim() || 'Your starting point'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-white/85">
                  <CalendarDays
                    size={17}
                    className="shrink-0 text-[#E7C46A]"
                  />
                  {form.days || '—'} days to explore
                </div>

                <div className="flex items-center gap-3 text-sm text-white/85">
                  <Users size={17} className="shrink-0 text-[#E7C46A]" />
                  {form.travellers || '—'} travellers
                </div>

                <div className="flex items-center gap-3 text-sm text-white/85">
                  <Wallet size={17} className="shrink-0 text-[#E7C46A]" />
                  {form.budget
                    ? `₹${Number(form.budget).toLocaleString('en-IN')}`
                    : 'Set your budget'}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E1E5DC] bg-white p-5">
              <p className="text-sm font-semibold text-[#173D2B]">
                A little more you, a little less guesswork.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#758176]">
                Your choices help personalise the itinerary and its estimated
                trip budget.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
