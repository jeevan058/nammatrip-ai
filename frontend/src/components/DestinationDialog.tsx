import { ExternalLink, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { Destination } from '../types'
import { DestinationImage } from './DestinationImage'

interface Props {
  destination: Destination | null
  onClose: () => void
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-ink-soft">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden="true" className="mt-[0.65em] size-1.5 shrink-0 rounded-full bg-turmeric" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DestinationDialog({ destination, onClose }: Props) {
  const { lang, t } = useLanguage()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (destination && !dialog.open) dialog.showModal()
    if (!destination && dialog.open) dialog.close()
  }, [destination])

  const d = destination
  const googleUrl = d
    ? `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`
    : '#'
  const osmUrl = d
    ? `https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lng}#map=11/${d.lat}/${d.lng}`
    : '#'

  return (
    <dialog
      ref={ref}
      aria-labelledby="destination-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close()
      }}
      className="m-auto max-h-[92vh] w-[min(94vw,52rem)] overflow-y-auto rounded-lg bg-paper p-0 text-ink"
    >
      {d && (
        <div>
          <div className="relative">
            <DestinationImage destination={d} eager className="aspect-[16/8] w-full" />
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label={t.destinations.close}
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-forest text-ivory transition-colors hover:bg-forest-deep"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8 p-6 sm:p-9">
            <header>
              <h2 id="destination-dialog-title" className="text-3xl font-semibold sm:text-4xl">
                {lang === 'kn' ? d.name_kn : d.name}
              </h2>
              <p className="mt-1 text-ink-soft">
                {lang === 'kn' ? d.name : d.name_kn} · {d.region}
              </p>
              <p className="mt-4 max-w-[62ch]">{lang === 'kn' ? d.description_kn : d.description}</p>
            </header>

            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="font-semibold">{t.destinations.bestSeason}</dt>
                <dd className="mt-1 text-ink-soft">{d.best_season}</dd>
              </div>
              <div>
                <dt className="font-semibold">{t.destinations.cost}</dt>
                <dd className="mt-1 text-ink-soft">
                  ₹{d.activity_cost_inr.min.toLocaleString('en-IN')} to ₹
                  {d.activity_cost_inr.max.toLocaleString('en-IN')}
                  <span className="block text-sm">{t.destinations.costNote}</span>
                </dd>
              </div>
            </dl>

            <div className="grid gap-8 sm:grid-cols-2">
              <ListBlock title={t.destinations.highlights} items={d.highlights} />
              <ListBlock title={t.destinations.food} items={d.food} />
            </div>
            <ListBlock title={t.destinations.notes} items={d.practical_notes} />

            <div className="flex flex-wrap items-center gap-3 border-t border-sage-line pt-6">
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 font-semibold text-ivory transition-colors hover:bg-forest-deep"
              >
                {t.destinations.openGoogle}
                <ExternalLink size={16} />
              </a>
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-forest px-6 py-3 font-medium text-forest transition-colors hover:bg-forest hover:text-ivory"
              >
                {t.destinations.openOsm}
                <ExternalLink size={16} />
              </a>
              <span className="text-sm text-ink-soft">{t.destinations.coordsNote}</span>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
