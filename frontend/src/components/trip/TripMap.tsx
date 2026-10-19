
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { useLanguage } from '../../i18n/LanguageContext'
import type { Destination, TripPlan } from '../../types'

interface Props {
  plan: TripPlan
  onOpen: (destination: Destination) => void
}

type LatLng = [number, number]

function pin(label: string, kind: 'stop' | 'start') {
  return L.divIcon({
    className: '',
    html: `<span class="map-pin map-pin-${kind}">${label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

function FitToStops({ points }: { points: LatLng[] }) {
  const map = useMap()

  useEffect(() => {
    const fit = () => {
      map.invalidateSize({ animate: false })

      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), {
          padding: [48, 48],
          maxZoom: 10,
          animate: false,
        })
      }
    }

    fit()

    const printQuery = window.matchMedia('print')
    const onPrint = (event: MediaQueryListEvent) => {
      if (event.matches) fit()
    }

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

function RoadRoute({
  points,
}: {
  points: LatLng[]
}) {
  const [roadPoints, setRoadPoints] = useState<LatLng[] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadRoute() {
      setRoadPoints(null)

      if (points.length < 2) {
        setRoadPoints(points)
        return
      }

      try {
        // OSRM expects longitude,latitude for each waypoint.
        const coordinates = points
          .map(([lat, lng]) => `${lng},${lat}`)
          .join(';')

        const url =
          `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
          '?overview=full&geometries=geojson&steps=false'

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Road route request failed')
        }

        const data = await response.json()

        if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) {
          throw new Error('No road route returned')
        }

        const routeCoordinates = data.routes[0].geometry.coordinates as [
          number,
          number,
        ][]

        const result: LatLng[] = routeCoordinates.map(([lng, lat]) => [
          lat,
          lng,
        ])

        if (!cancelled) setRoadPoints(result)
      } catch {
        // Keep the map usable when the routing service is unavailable.
        // Do not present straight-line segments as actual roads.
        if (!cancelled) setRoadPoints([])
      }
    }

    void loadRoute()

    return () => {
      cancelled = true
    }
  }, [points])

  if (!roadPoints || roadPoints.length === 0) return null

  return (
    <Polyline
      positions={roadPoints}
      pathOptions={{
        color: '#173d2b',
        weight: 4,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  )
}

export default function TripMap({ plan, onOpen }: Props) {
  const { lang, t } = useLanguage()

  const start: LatLng = [plan.start.lat, plan.start.lng]

  const stopPoints: LatLng[] = plan.stops.map(
    (stop) => [stop.lat, stop.lng],
  )

  // Visit the selected stops in itinerary order, then return to the start.
  const routePoints: LatLng[] = [start, ...stopPoints, start]

  const startName =
    lang === 'kn'
      ? plan.start.name_kn ?? plan.start.name
      : plan.start.name

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

      <FitToStops points={routePoints} />

      <RoadRoute points={routePoints} />

      <Marker position={start} icon={pin('S', 'start')}>
        <Popup>
          <strong>{startName}</strong>
          <br />
          {t.trip.map.start}
        </Popup>
      </Marker>

      {plan.stops.map((stop, index) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={pin(String(index + 1), 'stop')}
        >
          <Popup>
            <strong>
              {lang === 'kn' ? stop.name_kn : stop.name}
            </strong>
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
