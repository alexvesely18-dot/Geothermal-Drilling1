'use client'

import { useState, useRef } from 'react'
import { SALTON_SEA_SITES } from '@/data/sites'

interface Props { selectedSiteId?: string | null }

// ── Coordinate system ────────────────────────────────────────────────────────
// viewBox 800 × 560  |  lat 31.9–34.1 (2.2°)  |  lng –117.8 to –114.6 (3.2°)
const VW = 800, VH = 560
const LAT_MAX = 34.1, LNG_MIN = -117.8
const SX = VW / 3.2   // 250 px/°
const SY = VH / 2.2   // 254.5 px/°

function px(lat: number, lng: number) {
  return { x: (lng - LNG_MIN) * SX, y: (LAT_MAX - lat) * SY }
}
function pts(...c: [number, number][]) {
  return c.map(([la, lo]) => { const p = px(la, lo); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
}

// ── Seismic color ────────────────────────────────────────────────────────────
const SEISMIC: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }

// ── Geographic shapes (approximate) ─────────────────────────────────────────

// Pacific coast line N→S (defines left boundary of land)
const COAST: [number, number][] = [
  [34.10, -117.65], [33.95, -117.67], [33.75, -117.70], [33.55, -117.69],
  [33.35, -117.56], [33.15, -117.45], [32.95, -117.28], [32.75, -117.18],
  [32.58, -117.10], [32.40, -116.98], [32.20, -116.88], [31.90, -116.62],
]

// Pacific Ocean: left of coastline + corners
const OCEAN_PTS = [
  '0,0',
  ...COAST.map(([la, lo]) => { const p = px(la, lo); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }),
  `0,${VH}`,
].join(' ')

// Gulf of California (bottom-right corner hint)
const GULF_PTS = pts(
  [32.30, -115.10], [32.10, -114.90], [31.90, -114.72],
  [31.90, -114.60], [32.50, -114.60], [32.65, -115.00], [32.50, -115.10],
)

// Western mountains (Peninsular/Transverse Ranges — from coast ridge to valley)
const W_MTNS_PTS = pts(
  [34.10, -117.65], [34.10, -116.00],
  [33.90, -116.10], [33.70, -116.30], [33.50, -116.50],
  [33.30, -116.60], [33.10, -116.70], [32.90, -116.80],
  [32.70, -116.85], [32.50, -116.75], [32.30, -116.65],
  [32.10, -116.58], [31.90, -116.62],
  // return up coast
  [32.20, -116.88], [32.40, -116.98], [32.58, -117.10],
  [32.75, -117.18], [32.95, -117.28], [33.15, -117.45],
  [33.35, -117.56], [33.55, -117.69], [33.75, -117.70],
  [33.95, -117.67],
)

// Mountain ridgeline highlight (slightly darker strip on eastern slope)
const W_RIDGE_PTS = pts(
  [34.10, -116.45], [34.10, -116.00],
  [33.90, -116.10], [33.70, -116.30], [33.50, -116.50],
  [33.30, -116.60], [33.10, -116.70], [32.90, -116.80],
  [32.70, -116.85], [32.50, -116.75], [32.30, -116.65],
  [32.10, -116.58], [31.90, -116.62],
  [31.90, -116.85],
  [32.10, -116.78], [32.30, -116.85], [32.50, -116.95],
  [32.70, -117.05], [32.90, -117.00], [33.10, -116.90],
  [33.30, -116.80], [33.50, -116.70], [33.70, -116.50],
  [33.90, -116.30], [34.10, -116.60],
)

// Eastern mountains (Chocolate/Eagle/Orocopia)
const E_MTNS_PTS = pts(
  [34.10, -115.40], [34.10, -114.60], [31.90, -114.60],
  [31.90, -115.00], [32.10, -115.05], [32.30, -115.10],
  [32.50, -115.10], [32.70, -115.08], [32.90, -115.00],
  [33.10, -115.05], [33.30, -115.15], [33.50, -115.22],
  [33.70, -115.30], [33.90, -115.36],
)

// Valley floor (the low-lying basin)
const VALLEY_PTS = pts(
  [34.10, -116.00], [34.10, -115.40],
  [33.90, -115.36], [33.70, -115.30], [33.50, -115.22],
  [33.30, -115.15], [33.10, -115.05], [32.90, -115.00],
  [32.70, -115.08], [32.50, -115.10], [32.30, -115.10],
  [32.10, -115.05], [31.90, -115.00],
  [31.90, -116.62],
  [32.10, -116.58], [32.30, -116.65], [32.50, -116.75],
  [32.70, -116.85], [32.90, -116.80], [33.10, -116.70],
  [33.30, -116.60], [33.50, -116.50], [33.70, -116.30],
  [33.90, -116.10],
)

// Agricultural / Irrigated farmland (Imperial & Coachella valleys)
const FARM_PTS = pts(
  [33.55, -116.20], [33.55, -115.42], [33.10, -115.42],
  [32.90, -115.40], [32.70, -115.42], [32.50, -115.44],
  [32.30, -115.40], [32.10, -115.42], [31.90, -115.45],
  [31.90, -116.30], [32.10, -116.25], [32.30, -116.20],
  [32.50, -116.15], [32.70, -116.20], [32.90, -116.22],
  [33.10, -116.25], [33.30, -116.18],
)

// Salton Sea detailed outline
const SEA_PTS = pts(
  [33.52, -115.88], [33.48, -115.78], [33.43, -115.68],
  [33.38, -115.58], [33.30, -115.53], [33.20, -115.52],
  [33.10, -115.52], [33.02, -115.55], [32.97, -115.63],
  [32.95, -115.73], [32.98, -115.83], [33.05, -115.91],
  [33.13, -115.97], [33.22, -116.01], [33.30, -115.97],
  [33.38, -115.93], [33.44, -115.92], [33.50, -115.90],
)

// Coachella Canal (east of Salton Sea)
const CANAL_E = [
  px(33.50, -115.50), px(33.35, -115.45), px(33.18, -115.44),
  px(33.00, -115.48), px(32.82, -115.52),
]

// Alamo River (N→S into Salton Sea south end)
const ALAMO = [
  px(32.60, -115.62), px(32.72, -115.64), px(32.88, -115.68), px(32.97, -115.73),
]

// New River
const NEW_RIVER = [
  px(32.40, -115.50), px(32.55, -115.53), px(32.70, -115.55), px(32.88, -115.60), px(32.97, -115.63),
]

// SR-111 highway (rough, runs along east side of Salton Sea)
const HWY_111 = [
  px(33.50, -115.60), px(33.30, -115.58), px(33.10, -115.56),
  px(32.95, -115.60), px(32.80, -115.58), px(32.70, -115.58),
]

// US-Mexico border line (at ~32.53°N)
const BORDER_Y = (LAT_MAX - 32.534) * SY  // ≈ 400px

// Cities for context
const CITIES = [
  { name: 'Palm Springs', lat: 33.83, lng: -116.55, size: 'sm' },
  { name: 'Indio',        lat: 33.72, lng: -116.22, size: 'xs' },
  { name: 'Coachella',   lat: 33.68, lng: -116.17, size: 'xs' },
  { name: 'Salton City', lat: 33.29, lng: -115.96, size: 'xs' },
  { name: 'Brawley',     lat: 32.98, lng: -115.52, size: 'xs' },
  { name: 'El Centro',   lat: 32.79, lng: -115.56, size: 'xs' },
  { name: 'Mexicali',    lat: 32.66, lng: -115.47, size: 'xs', dim: true },
  { name: 'San Diego',   lat: 32.72, lng: -117.16, size: 'sm' },
]

// ── Topo contour ring helper ──────────────────────────────────────────────────
// Approximate contour ellipses centered on basin low point (~33.2, -115.77)
const BASIN_CX = px(33.22, -115.76).x
const BASIN_CY = px(33.22, -115.76).y

export default function SaltonSeaMap({ selectedSiteId }: Props) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  function toSVG(clientX: number, clientY: number) {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: (clientX - r.left) * (VW / r.width), y: (clientY - r.top) * (VH / r.height) }
  }

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return
    const dSvgX = (e.clientX - dragStart.current.mx) * (VW / svgRef.current!.getBoundingClientRect().width)
    const dSvgY = (e.clientY - dragStart.current.my) * (VH / svgRef.current!.getBoundingClientRect().height)
    setPan({ x: dragStart.current.px + dSvgX, y: dragStart.current.py + dSvgY })
  }

  function onMouseUp() { isDragging.current = false }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const { x: svgX, y: svgY } = toSVG(e.clientX, e.clientY)
    const factor = e.deltaY > 0 ? 0.85 : 1.18
    const newZoom = Math.min(10, Math.max(0.4, zoom * factor))
    const ratio = newZoom / zoom
    setPan({ x: svgX - (svgX - pan.x) * ratio, y: svgY - (svgY - pan.y) * ratio })
    setZoom(newZoom)
  }

  function zoomAt(factor: number) {
    const svgX = VW / 2, svgY = VH / 2
    const newZoom = Math.min(10, Math.max(0.4, zoom * factor))
    const ratio = newZoom / zoom
    setPan({ x: svgX - (svgX - pan.x) * ratio, y: svgY - (svgY - pan.y) * ratio })
    setZoom(newZoom)
  }

  function reset() { setZoom(1); setPan({ x: 0, y: 0 }) }

  const transform = `translate(${pan.x.toFixed(2)},${pan.y.toFixed(2)}) scale(${zoom.toFixed(4)})`

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-[#c8dce8]"
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-full"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        style={{ userSelect: 'none', display: 'block' }}
      >
        <defs>
          {/* Ocean gradient */}
          <linearGradient id="oceanGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#4a8fb0" />
            <stop offset="100%" stopColor="#7ab8d4" />
          </linearGradient>
          {/* Gulf gradient */}
          <linearGradient id="gulfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7ab8d4" />
            <stop offset="100%" stopColor="#4a8fb0" />
          </linearGradient>
          {/* Mountain gradient */}
          <linearGradient id="mtnGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#a07840" />
            <stop offset="60%"  stopColor="#b89050" />
            <stop offset="100%" stopColor="#c8a860" />
          </linearGradient>
          {/* Sea gradient (depth) */}
          <radialGradient id="seaGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stopColor="#3a88c8" />
            <stop offset="60%"  stopColor="#5ba8d4" />
            <stop offset="100%" stopColor="#7ec0e0" />
          </radialGradient>
          {/* Selected site pulse */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Clip for map boundary */}
          <clipPath id="mapClip">
            <rect x="0" y="0" width={VW} height={VH} />
          </clipPath>
        </defs>

        {/* ── All pannable/zoomable map content ── */}
        <g transform={transform} clipPath="url(#mapClip)">

          {/* 1. Land base */}
          <rect x={-200} y={-200} width={VW + 400} height={VH + 400} fill="#ddd4a4" />

          {/* 2. Pacific Ocean */}
          <polygon points={OCEAN_PTS} fill="url(#oceanGrad)" />
          {/* Ocean wave pattern */}
          {[80, 160, 240, 320, 400, 480].map(y => (
            <path key={y}
              d={`M 0 ${y} Q 25 ${y - 6} 50 ${y} Q 75 ${y + 6} 100 ${y} Q 125 ${y - 4} 150 ${y}`}
              fill="none" stroke="#5a9ab8" strokeWidth="0.6" opacity="0.3"
            />
          ))}

          {/* 3. Gulf of California (bottom-right) */}
          <polygon points={GULF_PTS} fill="url(#gulfGrad)" opacity="0.9" />

          {/* 4. Western mountains */}
          <polygon points={W_MTNS_PTS} fill="url(#mtnGrad)" />
          {/* Ridge highlight (darker cap) */}
          <polygon points={W_RIDGE_PTS} fill="#8a6028" opacity="0.45" />
          {/* Mountain texture lines */}
          {[-80, -50, -20, 10, 40, 70, 100, 130].map((offset, i) => (
            <line key={i}
              x1={80 + offset * 0.3} y1={i * 68}
              x2={140 + offset * 0.3} y2={i * 68 + 60}
              stroke="#7a5020" strokeWidth="0.5" opacity="0.25"
            />
          ))}

          {/* 5. Eastern mountains */}
          <polygon points={E_MTNS_PTS} fill="url(#mtnGrad)" />

          {/* 6. Valley floor */}
          <polygon points={VALLEY_PTS} fill="#e0d4a0" />

          {/* 7. Farmland / irrigated areas */}
          <polygon points={FARM_PTS} fill="#c8d494" opacity="0.75" />
          {/* Farm grid pattern */}
          {Array.from({ length: 18 }, (_, i) => (
            <g key={`fg${i}`} opacity="0.18">
              <line x1={350} y1={230 + i * 18} x2={700} y2={230 + i * 18} stroke="#5a7832" strokeWidth="0.6" />
              <line x1={350 + i * 20} y1={230} x2={350 + i * 20} y2={560} stroke="#5a7832" strokeWidth="0.6" />
            </g>
          ))}

          {/* 8. Topographic contour rings (elevation bands around basin) */}
          {[
            { rx: 290, ry: 210, stroke: '#c0a850', width: 0.8, dash: '6,4' },
            { rx: 220, ry: 158, stroke: '#b89840', width: 0.7, dash: '5,5' },
            { rx: 155, ry: 108, stroke: '#b09030', width: 0.7, dash: '4,6' },
            { rx: 100, ry:  68, stroke: '#a88828', width: 0.8, dash: '4,4' },
          ].map(({ rx, ry, stroke, width, dash }, i) => (
            <ellipse key={i}
              cx={BASIN_CX} cy={BASIN_CY}
              rx={rx} ry={ry}
              fill="none" stroke={stroke} strokeWidth={width}
              strokeDasharray={dash} opacity="0.5"
            />
          ))}

          {/* 9. Salton Sea */}
          <polygon points={SEA_PTS} fill="url(#seaGrad)" />
          {/* Sea shoreline */}
          <polygon points={SEA_PTS} fill="none" stroke="#3a78b8" strokeWidth="0.8" opacity="0.6" />
          {/* Sea wave shimmer */}
          <ellipse cx={px(33.22, -115.76).x} cy={px(33.22, -115.76).y}
            rx="52" ry="32" fill="white" opacity="0.07" />
          <ellipse cx={px(33.35, -115.70).x} cy={px(33.35, -115.70).y}
            rx="28" ry="15" fill="white" opacity="0.06" />

          {/* 10. Rivers & canals */}
          <polyline
            points={CANAL_E.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="none" stroke="#5a98c0" strokeWidth="1.2" opacity="0.6"
          />
          <polyline
            points={ALAMO.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="none" stroke="#5a98c0" strokeWidth="0.9" opacity="0.5"
          />
          <polyline
            points={NEW_RIVER.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="none" stroke="#5a98c0" strokeWidth="0.9" opacity="0.45"
          />

          {/* 11. Road (SR-111) */}
          <polyline
            points={HWY_111.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="none" stroke="#e8c060" strokeWidth="1.4" opacity="0.55"
            strokeDasharray="8,2"
          />

          {/* 12. US–Mexico border */}
          <line x1={0} y1={BORDER_Y} x2={VW} y2={BORDER_Y}
            stroke="#cc4444" strokeWidth="1.2" strokeDasharray="10,5" opacity="0.5" />
          <text x={12} y={BORDER_Y - 5}
            fontSize="7.5" fill="#cc4444" fontFamily="system-ui,sans-serif"
            opacity="0.7" fontWeight="600" letterSpacing="0.8">US — MEXICO</text>

          {/* 13. Region labels */}
          <text x={px(33.95, -117.0).x} y={px(33.95, -117.0).y}
            fontSize="9" fill="#3a6a90" fontFamily="system-ui,sans-serif"
            fontStyle="italic" textAnchor="middle" opacity="0.85">
            Pacific Ocean
          </text>
          <text x={px(33.25, -115.74).x} y={px(33.25, -115.74).y}
            fontSize="8.5" fill="#2a6890" fontFamily="system-ui,sans-serif"
            fontStyle="italic" textAnchor="middle" opacity="0.9">
            Salton Sea
          </text>
          <text x={px(33.25, -115.74).x} y={px(33.25, -115.74).y + 11}
            fontSize="6.5" fill="#2a6890" fontFamily="system-ui,sans-serif"
            fontStyle="italic" textAnchor="middle" opacity="0.65">
            –71 m elev.
          </text>
          <text x={px(32.20, -115.05).x} y={px(32.20, -115.05).y}
            fontSize="8" fill="#3a6a90" fontFamily="system-ui,sans-serif"
            fontStyle="italic" textAnchor="middle" opacity="0.7">
            Gulf of California
          </text>
          <text x={px(33.65, -116.55).x} y={px(33.65, -116.55).y}
            fontSize="7.5" fill="#6a4a10" fontFamily="system-ui,sans-serif"
            textAnchor="middle" opacity="0.7" transform={`rotate(-45,${px(33.65, -116.55).x},${px(33.65, -116.55).y})`}>
            San Jacinto Mtns
          </text>
          <text x={px(33.20, -115.12).x} y={px(33.20, -115.12).y}
            fontSize="7" fill="#6a4a10" fontFamily="system-ui,sans-serif"
            textAnchor="middle" opacity="0.65" transform={`rotate(-72,${px(33.20, -115.12).x},${px(33.20, -115.12).y})`}>
            Chocolate Mtns
          </text>
          <text x={px(32.85, -116.38).x} y={px(32.85, -116.38).y}
            fontSize="7.5" fill="#5a7832" fontFamily="system-ui,sans-serif"
            textAnchor="middle" opacity="0.75">
            Imperial Valley
          </text>
          <text x={px(33.55, -116.25).x} y={px(33.55, -116.25).y}
            fontSize="7.5" fill="#5a7832" fontFamily="system-ui,sans-serif"
            textAnchor="middle" opacity="0.7">
            Coachella Valley
          </text>

          {/* 14. City dots */}
          {CITIES.map(city => {
            const cp = px(city.lat, city.lng)
            return (
              <g key={city.name}>
                <circle cx={cp.x} cy={cp.y} r={city.size === 'sm' ? 2.5 : 1.8}
                  fill={city.dim ? '#aaa' : '#555'} />
                <text x={cp.x + 5} y={cp.y + 4}
                  fontSize={city.size === 'sm' ? '7.5' : '6.5'}
                  fill={city.dim ? '#999' : '#444'}
                  fontFamily="system-ui,sans-serif"
                  fontStyle={city.dim ? 'italic' : 'normal'}>
                  {city.name}
                </text>
              </g>
            )
          })}

          {/* 15. Geothermal sites */}
          {SALTON_SEA_SITES.map(site => {
            const sp = px(site.lat, site.lng)
            const sel = site.id === selectedSiteId
            const hov = site.id === hoveredId
            const col = SEISMIC[site.seismicityLevel]
            return (
              <g key={site.id}
                onMouseEnter={() => setHoveredId(site.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'pointer' }}>
                {/* Pulse ring for selected */}
                {sel && (
                  <>
                    <circle cx={sp.x} cy={sp.y} r={22} fill={col} opacity="0.12" />
                    <circle cx={sp.x} cy={sp.y} r={16} fill={col} opacity="0.18" />
                  </>
                )}
                {/* Halo for hover */}
                {hov && !sel && (
                  <circle cx={sp.x} cy={sp.y} r={14} fill={col} opacity="0.15" />
                )}
                {/* Site marker */}
                <circle cx={sp.x} cy={sp.y}
                  r={sel ? 9 : hov ? 7 : 6}
                  fill={sel ? col : '#fff'}
                  stroke={col}
                  strokeWidth={sel ? 2.5 : 2}
                  filter={sel ? 'url(#glow)' : undefined}
                />
                {/* Inner dot for unselected */}
                {!sel && <circle cx={sp.x} cy={sp.y} r={2.5} fill={col} />}
                {/* Label */}
                <text
                  x={sp.x + (sel ? 13 : 11)}
                  y={sp.y + 4}
                  fontSize={sel ? '8.5' : '7.5'}
                  fill={sel ? '#111' : '#444'}
                  fontWeight={sel ? '700' : '400'}
                  fontFamily="system-ui,sans-serif"
                  stroke="rgba(255,255,255,0.6)" strokeWidth="2" paintOrder="stroke"
                >
                  {site.name.split(' ').slice(0, 2).join(' ')}
                </text>
                {/* Tooltip on hover */}
                {hov && !sel && (
                  <g>
                    <rect x={sp.x - 35} y={sp.y - 30} width="80" height="22"
                      rx="4" fill="#1a1a2e" opacity="0.88" />
                    <text x={sp.x + 5} y={sp.y - 16}
                      fontSize="7.5" fill="white" textAnchor="middle"
                      fontFamily="system-ui,sans-serif">
                      {site.seismicityLevel} seismic · {site.resourceQuality}/100
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </g>

        {/* ── Fixed overlays (not affected by pan/zoom) ── */}

        {/* Compass rose */}
        <g transform={`translate(${VW - 36}, 36)`}>
          <circle r="18" fill="white" fillOpacity="0.82" stroke="#ccc" strokeWidth="0.5" />
          {['N','S','E','W'].map((dir, i) => {
            const angles = [-90, 90, 0, 180]
            const angle = angles[i] * Math.PI / 180
            return (
              <text key={dir}
                x={Math.cos(angle) * 11} y={Math.sin(angle) * 11 + 4}
                fontSize={dir === 'N' ? '9' : '7'}
                fill={dir === 'N' ? '#cc3333' : '#555'}
                fontWeight={dir === 'N' ? '800' : '600'}
                textAnchor="middle" fontFamily="system-ui,sans-serif">
                {dir}
              </text>
            )
          })}
          {/* Needle */}
          <path d="M0,-14 L3,2 L0,0 L-3,2 Z" fill="#cc3333" />
          <path d="M0,14 L3,2 L0,0 L-3,2 Z" fill="#aaa" />
        </g>

        {/* Legend */}
        <g transform="translate(8, 8)">
          <rect width="108" height="74" rx="5" fill="white" fillOpacity="0.88"
            stroke="#ddd" strokeWidth="0.5" />
          <text x="8" y="18" fontSize="8" fontWeight="700" fill="#333"
            fontFamily="system-ui,sans-serif" letterSpacing="0.3">SEISMIC RISK</text>
          {(['low', 'medium', 'high'] as const).map((level, i) => (
            <g key={level} transform={`translate(8, ${32 + i * 16})`}>
              <circle r="4.5" fill={SEISMIC[level]} />
              <text x="10" y="4" fontSize="8" fill="#444"
                fontFamily="system-ui,sans-serif">
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </text>
            </g>
          ))}
        </g>

        {/* Scale bar */}
        <g transform={`translate(${VW / 2 - 50}, ${VH - 20})`}>
          <rect width="100" height="6" rx="1" fill="white" fillOpacity="0.75" />
          <rect width="50"  height="6" rx="1" fill="#666" fillOpacity="0.7" />
          <text x="0"   y="16" fontSize="7" fill="#555" textAnchor="middle"
            fontFamily="monospace">0</text>
          <text x="50"  y="16" fontSize="7" fill="#555" textAnchor="middle"
            fontFamily="monospace">20 km</text>
          <text x="100" y="16" fontSize="7" fill="#555" textAnchor="middle"
            fontFamily="monospace">40 km</text>
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        {[
          { label: '+', action: () => zoomAt(1.35) },
          { label: '−', action: () => zoomAt(0.75) },
          { label: '⟳', action: reset },
        ].map(({ label, action }) => (
          <button key={label} onClick={action}
            className="w-7 h-7 rounded-md bg-white/90 border border-gray-200 shadow-sm
              text-gray-700 text-sm font-semibold hover:bg-white active:bg-gray-100
              flex items-center justify-center transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hint label */}
      <div className="absolute top-2 right-10 text-xs text-white/50 pointer-events-none
        bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
        scroll to zoom · drag to pan
      </div>
    </div>
  )
}
