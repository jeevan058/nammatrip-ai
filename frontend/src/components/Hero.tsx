import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { fmt } from '../i18n/strings'
import { ContourArt } from './ContourArt'

// The destination pin from the NammaTrip logo.
const PIN_PATH =
  'M66 44C66 44 52 34 52 26a14 14 0 1 1 28 0C80 34 66 44 66 44ZM66 20.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 1 0 0-11Z'

export function Hero({ destinationCount }: { destinationCount: number | null }) {
  const { t } = useLanguage()
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <section id="top" className="surface-dark bg-forest text-ivory">
      <div className="mx-auto grid max-w-7xl items-end gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.3fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div>
          <p
            lang="kn"
            className="animate-rise font-kannada text-[clamp(2.25rem,4.6vw,3.75rem)] font-bold leading-[1.4] text-turmeric"
          >
            {t.hero.kannadaTitle}
          </p>
          <h1 className="mt-5 max-w-[24ch] text-3xl font-semibold sm:text-4xl lg:text-[2.9rem]">
            {t.hero.headline}
          </h1>
          <p className="mt-5 max-w-[56ch] text-lg text-ivory/80">{t.hero.sub}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#plan" className="btn btn-accent">
              {t.hero.primary}
            </a>
            <a href="#destinations" className="btn btn-outline-light">
              {t.hero.secondary}
            </a>
          </div>

          <p className="mt-8 max-w-[56ch] text-sm text-ivory/65">
            {destinationCount ? fmt(t.hero.facts, { n: destinationCount }) : t.hero.factsLoading}
          </p>
        </div>

        <div className="mx-auto w-full max-w-md animate-fade lg:max-w-none">
          <div className="relative isolate aspect-[4/5] overflow-hidden rounded-t-full bg-forest-deep">
            {imageFailed ? (
              <>
                <ContourArt seed="karnataka-hero" className="absolute inset-0 size-full text-turmeric/70" />
                {/* The logo's journey: a road that winds up to a destination pin, drawn once on load. */}
                <svg viewBox="0 0 400 500" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
                  <path
                    d="M80 430C200 410 330 380 250 320S70 300 140 230 330 200 250 150 210 125 268 112"
                    pathLength={1}
                    fill="none"
                    stroke="#F8F6F0"
                    strokeWidth={9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="hero-route"
                  />
                  <circle cx={80} cy={430} r={11} fill="#E37E55" />
                  <g className="hero-pin" transform="translate(268 112) scale(1.9) translate(-66 -44)">
                    <path d={PIN_PATH} fill="#D9A21B" fillRule="evenodd" />
                  </g>
                </svg>
              </>
            ) : (
              <img
                src="/images/hero.jpg"
                alt={t.hero.imageAlt}
                fetchPriority="high"
                onError={() => setImageFailed(true)}
                className="size-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}