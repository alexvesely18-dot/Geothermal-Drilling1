'use client'
import { SALTON_SEA_SITES } from '@/data/sites'

interface Props {
  selectedSiteId?: string | null
}

// ViewBox 400×500 | lat 32.55–33.55 (500 px/°) | lng -116.15–-115.15 (400 px/°)
function toXY(lat: number, lng: number) {
  return {
    x: Math.round((lng + 116.15) * 400),
    y: Math.round((33.55 - lat) * 500),
  }
}

const SEA_OUTLINE = [
  [33.52, -115.95], [33.45, -115.85], [33.35, -115.73], [33.22, -115.65],
  [33.10, -115.62], [33.00, -115.62], [32.85, -115.55], [32.65, -115.50],
  [32.70, -115.65], [32.85, -115.78], [33.00, -115.82], [33.15, -115.88],
  [33.35, -115.95],
] as [number, number][]

const seaPoints = SEA_OUTLINE.map(([lat, lng]) => {
  const p = toXY(lat, lng)
  return `${p.x},${p.y}`
}).join(' ')

const SEISMIC_COLOR: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
}

export default function SaltonSeaMap({ selectedSiteId }: Props) {
  return (
    <div className="relative w-full h-full min-h-[320px]">
      <svg
        viewBox="0 0 400 500"
        className="w-full h-full"
        style={{ background: '#f0e8d0' }}
      >
        {/* Terrain grid lines */}
        {[100, 200, 300, 400].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="#e0d5b0" strokeWidth="0.5" />
        ))}
        {[100, 200, 300].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#e0d5b0" strokeWidth="0.5" />
        ))}

        {/* Salton Sea body */}
        <polygon
          points={seaPoints}
          fill="#60a5fa"
          fillOpacity="0.65"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />

        {/* Region label */}
        <text x="90" y="260" fontSize="9" fill="#6b7280" fontStyle="italic" textAnchor="middle">
          Salton
        </text>
        <text x="90" y="271" fontSize="9" fill="#6b7280" fontStyle="italic" textAnchor="middle">
          Sea
        </text>

        {/* Compass rose */}
        <text x="370" y="20" fontSize="10" fill="#9ca3af" textAnchor="middle" fontWeight="bold">N</text>
        <line x1="370" y1="22" x2="370" y2="35" stroke="#9ca3af" strokeWidth="1" />

        {/* Sites */}
        {SALTON_SEA_SITES.map((site) => {
          const pos = toXY(site.lat, site.lng)
          const selected = site.id === selectedSiteId
          const color = SEISMIC_COLOR[site.seismicityLevel]
          return (
            <g key={site.id}>
              {selected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={14}
                  fill={color}
                  fillOpacity="0.2"
                  stroke={color}
                  strokeWidth="1"
                  strokeDasharray="3,2"
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={selected ? 7 : 5}
                fill={selected ? color : '#fff'}
                stroke={color}
                strokeWidth={selected ? 2 : 2}
              />
              <text
                x={pos.x + 10}
                y={pos.y + 4}
                fontSize="8"
                fill={selected ? '#111827' : '#6b7280'}
                fontWeight={selected ? 'bold' : 'normal'}
              >
                {site.name.split(' ').slice(0, 2).join(' ')}
              </text>
            </g>
          )
        })}

        {/* Legend */}
        <rect x="4" y="458" width="130" height="40" rx="3" fill="white" fillOpacity="0.85" />
        {(['low', 'medium', 'high'] as const).map((level, i) => (
          <g key={level}>
            <circle cx={14} cy={468 + i * 10} r={4} fill={SEISMIC_COLOR[level]} />
            <text x={22} y={472 + i * 10} fontSize="8" fill="#374151">
              {level.charAt(0).toUpperCase() + level.slice(1)} seismic risk
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
