
import { Clock, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { fmt } from '../i18n/strings'
import { INTERESTS, type Destination, type Interest } from '../types'
import { DestinationImage } from './DestinationImage'

export type Filter = Interest | 'all'

interface Props {
  status: 'loading' | 'ready' | 'error'
  destinations: Destination[]
  filter: Filter
  onFilter: (filter: Filter) => void
  onOpen: (destination: Destination) => void
  onRetry: () => void
}

const INITIAL_COUNT = 5

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${active
          ? 'border-forest bg-forest text-ivory'
          : 'border-sage-line bg-paper text-ink-soft hover:border-forest hover:text-forest'
        }`}
    >
      {children}
    </button>
  )
}

function Card({
  destination,
  index,
  onOpen,
}: {
  destination: Destination
  index: number
  onOpen: (d: Destination) => void
}) {
  const { lang, t } = useLanguage()

  const name = lang === 'kn' ? destination.name_kn : destination.name
  const description =
    lang === 'kn' ? destination.description_kn : destination.description

  const imageFirst = index % 2 === 0

  return (
    <article className="group relative grid items-center gap-5 sm:gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
      <div
        className={`relative aspect-[5/4] overflow-hidden rounded-sm bg-sage sm:aspect-[16/10] ${imageFirst ? 'md:order-1' : 'md:order-2'
          }`}
      >
        <DestinationImage
          destination={destination}
          className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-deep/35 via-transparent to-transparent"
          aria-hidden="true"
        />

        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-ivory/35 bg-forest/80 px-3 py-1.5 text-xs font-medium text-ivory backdrop-blur-sm">
          <Clock size={13} aria-hidden="true" />
          {fmt(t.destinations.duration, {
            h: destination.suggested_duration_hours,
          })}
        </span>
      </div>

      <div
        className={`relative py-1 sm:py-3 ${imageFirst ? 'md:order-2' : 'md:order-1'
          }`}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
          {destination.region}
        </p>

        <h3 className="max-w-[18ch] text-2xl font-semibold leading-tight tracking-tight text-forest sm:text-3xl lg:text-4xl">
          <button
            type="button"
            onClick={() => onOpen(destination)}
            aria-label={`${name}: ${t.destinations.open}`}
            className="text-left transition-colors hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            {name}
          </button>
        </h3>

        <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-ink-soft">
          {description}
        </p>

        <button
          type="button"
          onClick={() => onOpen(destination)}
          className="mt-6 inline-flex items-center gap-2 border-b border-forest/30 pb-1.5 text-sm font-semibold text-forest transition-colors hover:border-terracotta hover:text-terracotta"
        >
          {t.destinations.open}
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

function Skeletons() {
  return (
    <div className="journey-road space-y-12 sm:space-y-16" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="journey-stop grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-8"
        >
          <div className="journey-index flex size-11 animate-pulse items-center justify-center rounded-full bg-sage sm:size-16" />

          <div className="grid animate-pulse gap-5 md:grid-cols-2 md:gap-10">
            <div className="aspect-[5/4] rounded-sm bg-sage sm:aspect-[16/10]" />
            <div className="space-y-4 py-2">
              <div className="h-3 w-1/3 rounded bg-sage" />
              <div className="h-8 w-3/4 rounded bg-sage" />
              <div className="h-4 w-full rounded bg-sage" />
              <div className="h-4 w-5/6 rounded bg-sage" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Destinations({
  status,
  destinations,
  filter,
  onFilter,
  onOpen,
  onRetry,
}: Props) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  const present = INTERESTS.filter((interest) =>
    destinations.some((destination) =>
      destination.categories.includes(interest),
    ),
  )

  const filtered =
    filter === 'all'
      ? destinations
      : destinations.filter((destination) =>
        destination.categories.includes(filter),
      )

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT)

  return (
    <section
      id="destinations"
      className="scroll-mt-16 border-t border-sage-line bg-ivory py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end md:gap-10">
          <div className="max-w-3xl">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              <span className="inline-block h-px w-8 bg-terracotta" />
              Discover Karnataka
            </p>

            <h2 className="max-w-[16ch] text-4xl font-semibold leading-tight tracking-tight text-forest sm:text-5xl lg:text-6xl">
              {t.destinations.title}
            </h2>

            <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-ink-soft sm:text-lg">
              {t.destinations.intro}
            </p>
          </div>

          <div className="route-rule hidden w-32 self-center md:block" aria-hidden="true" />
        </div>

        {status === 'ready' && (
          <div
            className="mt-8 flex flex-wrap gap-2"
            role="group"
            aria-label={t.destinations.title}
          >
            <Chip active={filter === 'all'} onClick={() => onFilter('all')}>
              {t.destinations.all}
            </Chip>

            {present.map((interest) => (
              <Chip
                key={interest}
                active={filter === interest}
                onClick={() => onFilter(interest)}
              >
                {t.interests[interest]}
              </Chip>
            ))}
          </div>
        )}

        <div className="route-rule mt-8 md:mt-10" aria-hidden="true" />

        <div className="mt-10 sm:mt-14">
          {status === 'loading' && <Skeletons />}

          {status === 'error' && (
            <div
              role="alert"
              className="rounded-md border border-sage-line bg-paper px-6 py-8 sm:px-8"
            >
              <p className="max-w-[50ch] font-medium text-forest">
                {t.destinations.loadError}
              </p>

              <button
                type="button"
                onClick={onRetry}
                className="mt-5 rounded-full bg-forest px-6 py-3 font-semibold text-ivory transition-colors hover:bg-forest-deep"
              >
                {t.destinations.retry}
              </button>
            </div>
          )}

          {status === 'ready' && filtered.length === 0 && (
            <p className="rounded-md bg-sage px-6 py-5 text-ink-soft">
              {t.destinations.empty}
            </p>
          )}

          {status === 'ready' && filtered.length > 0 && (
            <>
              <div className="journey-road space-y-14 sm:space-y-20 lg:space-y-24">
                {visible.map((destination, index) => (
                  <div
                    key={destination.id}
                    className="journey-stop grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-8"
                  >
                    <div
                      className="journey-index relative z-10 flex size-11 items-center justify-center self-start rounded-full border border-sage-line bg-ivory font-display text-lg text-forest sm:size-16 sm:text-2xl"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <Card
                      destination={destination}
                      index={index}
                      onOpen={onOpen}
                    />
                  </div>
                ))}
              </div>

              {filtered.length > INITIAL_COUNT && (
                <div className="mt-16 flex justify-center sm:mt-20">
                  <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="btn btn-outline"
                  >
                    {expanded
                      ? t.destinations.showFewer
                      : fmt(t.destinations.showAll, { n: filtered.length })}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
