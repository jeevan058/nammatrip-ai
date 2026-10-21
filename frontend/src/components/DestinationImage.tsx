
import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { Destination } from '../types'
import { ContourArt } from './ContourArt'

interface Props {
  destination: Destination
  className?: string
  eager?: boolean
}

const HERO_IMAGES: Record<string, string> = {
  mysuru: 'mysuru-palace-hero.png',
  coorg: 'coorg-hero.jpg',
  hampi: 'hampi-hero.png',
  chikkamagaluru: 'chikkamagaluru-hero.png',
  gokarna: 'gokarna-hero.png',
  'jog-falls': 'jog-falls-hero.png',
  bengaluru: 'bengaluru-hero.png',
  badami: 'badami-hero.png',
  pattadakal: 'pattadakal-hero.png',
  udupi: 'udupi-hero.png',
  bandipur: 'bandipur-hero.png',
  'belur-halebidu': 'belur-temple-hero.png',
  channapatna: 'channapatna-hero.png',
  shivamogga: 'shivamogga-hero.png',
}

export function DestinationImage({
  destination,
  className = '',
  eager = false,
}: Props) {
  const { lang } = useLanguage()
  const [failed, setFailed] = useState(false)
  const name = lang === 'kn' ? destination.name_kn : destination.name
  const heroImage = HERO_IMAGES[destination.id]

  const imageSrc = heroImage
    ? `/images/hero/${heroImage}`
    : `/images/destinations/${destination.image}`

  if (failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className={`relative isolate overflow-hidden bg-sage text-forest ${className}`}
      >
        <ContourArt
          seed={destination.id}
          className="absolute inset-0 -z-10 size-full opacity-60"
        />
        <span
          lang="kn"
          className="absolute bottom-3 left-4 font-kannada text-3xl font-bold leading-tight text-forest sm:text-4xl"
        >
          {destination.name_kn}
        </span>
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}
