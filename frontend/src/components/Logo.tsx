import { useLanguage } from '../i18n/LanguageContext'

/**
 * NammaTrip mark: an "N" drawn as one continuous route. It starts at a hollow
 * origin ring, climbs the left stem, cuts across like a Western Ghats ridge,
 * and ends in a turmeric pin (the Karnataka-flag yellow) as the N's right stem.
 */
export function LogoMark({
  tone = 'onDark',
  className = 'size-9',
}: {
  tone?: 'onDark' | 'onLight'
  className?: string
}) {
  const stroke = tone === 'onDark' ? '#F8F6F0' : '#173D2B'
  const hole = tone === 'onDark' ? '#173D2B' : '#F8F6F0'
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <circle cx="19" cy="52" r="3.4" fill="none" stroke={stroke} strokeWidth="3" />
      <path
        d="M19 41 V22 L45 47 V35"
        fill="none"
        stroke={stroke}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45 33 C45 33 35.5 25.5 35.5 18.5 a9.5 9.5 0 0 1 19 0 C54.5 25.5 45 33 45 33 Z"
        fill="#D9A21B"
      />
      <circle cx="45" cy="18.5" r="3.4" fill={hole} />
    </svg>
  )
}

export function Logo({
  className = '',
  tone = 'onDark',
  iconOnly = false,
}: {
  className?: string
  tone?: 'onDark' | 'onLight'
  iconOnly?: boolean
}) {
  const { t } = useLanguage()
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark tone={tone} />
      {!iconOnly && (
        <span className="font-display text-[1.35rem] font-bold leading-none tracking-tight">
          {t.brand}
          <span className="ml-1.5 align-[0.12em] text-[0.62em] font-bold tracking-[0.14em] text-turmeric">
            AI
          </span>
        </span>
      )}
    </span>
  )
}