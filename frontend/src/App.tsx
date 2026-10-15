import { useCallback, useEffect, useRef, useState } from 'react'
import { DestinationDialog } from './components/DestinationDialog'
import { Destinations, type Filter } from './components/Destinations'
import { Experiences } from './components/Experiences'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { KannadaSection } from './components/KannadaSection'
import { Navbar } from './components/Navbar'
import { PlannerForm } from './components/PlannerForm'
import { TripResults, type TripState } from './components/trip/TripResults'
import { LanguageProvider } from './i18n/LanguageContext'
import { generateTrip, TripError } from './lib/api'
import { useDestinations } from './lib/useDestinations'
import type { Destination, Interest, TripRequest } from './types'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Page() {
  const { status, data: destinations, retry } = useDestinations()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Destination | null>(null)
  const [request, setRequest] = useState<TripRequest | null>(null)
  const [trip, setTrip] = useState<TripState | null>(null)
  const [formKey, setFormKey] = useState(0) // changing the key clears the form for a new trip
  const resultRef = useRef<HTMLElement>(null)
  const inflight = useRef<AbortController | null>(null)

  useEffect(() => () => inflight.current?.abort(), [])

  function pickExperience(interest: Interest) {
    setFilter(interest)
    scrollToId('destinations')
  }

  const run = useCallback((next: TripRequest) => {
    inflight.current?.abort() // a newer request replaces any one still running
    const controller = new AbortController()
    inflight.current = controller
    setRequest(next)
    setTrip({ status: 'loading' })
    // Wait one frame so the result section exists before scrolling to it.
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      resultRef.current?.focus({ preventScroll: true })
    })
    generateTrip(next, controller.signal).then(
      (plan) => {
        if (!controller.signal.aborted) setTrip({ status: 'ready', plan })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        setTrip({ status: 'error', kind: error instanceof TripError ? error.kind : 'server' })
      },
    )
  }, [])

  function newTrip() {
    inflight.current?.abort()
    setRequest(null)
    setTrip(null)
    setFormKey((key) => key + 1)
    scrollToId('plan')
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero destinationCount={status === 'ready' ? destinations.length : null} />
        <PlannerForm key={formKey} onSubmit={run} />
        {trip && (
          <TripResults
            ref={resultRef}
            state={trip}
            onOpen={setSelected}
            onEdit={() => scrollToId('plan')}
            onRetry={() => request && run(request)}
            onNewTrip={newTrip}
          />
        )}
        <Destinations
          status={status}
          destinations={destinations}
          filter={filter}
          onFilter={setFilter}
          onOpen={setSelected}
          onRetry={retry}
        />
        <Experiences destinations={destinations} onPick={pickExperience} />
        <HowItWorks />
        <KannadaSection />
      </main>
      <Footer />
      <DestinationDialog destination={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <Page />
    </LanguageProvider>
  )
}
