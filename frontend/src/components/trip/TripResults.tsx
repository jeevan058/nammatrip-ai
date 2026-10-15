import { Check, Copy, ExternalLink, Pencil, Plus, Printer, Sparkles } from 'lucide-react'
import { forwardRef, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { fmt } from '../../i18n/strings'
import type { TripErrorKind } from '../../lib/api'
import type { Destination, TripPlan } from '../../types'
import { BudgetPanel } from './BudgetPanel'
import { DayTimeline } from './DayTimeline'
import { ErrorPanel } from './ErrorPanel'
import { googleRouteUrl, totalRoadKm } from './helpers'
import { tripToText } from './tripText'
import { TripSkeleton } from './TripSkeleton'

// Leaflet is only downloaded once a plan exists.
const TripMap = lazy(() => import('./TripMap'))

export type TripState =
  | { status: 'loading' }
  | { status: 'error'; kind: TripErrorKind }
  | { status: 'ready'; plan: TripPlan }

interface Props {
  state: TripState
  onOpen: (destination: Destination) => void
  onEdit: () => void
  onRetry: () => void
  onNewTrip: () => void
}

const actionClass =
  'no-print inline-flex items-center gap-2 rounded-full border border-forest px-4 py-2 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-ivory'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-sage-line bg-paper px-5 py-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-forest">{value}</p>
    </div>
  )
}

export const TripResults = forwardRef<HTMLElement, Props>(function TripResults(
  { state, onOpen, onEdit, onRetry, onNewTrip },
  ref,
) {
  const { lang, t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  async function copyPlan(plan: TripPlan) {
    try {
      await navigator.clipboard.writeText(tripToText(plan, t, lang))
      setCopied(true)
      window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the print button still works.
    }
  }

  function print() {
    // The map is sized in pixels, so narrow it to the page width, re-fit it and let
    // the tiles load before the print dialog opens. Everything is restored afterwards.
    const wrap = document.getElementById('trip-map-wrap')
    if (wrap) {
      wrap.style.width = '700px'
      window.dispatchEvent(new Event('nammatrip:fit-map'))
    }
    document.body.classList.add('print-trip')
    window.addEventListener(
      'afterprint',
      () => {
        document.body.classList.remove('print-trip')
        if (wrap) {
          wrap.style.width = ''
          window.dispatchEvent(new Event('nammatrip:fit-map'))
        }
      },
      { once: true },
    )
    window.setTimeout(() => window.print(), 700)
  }

  return (
    <section
      ref={ref}
      id="result"
      tabIndex={-1}
      aria-labelledby="result-title"
      className="scroll-mt-16 border-t border-sage-line bg-sage py-14 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 id="result-title" className="text-3xl font-semibold sm:text-4xl">
          {t.trip.title}
        </h2>

        <div className="mt-8">
          {state.status === 'loading' && <TripSkeleton />}
          {state.status === 'error' && <ErrorPanel kind={state.kind} onRetry={onRetry} onEdit={onEdit} />}
          {state.status === 'ready' && (
            <Ready plan={state.plan} copied={copied} onCopy={copyPlan} onPrint={print} {...{ onOpen, onEdit, onNewTrip }} />
          )}
        </div>
      </div>
    </section>
  )
})

function Ready({
  plan,
  copied,
  onCopy,
  onPrint,
  onOpen,
  onEdit,
  onNewTrip,
}: {
  plan: TripPlan
  copied: boolean
  onCopy: (plan: TripPlan) => void
  onPrint: () => void
  onOpen: (destination: Destination) => void
  onEdit: () => void
  onNewTrip: () => void
}) {
  const { t } = useLanguage()
  return (
    <div className="space-y-10">
      <div>
        <p className="max-w-[70ch] text-lg">{plan.summary}</p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-paper px-3.5 py-1.5 text-sm text-ink-soft">
          <Sparkles size={14} className="text-turmeric" aria-hidden="true" />
          {t.trip.source[plan.source]}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onEdit} className={actionClass}>
            <Pencil size={15} aria-hidden="true" />
            {t.trip.edit}
          </button>
          <button type="button" onClick={() => onCopy(plan)} className={actionClass}>
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            <span aria-live="polite">{copied ? t.trip.copied : t.trip.copy}</span>
          </button>
          <button type="button" onClick={onPrint} className={actionClass}>
            <Printer size={15} aria-hidden="true" />
            {t.trip.print}
          </button>
          <button type="button" onClick={onNewTrip} className={actionClass}>
            <Plus size={15} aria-hidden="true" />
            {t.trip.newTrip}
          </button>
        </div>
      </div>

      {plan.warnings.length > 0 && (
        <div className="rounded-md border-l-4 border-turmeric bg-paper px-5 py-4">
          <h3 className="font-semibold">{t.trip.warningsTitle}</h3>
          <ul className="mt-2 space-y-1.5 text-ink-soft">
            {plan.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t.trip.stats.days} value={String(plan.days.length)} />
        <Stat label={t.trip.stats.travellers} value={String(plan.request.travellers)} />
        <Stat label={t.trip.stats.stops} value={String(plan.stops.length)} />
        <Stat label={t.trip.stats.distance} value={fmt(t.trip.distanceValue, { km: totalRoadKm(plan).toLocaleString('en-IN') })} />
      </div>

      <section aria-labelledby="map-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 id="map-title" className="text-2xl font-semibold">
            {t.trip.map.title}
          </h3>
          <a
            href={googleRouteUrl(plan)}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print inline-flex items-center gap-1.5 text-sm font-medium text-forest underline-offset-4 hover:underline"
          >
            {t.trip.map.directions}
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
        <div id="trip-map-wrap" className="isolate mt-4 h-[26rem] overflow-hidden rounded-md border border-sage-line bg-paper">
          <Suspense fallback={<div className="size-full animate-pulse bg-sage-line/70" />}>
            <TripMap plan={plan} onOpen={onOpen} />
          </Suspense>
        </div>
        <p className="mt-2 text-sm text-ink-soft">{t.trip.map.note}</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <DayTimeline plan={plan} onOpen={onOpen} />
        <BudgetPanel plan={plan} />
      </div>

      {plan.tips.length > 0 && (
        <section aria-labelledby="tips-title">
          <h3 id="tips-title" className="text-2xl font-semibold">
            {t.trip.tips.title}
          </h3>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {plan.tips.map((tip) => (
              <li key={tip} className="flex gap-3 rounded-md bg-paper px-5 py-4 text-ink-soft">
                <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-turmeric" />
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
