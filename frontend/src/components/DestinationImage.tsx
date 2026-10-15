import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { Destination } from '../types'
import { ContourArt } from './ContourArt'

interface Props {
  destination: Destination
  className?: string
  eager?: boolean
}

/**
 * Shows /images/destinations/<file> when it exists. If the file is missing or
 * fails to load, shows a contour-line panel with the place name in Kannada.
 */
export function DestinationImage({ destination, className = '', eager = false }: Props) {
  const { lang } = useLanguage()
  const [failed, setFailed] = useState(false)
  const name = lang === 'kn' ? destination.name_kn : destination.name

  if (failed) {
    return (
      <div
        role="img"
        aria-label={name}
        className={`relative isolate overflow-hidden bg-sage text-forest ${className}`}
      >
        <ContourArt seed={destination.id} className="absolute inset-0 -z-10 size-full opacity-60" />
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
      src={`/images/destinations/${destination.image}`}
      alt={name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}
