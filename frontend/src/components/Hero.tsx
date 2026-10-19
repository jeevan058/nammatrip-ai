
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { fmt } from '../i18n/strings'
import { ContourArt } from './ContourArt'

const PIN_PATH =
  'M66 44C66 44 52 34 52 26a14 14 0 1 1 28 0C80 34 66 44 66 44ZM66 20.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 1 0 0-11Z'

const HERO_IMAGES = [
  '/images/hero/coorg-hero.jpg',
  '/images/hero/hampi-hero.png',
  '/images/hero/jog-falls-hero.png',
  '/images/hero/gokarna-hero.png',
  '/images/hero/mysuru-palace-hero.png',
  '/images/hero/chikkamagaluru-hero.png',
  '/images/hero/badami-hero.png',
  '/images/hero/udupi-hero.png',
  '/images/hero/bandipur-hero.png',
  '/images/hero/belur-temple-hero.png',
  '/images/hero/pattadakal-hero.png',
  '/images/hero/bengaluru-hero.png',
  '/images/hero/shivamogga-hero.png',
  '/images/hero/channapatna-hero.png',
]

export function Hero({ destinationCount }: { destinationCount: number | null }) {
  const { t } = useLanguage()
  const [activeImage, setActiveImage] = useState(0)
  const [failedImages, setFailedImages] = useState<string[]>([])
  const [reducedMotion, setReducedMotion] = useState(false)
  const heroRef = useRef<HTMLElement | null>(null)

  const availableImages = HERO_IMAGES.filter(
    (image) => !failedImages.includes(image),
  )

  const currentImage = availableImages.length
    ? availableImages[activeImage % availableImages.length]
    : null

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)

    update()
    media.addEventListener('change', update)

    return () => media.removeEventListener('change', update)
  }, [])

  // Change the hero image every 4 seconds.
  useEffect(() => {
    if (reducedMotion || availableImages.length < 2) return

    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % availableImages.length)
    }, 4000)

    return () => window.clearInterval(interval)
  }, [availableImages.length, reducedMotion])

  // Preserve the existing scroll parallax effect.
  useEffect(() => {
    const updateParallax = () => {
      const hero = heroRef.current
      if (!hero) return

      const offset = Math.max(
        0,
        Math.min(70, -hero.getBoundingClientRect().top * 0.12),
      )

      hero.style.setProperty('--hero-parallax-y', `${offset}px`)
    }

    window.addEventListener('scroll', updateParallax, { passive: true })
    updateParallax()

    return () => window.removeEventListener('scroll', updateParallax)
  }, [])

  const handleImageError = (image: string) => {
    setFailedImages((current) =>
      current.includes(image) ? current : [...current, image],
    )
    setActiveImage(0)
  }

  return (
    <section
      id="top"
      ref={heroRef}
      className="hero-cinema surface-dark relative isolate min-h-[88vh] overflow-hidden bg-forest text-ivory"
    >
      {/* Local destination photos */}
      <div
        className="hero-parallax pointer-events-none absolute -inset-[5%] z-0"
        aria-hidden="true"
      >
        {currentImage ? (
          <img
            key={currentImage}
            src={currentImage}
            alt=""
            fetchPriority="high"
            onError={() => handleImageError(currentImage)}
            className={`hero-slideshow-image absolute inset-0 size-full object-cover object-center ${reducedMotion ? 'hero-slideshow-static' : ''
              }`}
          />
        ) : (
          <ContourArt
            seed="karnataka-hero"
            className="absolute inset-0 size-full text-turmeric/60"
          />
        )}
      </div>

      {/* Reduced overlay: destination photographs stay more visible. */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-forest-deep/70 via-forest-deep/40 to-forest/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-forest-deep/60 via-forest-deep/5 to-transparent"
        aria-hidden="true"
      />

      {/* Animated route line and destination pins */}
      <svg
        viewBox="0 0 1440 760"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 z-0 size-full opacity-60 sm:opacity-80"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M1390 720 C1240 695 1280 600 1160 570 S950 600 1015 490 S1240 385 1110 300 S900 245 965 155 S1015 105 920 55"
          pathLength={1}
          stroke="#F8F6F0"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.012 0.018"
          opacity={0.55}
        />

        <path
          d="M1390 720 C1240 695 1280 600 1160 570 S950 600 1015 490 S1240 385 1110 300 S900 245 965 155 S1015 105 920 55"
          pathLength={1}
          stroke="#F8F6F0"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hero-route"
        />

        <circle
          className="hero-origin"
          cx={1390}
          cy={720}
          r={8}
          fill="#E37E55"
        />
        <circle
          className="hero-stop"
          cx={1160}
          cy={570}
          r={6}
          fill="#F8F6F0"
        />
        <circle
          className="hero-stop"
          cx={1015}
          cy={490}
          r={6}
          fill="#D9A21B"
        />
        <circle
          className="hero-stop"
          cx={1110}
          cy={300}
          r={6}
          fill="#F8F6F0"
        />

        <g
          className="hero-pin"
          transform="translate(920 55) scale(1.65) translate(-66 -44)"
        >
          <path d={PIN_PATH} fill="#D9A21B" fillRule="evenodd" />
        </g>
      </svg>

      {/* Existing hero content and translations */}
      <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl items-end px-5 pb-14 pt-32 sm:px-8 sm:pb-20 lg:pb-24">
        <div className="w-full max-w-3xl">
          <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-ivory/75 sm:text-xs">
            <span className="inline-block h-px w-9 bg-turmeric" />
            NammaTrip AI
            <span className="text-ivory/45">/</span>
            Karnataka, your way
          </p>

          <p
            lang="kn"
            className="animate-rise font-kannada text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.4] text-turmeric"
          >
            {t.hero.kannadaTitle}
          </p>

          <h1 className="mt-3 max-w-[17ch] text-[clamp(2.5rem,6.3vw,5.5rem)] font-semibold leading-[1.02] tracking-tight text-ivory">
            {t.hero.headline}
          </h1>

          <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-ivory/80 sm:text-lg">
            {t.hero.sub}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#plan" className="btn btn-accent">
              {t.hero.primary}
            </a>
            <a href="#destinations" className="btn btn-outline-light">
              {t.hero.secondary}
            </a>
          </div>

          <div className="mt-10 flex items-center gap-3 border-t border-ivory/20 pt-5 sm:mt-12">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-turmeric/60 text-turmeric"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>

            <p className="max-w-[52ch] text-sm leading-relaxed text-ivory/70">
              {destinationCount
                ? fmt(t.hero.facts, { n: destinationCount })
                : t.hero.factsLoading}
            </p>
          </div>
        </div>
      </div>

      {/* Quiet section marker */}
      <div className="pointer-events-none absolute bottom-5 right-6 z-10 hidden items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-ivory/55 sm:flex lg:right-10">
        <span>Explore Karnataka</span>
        <span className="h-px w-8 bg-ivory/40" />
      </div>
    </section>
  )
}
