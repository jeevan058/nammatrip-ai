import { useMemo } from 'react'

function hashSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Topographic contour lines, generated from a seed so every destination gets
 * its own stable pattern. Used as the image fallback, so a missing photo still
 * looks designed instead of broken.
 */
export function ContourArt({ seed, className = '' }: { seed: string; className?: string }) {
  const paths = useMemo(() => {
    const rnd = mulberry32(hashSeed(seed))
    const a1 = 0.05 + rnd() * 0.06
    const a2 = 0.03 + rnd() * 0.05
    const k1 = 2 + Math.floor(rnd() * 3)
    const k2 = 3 + Math.floor(rnd() * 4)
    const p1 = rnd() * Math.PI * 2
    const p2 = rnd() * Math.PI * 2
    const cx = 200 + (rnd() - 0.5) * 80
    const cy = 200 + (rnd() - 0.5) * 80

    return Array.from({ length: 12 }, (_, i) => {
      const base = 22 + i * 18
      const points: string[] = []
      for (let s = 0; s <= 72; s += 1) {
        const theta = (s / 72) * Math.PI * 2
        const r =
          base *
          (1 + a1 * Math.sin(k1 * theta + p1 + i * 0.12) + a2 * Math.sin(k2 * theta + p2 - i * 0.09))
        points.push(`${(cx + r * Math.cos(theta)).toFixed(1)},${(cy + r * Math.sin(theta)).toFixed(1)}`)
      }
      return `M${points.join('L')}Z`
    })
  }, [seed])

  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="1.1" opacity={0.35 + (i % 3) * 0.15} />
      ))}
    </svg>
  )
}
