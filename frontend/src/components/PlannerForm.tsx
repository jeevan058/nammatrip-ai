import {
  Bike,
  Bus,
  Camera,
  Car,
  Drama,
  Flower2,
  Landmark,
  Mountain,
  PawPrint,
  RotateCcw,
  TrainFront,
  Trees,
  Utensils,
  Waves,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
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
  nature: <Trees size={16} />,
  heritage: <Landmark size={16} />,
  beaches: <Waves size={16} />,
  adventure: <Mountain size={16} />,
  wildlife: <PawPrint size={16} />,
  food: <Utensils size={16} />,
  culture: <Drama size={16} />,
  photography: <Camera size={16} />,
  spiritual: <Flower2 size={16} />,
}

const TRANSPORT_ICONS: Record<Transport, ReactNode> = {
  bus: <Bus size={16} />,
  train: <TrainFront size={16} />,
  car: <Car size={16} />,
  'two-wheeler': <Bike size={16} />,
}

const START_CITIES = [
  'Bengaluru',
  'Mysuru',
  'Mangaluru',
  'Hubballi',
  'Belagavi',
  'Kalaburagi',
  'Hyderabad',
  'Chennai',
  'Mumbai',
  'Goa',
]

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
  if (!/^\d+$/.test(text.trim())) return null
  return Number(text)
}

function validate(form: FormState): Errors {
  const errors: Errors = {}
  if (form.startCity.trim().length < 2) errors.startCity = true
  const days = wholeNumber(form.days)
  if (days === null || days < 1 || days > 10) errors.days = true
  const travellers = wholeNumber(form.travellers)
  if (travellers === null || travellers < 1 || travellers > 12) errors.travellers = true
  const budget = wholeNumber(form.budget)
  if (budget === null || budget < 1000 || budget > 1_000_000) errors.budget = true
  if (form.interests.length === 0) errors.interests = true
  return errors
}

const FIRST_FIELD_IDS: Record<ErrorKey, string> = {
  startCity: 'start-city',
  days: 'days',
  travellers: 'travellers',
  budget: 'budget',
  interests: 'interests-first',
}
const FIELD_ORDER: ErrorKey[] = ['startCity', 'days', 'travellers', 'budget', 'interests']

const inputClass =
  'w-full rounded-sm border border-sage-line bg-ivory px-3.5 py-2.5 text-base text-ink placeholder:text-ink-soft/60 ' +
  'transition-colors hover:border-forest focus:border-forest aria-[invalid=true]:border-danger'

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.95rem] font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-ink-soft">{hint}</p>
      )}
    </div>
  )
}

export function PlannerForm({ onSubmit }: { onSubmit: (request: TripRequest) => void }) {
  const { lang, t } = useLanguage()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [planLang, setPlanLang] = useState<Lang | null>(null) // null = follow interface language
  const [errors, setErrors] = useState<Errors>({})
  const [attempted, setAttempted] = useState(false)

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
    if (attempted) setErrors(validate(next)) // re-check live once the user has tried to submit
  }

  function toggleInterest(interest: Interest) {
    const has = form.interests.includes(interest)
    update(
      'interests',
      has ? form.interests.filter((i) => i !== interest) : [...form.interests, interest],
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
      days: Number(form.days),
      travellers: Number(form.travellers),
      budget_inr: Number(form.budget),
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
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <section id="plan" className="scroll-mt-16 bg-ivory py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-3xl font-semibold sm:text-4xl">{t.form.title}</h2>
          <p className="mt-4 max-w-[44ch] text-ink-soft">{t.form.intro}</p>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="rounded-lg border border-sage-line bg-paper p-6 sm:p-9"
        >
          <div className="space-y-9">
            <div>
              <h3 className="mb-4 text-xl font-semibold">{t.form.groupWhere}</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    id="start-city"
                    label={t.form.startCity}
                    hint={t.form.startCityHint}
                    error={errors.startCity ? errorText.startCity : undefined}
                  >
                    <input
                      id="start-city"
                      list="start-city-options"
                      autoComplete="off"
                      value={form.startCity}
                      onChange={(e) => update('startCity', e.target.value)}
                      aria-invalid={errors.startCity ? true : undefined}
                      aria-describedby={errors.startCity ? 'start-city-error' : undefined}
                      className={inputClass}
                    />
                    <datalist id="start-city-options">
                      {START_CITIES.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </Field>
                </div>
                <Field
                  id="days"
                  label={t.form.days}
                  error={errors.days ? errorText.days : undefined}
                >
                  <input
                    id="days"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={10}
                    value={form.days}
                    onChange={(e) => update('days', e.target.value)}
                    aria-invalid={errors.days ? true : undefined}
                    aria-describedby={errors.days ? 'days-error' : undefined}
                    className={inputClass}
                  />
                </Field>
                <Field
                  id="travellers"
                  label={t.form.travellers}
                  error={errors.travellers ? errorText.travellers : undefined}
                >
                  <input
                    id="travellers"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={12}
                    value={form.travellers}
                    onChange={(e) => update('travellers', e.target.value)}
                    aria-invalid={errors.travellers ? true : undefined}
                    aria-describedby={errors.travellers ? 'travellers-error' : undefined}
                    className={inputClass}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    id="budget"
                    label={t.form.budget}
                    hint={t.form.budgetHint}
                    error={errors.budget ? errorText.budget : undefined}
                  >
                    <input
                      id="budget"
                      type="number"
                      inputMode="numeric"
                      min={1000}
                      step={500}
                      placeholder="8000"
                      value={form.budget}
                      onChange={(e) => update('budget', e.target.value)}
                      aria-invalid={errors.budget ? true : undefined}
                      aria-describedby={errors.budget ? 'budget-error' : undefined}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">{t.form.groupLike}</h3>
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
                options={STYLES.map((value) => ({ value, label: t.styles[value] }))}
                value={form.style}
                onChange={(v) => update('style', v)}
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">{t.form.groupTravel}</h3>
              <SingleChoice
                name="transport"
                legend={t.form.transport}
                options={TRANSPORTS.map((value) => ({
                  value,
                  label: t.transports[value],
                  icon: TRANSPORT_ICONS[value],
                }))}
                value={form.transport}
                onChange={(v) => update('transport', v)}
              />
              <SingleChoice
                name="accommodation"
                legend={t.form.accommodation}
                options={ACCOMMODATIONS.map((value) => ({ value, label: t.accommodations[value] }))}
                value={form.accommodation}
                onChange={(v) => update('accommodation', v)}
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
            </div>
          </div>

          {hasErrors && (
            <p role="alert" className="mt-8 rounded-sm bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {t.form.errors.summary}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-forest px-8 py-3.5 text-base font-semibold text-ivory transition-colors hover:bg-forest-deep"
            >
              {t.form.submit}
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-base font-medium text-ink-soft transition-colors hover:text-forest"
            >
              <RotateCcw size={16} />
              {t.form.reset}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
