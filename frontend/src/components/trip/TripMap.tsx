import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { useLanguage } from '../../i18n/LanguageContext'
import type { Destination, TripPlan } from '../../types'

interface Props {
  plan: TripPlan
  onOpen: (destination: Destination) => void
}

// Numbered pins drawn with CSS, so no marker image files are needed.
function pin(label: string, kind: 'stop' | 'start') {
  return L.divIcon({
    className: '',
    html: `<span class="map-pin map-pin-${kind}">${label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

function FitToStops({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    const fit = () => {
      map.invalidateSize({ animate: false })
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 10, animate: false })
    }
    fit()
    // The page is laid out at a different width when printing, so re-fit the map to it.
    const printQuery = window.matchMedia('print')
    const onPrint = (event: MediaQueryListEvent) => event.matches && fit()
    printQuery.addEventListener('change', onPrint)
    window.addEventListener('beforeprint', fit)
    window.addEventListener('nammatrip:fit-map', fit)
    return () => {
      printQuery.removeEventListener('change', onPrint)
      window.removeEventListener('beforeprint', fit)
      window.removeEventListener('nammatrip:fit-map', fit)
    }
  }, [map, points])
  return null
}

export default function TripMap({ plan, onOpen }: Props) {
  const { lang, t } = useLanguage()
  const start: [number, number] = [plan.start.lat, plan.start.lng]
  const stopPoints = plan.stops.map((s) => [s.lat, s.lng] as [number, number])
  const route = [start, ...stopPoints, start]
  const startName = lang === 'kn' ? (plan.start.name_kn ?? plan.start.name) : plan.start.name

  return (
    <MapContainer
      center={start}
      zoom={7}
      scrollWheelZoom={false}
      className="h-full w-full"
      aria-label={t.trip.map.title}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={18}
      />
      <FitToStops points={route} />
      <Polyline positions={route} pathOptions={{ color: '#173d2b', weight: 3, dashArray: '2 9', lineCap: 'round' }} />

      <Marker position={start} icon={pin('S', 'start')}>
        <Popup>
          <strong>{startName}</strong>
          <br />
          {t.trip.map.start}
        </Popup>
      </Marker>

      {plan.stops.map((stop, index) => (
        <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={pin(String(index + 1), 'stop')}>
          <Popup>
            <strong>{lang === 'kn' ? stop.name_kn : stop.name}</strong>
            <br />
            {stop.region}
            <br />
            <button
              type="button"
              onClick={() => onOpen(stop)}
              className="mt-1 font-semibold text-forest underline"
            >
              {t.trip.map.details}
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
