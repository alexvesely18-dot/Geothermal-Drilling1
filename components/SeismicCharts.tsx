'use client'

import { SALTON_SEA_SITES } from '@/data/sites'

function sc(v: number, dMin: number, dMax: number, rMin: number, rMax: number): number {
  if (dMax === dMin) return (rMin + rMax) / 2
  return rMin + ((v - dMin) / (dMax - dMin)) * (rMax - rMin)
}

const SITE_COLORS: Record<string, string> = {
  'brawley-zone':          '#ef4444',
  'salton-sea-geothermal': '#f97316',
  'calipatria-north':      '#eab308',
  'east-mesa':             '#22c55e',
  'heber':                 '#06b6d4',
}

const SITE_SHORT: Record<string, string> = {
  'brawley-zone':          'Brawley',
  'salton-sea-geothermal': 'Salton Sea',
  'calipatria-north':      'Calipatria N.',
  'east-mesa':             'East Mesa',
  'heber':                 'Heber',
}

const HAZUS = [
  { v: 15,  label: 'Minor',    color: '#16a34a' },
  { v: 30,  label: 'Moderate', color: '#ca8a04' },
  { v: 50,  label: 'Severe',   color: '#ea580c' },
  { v: 75,  label: 'Major',    color: '#dc2626' },
  { v: 100, label: 'Critical', color: '#9f1239' },
]

// ── Chart 1: PGV Bar Chart ────────────────────────────────────────────────────
function PGVBarChart({ selectedId }: { selectedId: string }) {
  const L = 100, R = 16, T = 28, B = 44
  const W = 420, H = 230
  const xMax = 155
  const plotW = W - L - R
  const plotH = H - T - B

  const sorted = [...SALTON_SEA_SITES].sort((a, b) => b.romSeismic.pgvP95CmS - a.romSeismic.pgvP95CmS)
  const rowH = plotH / sorted.length
  const barH = rowH * 0.45

  function bx(v: number) { return sc(v, 0, xMax, 0, plotW) }

  const xTicks = [0, 25, 50, 75, 100, 125, 150]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Title */}
      <text x={W / 2} y={14} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" letterSpacing="0.06em">
        PGV DISTRIBUTION BY SITE (cm/s)
      </text>

      {/* Grid lines */}
      {xTicks.map(t => (
        <line key={t}
          x1={L + bx(t)} y1={T} x2={L + bx(t)} y2={T + plotH}
          stroke="#334155" strokeWidth={t === 0 ? 1 : 0.5} strokeDasharray={t === 0 ? '' : '3 3'} />
      ))}

      {/* HAZUS threshold lines */}
      {HAZUS.map(h => h.v <= xMax && (
        <g key={h.v}>
          <line
            x1={L + bx(h.v)} y1={T} x2={L + bx(h.v)} y2={T + plotH}
            stroke={h.color} strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
          <text x={L + bx(h.v)} y={T + plotH + 26} textAnchor="middle" fontSize={7} fill={h.color} opacity={0.9}>
            {h.label}
          </text>
        </g>
      ))}

      {/* Bars */}
      {sorted.map((site, i) => {
        const s = site.romSeismic
        const cy = T + i * rowH + rowH / 2
        const color = SITE_COLORS[site.id]
        const isSelected = site.id === selectedId
        const y = cy - barH / 2

        return (
          <g key={site.id}>
            {/* Max range */}
            <rect x={L} y={y} width={bx(s.pgvMaxCmS)} height={barH}
              fill={color} opacity={0.08} rx={2} />
            {/* p95 */}
            <rect x={L} y={y} width={bx(s.pgvP95CmS)} height={barH}
              fill={color} opacity={0.18} rx={2} />
            {/* p84 */}
            <rect x={L} y={y} width={bx(s.pgvP84CmS)} height={barH}
              fill={color} opacity={0.3} rx={2} />
            {/* Mean — solid */}
            <rect x={L} y={y} width={bx(s.pgvMeanCmS)} height={barH}
              fill={color} opacity={isSelected ? 1 : 0.7} rx={2} />

            {/* Mean value label */}
            <text
              x={L + bx(s.pgvMeanCmS) + 4} y={cy + 1}
              fontSize={8.5} fill={color} dominantBaseline="middle" fontWeight="600">
              {s.pgvMeanCmS}
            </text>

            {/* Site name */}
            <text x={L - 6} y={cy} fontSize={9} fill={isSelected ? '#f8fafc' : '#94a3b8'}
              textAnchor="end" dominantBaseline="middle" fontWeight={isSelected ? '700' : '400'}>
              {SITE_SHORT[site.id]}
            </text>

            {/* Selected indicator */}
            {isSelected && (
              <rect x={2} y={y - 1} width={3} height={barH + 2} fill={color} rx={1.5} />
            )}
          </g>
        )
      })}

      {/* X-axis ticks */}
      {xTicks.map(t => (
        <text key={t} x={L + bx(t)} y={T + plotH + 13}
          textAnchor="middle" fontSize={8} fill="#475569">
          {t}
        </text>
      ))}

      {/* Legend */}
      <g transform={`translate(${L}, ${H - 10})`}>
        {[
          { label: 'Mean', opacity: 0.85, w: 10 },
          { label: 'p84',  opacity: 0.3,  w: 10 },
          { label: 'p95',  opacity: 0.18, w: 10 },
          { label: 'Max',  opacity: 0.08, w: 10 },
        ].map((item, i) => (
          <g key={item.label} transform={`translate(${i * 55}, 0)`}>
            <rect x={0} y={-6} width={item.w} height={6} fill="#06b6d4" opacity={item.opacity} rx={1} />
            <text x={13} y={0} fontSize={7.5} fill="#64748b">{item.label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

// ── Chart 2: Resource vs Risk Scatter ─────────────────────────────────────────
function ScatterChart({ selectedId }: { selectedId: string }) {
  const L = 44, R = 16, T = 28, B = 44
  const W = 360, H = 260
  const plotW = W - L - R
  const plotH = H - T - B

  function px(quality: number) { return sc(quality, 50, 100, 0, plotW) }
  function py(pgv: number)     { return sc(pgv, 0, 130, plotH, 0) }

  const xTicks = [50, 60, 70, 80, 90, 100]
  const yTicks = [0, 25, 50, 75, 100, 125]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <text x={W / 2} y={14} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" letterSpacing="0.06em">
        RESOURCE QUALITY vs SEISMIC HAZARD
      </text>

      {/* Quadrant backgrounds */}
      <rect x={L} y={T} width={plotW / 2} height={plotH / 2} fill="#dc262608" />
      <rect x={L + plotW / 2} y={T} width={plotW / 2} height={plotH / 2} fill="#dc262618" />
      <rect x={L} y={T + plotH / 2} width={plotW / 2} height={plotH / 2} fill="#16a34a08" />
      <rect x={L + plotW / 2} y={T + plotH / 2} width={plotW / 2} height={plotH / 2} fill="#16a34a18" />

      {/* Quadrant labels */}
      <text x={L + 4} y={T + 14} fontSize={7.5} fill="#dc2626" opacity={0.5}>Low resource · High risk</text>
      <text x={L + plotW - 4} y={T + 14} fontSize={7.5} fill="#dc2626" opacity={0.7} textAnchor="end">High resource · High risk</text>
      <text x={L + 4} y={T + plotH - 6} fontSize={7.5} fill="#16a34a" opacity={0.5}>Low resource · Low risk</text>
      <text x={L + plotW - 4} y={T + plotH - 6} fontSize={7.5} fill="#16a34a" opacity={0.7} textAnchor="end">High resource · Low risk</text>

      {/* Grid */}
      {xTicks.map(t => (
        <line key={t} x1={L + px(t)} y1={T} x2={L + px(t)} y2={T + plotH}
          stroke="#334155" strokeWidth={0.5} strokeDasharray="3 3" />
      ))}
      {yTicks.map(t => (
        <line key={t} x1={L} y1={T + py(t)} x2={L + plotW} y2={T + py(t)}
          stroke="#334155" strokeWidth={0.5} strokeDasharray="3 3" />
      ))}
      <rect x={L} y={T} width={plotW} height={plotH} fill="none" stroke="#334155" strokeWidth={0.8} />

      {/* Site dots */}
      {SALTON_SEA_SITES.map(site => {
        const cx = L + px(site.resourceQuality)
        const cy = T + py(site.romSeismic.pgvP95CmS)
        const color = SITE_COLORS[site.id]
        const isSelected = site.id === selectedId
        const r = isSelected ? 8 : 5.5

        return (
          <g key={site.id}>
            {isSelected && (
              <circle cx={cx} cy={cy} r={r + 5} fill={color} opacity={0.15} />
            )}
            <circle cx={cx} cy={cy} r={r} fill={color} opacity={isSelected ? 1 : 0.7}
              stroke={isSelected ? '#f8fafc' : 'none'} strokeWidth={1.5} />
            <text x={cx} y={cy - r - 3} textAnchor="middle" fontSize={8}
              fill={isSelected ? '#f8fafc' : '#94a3b8'} fontWeight={isSelected ? '700' : '400'}>
              {SITE_SHORT[site.id]}
            </text>
          </g>
        )
      })}

      {/* Axes */}
      {xTicks.map(t => (
        <text key={t} x={L + px(t)} y={T + plotH + 13} textAnchor="middle" fontSize={8} fill="#475569">{t}</text>
      ))}
      {yTicks.map(t => (
        <text key={t} x={L - 5} y={T + py(t)} textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#475569">{t}</text>
      ))}
      <text x={L + plotW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="#64748b">Resource Quality Score</text>
      <text x={10} y={T + plotH / 2} textAnchor="middle" fontSize={8} fill="#64748b"
        transform={`rotate(-90, 10, ${T + plotH / 2})`}>p95 PGV (cm/s)</text>
    </svg>
  )
}

// ── Chart 3: Hazard Curve per Site ────────────────────────────────────────────
function HazardCurveChart({ selectedId }: { selectedId: string }) {
  const L = 44, R = 90, T = 28, B = 44
  const W = 440, H = 260
  const plotW = W - L - R
  const plotH = H - T - B

  const xLabels = ['Mean', 'p50', 'p84', 'p95', 'Max']
  const xMax = 4
  const yMax = 160

  function px(i: number)   { return sc(i, 0, xMax, 0, plotW) }
  function py(v: number)   { return sc(v, 0, yMax, plotH, 0) }

  // HAZUS bands
  const bands = [
    { lo: 0,   hi: 15,  color: '#16a34a', label: 'Minor'    },
    { lo: 15,  hi: 30,  color: '#65a30d', label: 'Moderate' },
    { lo: 30,  hi: 50,  color: '#ca8a04', label: 'Severe'   },
    { lo: 50,  hi: 75,  color: '#ea580c', label: 'Major'    },
    { lo: 75,  hi: 100, color: '#dc2626', label: 'Major+'   },
    { lo: 100, hi: 160, color: '#9f1239', label: 'Critical' },
  ]

  const yTicks = [0, 25, 50, 75, 100, 125, 150]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <text x={(L + W - R) / 2} y={14} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" letterSpacing="0.06em">
        SEISMIC HAZARD CURVE (iPOD ROM)
      </text>

      {/* HAZUS bands */}
      {bands.map(b => (
        <rect key={b.label}
          x={L} y={T + py(Math.min(b.hi, yMax))}
          width={plotW}
          height={py(b.lo) - py(Math.min(b.hi, yMax))}
          fill={b.color} opacity={0.07} />
      ))}

      {/* HAZUS labels on right */}
      {bands.map(b => (
        <text key={b.label}
          x={L + plotW + 4}
          y={T + py((b.lo + Math.min(b.hi, yMax)) / 2)}
          fontSize={7.5} fill={b.color} opacity={0.85} dominantBaseline="middle">
          {b.label}
        </text>
      ))}

      {/* Grid */}
      {yTicks.map(t => (
        <line key={t} x1={L} y1={T + py(t)} x2={L + plotW} y2={T + py(t)}
          stroke="#334155" strokeWidth={0.5} strokeDasharray="3 3" />
      ))}
      <rect x={L} y={T} width={plotW} height={plotH} fill="none" stroke="#334155" strokeWidth={0.8} />

      {/* Curves */}
      {SALTON_SEA_SITES.map(site => {
        const s = site.romSeismic
        const pts = [s.pgvMeanCmS, s.pgvP50CmS, s.pgvP84CmS, s.pgvP95CmS, s.pgvMaxCmS]
        const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${L + px(i)},${T + py(v)}`).join(' ')
        const color = SITE_COLORS[site.id]
        const isSelected = site.id === selectedId

        return (
          <g key={site.id}>
            <path d={d} fill="none" stroke={color}
              strokeWidth={isSelected ? 2.5 : 1.2}
              opacity={isSelected ? 1 : 0.45}
              strokeLinejoin="round" />
            {/* End label */}
            <text
              x={L + px(xMax) + 4}
              y={T + py(s.pgvMaxCmS)}
              fontSize={isSelected ? 9 : 7.5}
              fill={color}
              dominantBaseline="middle"
              fontWeight={isSelected ? '700' : '400'}
              opacity={isSelected ? 1 : 0.5}>
              {SITE_SHORT[site.id]}
            </text>
            {/* Dots */}
            {pts.map((v, i) => (
              <circle key={i} cx={L + px(i)} cy={T + py(v)} r={isSelected ? 3 : 2}
                fill={color} opacity={isSelected ? 1 : 0.45} />
            ))}
          </g>
        )
      })}

      {/* X labels */}
      {xLabels.map((lbl, i) => (
        <text key={lbl} x={L + px(i)} y={T + plotH + 13} textAnchor="middle" fontSize={8.5} fill="#64748b">
          {lbl}
        </text>
      ))}
      {/* Y axis */}
      {yTicks.map(t => (
        <text key={t} x={L - 5} y={T + py(t)} textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#475569">{t}</text>
      ))}
      <text x={10} y={T + plotH / 2} textAnchor="middle" fontSize={8} fill="#64748b"
        transform={`rotate(-90, 10, ${T + plotH / 2})`}>PGV (cm/s)</text>
    </svg>
  )
}

// ── Chart 4: Fault Distance vs PGV Mean ──────────────────────────────────────
function FaultDistChart({ selectedId }: { selectedId: string }) {
  const L = 44, R = 16, T = 28, B = 44
  const W = 360, H = 260
  const plotW = W - L - R
  const plotH = H - T - B

  function px(d: number) { return sc(d, 0, 14, 0, plotW) }
  function py(v: number) { return sc(v, 0, 80, plotH, 0) }

  const xTicks = [0, 2, 4, 6, 8, 10, 12, 14]
  const yTicks = [0, 20, 40, 60, 80]

  // Exponential decay curve
  const curvePoints = Array.from({ length: 60 }, (_, i) => {
    const d = (i / 59) * 14
    const v = 85 * Math.exp(-0.188 * d)
    return `${i === 0 ? 'M' : 'L'}${L + px(d)},${T + py(v)}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <text x={W / 2} y={14} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" letterSpacing="0.06em">
        FAULT DISTANCE vs MEAN PGV
      </text>

      {/* Grid */}
      {xTicks.map(t => (
        <line key={t} x1={L + px(t)} y1={T} x2={L + px(t)} y2={T + plotH}
          stroke="#334155" strokeWidth={0.5} strokeDasharray="3 3" />
      ))}
      {yTicks.map(t => (
        <line key={t} x1={L} y1={T + py(t)} x2={L + plotW} y2={T + py(t)}
          stroke="#334155" strokeWidth={0.5} strokeDasharray="3 3" />
      ))}
      <rect x={L} y={T} width={plotW} height={plotH} fill="none" stroke="#334155" strokeWidth={0.8} />

      {/* Exponential decay fit */}
      <path d={curvePoints} fill="none" stroke="#64748b" strokeWidth={1.5}
        strokeDasharray="5 3" opacity={0.4} />
      <text x={L + px(10)} y={T + py(85 * Math.exp(-0.188 * 10)) - 6}
        fontSize={7.5} fill="#64748b" opacity={0.5} textAnchor="middle">
        85·e⁻⁰·¹⁸⁸ᵈ
      </text>

      {/* Site dots */}
      {SALTON_SEA_SITES.map(site => {
        const cx = L + px(site.faultDistanceKm)
        const cy = T + py(site.romSeismic.pgvMeanCmS)
        const color = SITE_COLORS[site.id]
        const isSelected = site.id === selectedId
        const r = isSelected ? 8 : 5.5

        return (
          <g key={site.id}>
            {isSelected && <circle cx={cx} cy={cy} r={r + 5} fill={color} opacity={0.15} />}
            <circle cx={cx} cy={cy} r={r} fill={color} opacity={isSelected ? 1 : 0.75}
              stroke={isSelected ? '#f8fafc' : 'none'} strokeWidth={1.5} />
            <text x={cx} y={cy - r - 3} textAnchor="middle" fontSize={8}
              fill={isSelected ? '#f8fafc' : '#94a3b8'} fontWeight={isSelected ? '700' : '400'}>
              {SITE_SHORT[site.id]}
            </text>
          </g>
        )
      })}

      {/* Axes */}
      {xTicks.map(t => (
        <text key={t} x={L + px(t)} y={T + plotH + 13} textAnchor="middle" fontSize={8} fill="#475569">{t}</text>
      ))}
      {yTicks.map(t => (
        <text key={t} x={L - 5} y={T + py(t)} textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#475569">{t}</text>
      ))}
      <text x={L + plotW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="#64748b">Fault Distance (km)</text>
      <text x={10} y={T + plotH / 2} textAnchor="middle" fontSize={8} fill="#64748b"
        transform={`rotate(-90, 10, ${T + plotH / 2})`}>Mean PGV (cm/s)</text>
    </svg>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function SeismicCharts({ selectedSiteId }: { selectedSiteId: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 overflow-hidden no-print">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-cyan-400 shrink-0">
              <path d="M2 12L5 6l3 4 2-3 2 5H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-bold text-white">Seismic Intelligence</span>
          </div>
          <p className="text-xs text-slate-400">
            iPOD ROM · 500-scenario ensemble · Scripps LOH dataset · Rekoske et al. (2023) physics-based mean
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">Live data</span>
        </div>
      </div>

      {/* 2×2 Chart grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 bg-slate-900">
        <div className="p-4 border-b border-r border-slate-700/50 sm:border-b-0">
          <PGVBarChart selectedId={selectedSiteId} />
        </div>
        <div className="p-4 border-b border-slate-700/50 sm:border-b-0">
          <ScatterChart selectedId={selectedSiteId} />
        </div>
        <div className="p-4 border-r border-slate-700/50 sm:border-t border-slate-700/50">
          <HazardCurveChart selectedId={selectedSiteId} />
        </div>
        <div className="p-4 sm:border-t border-slate-700/50">
          <FaultDistChart selectedId={selectedSiteId} />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800/60 px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-xs text-slate-500">
          HAZUS thresholds: Minor 15 · Moderate 30 · Severe 50 · Major 75 · Critical 100 cm/s
        </span>
        <span className="text-xs text-slate-600 ml-auto">
          Rekoske et al. (2023) doi:10.1029/2023JB026975
        </span>
      </div>
    </div>
  )
}
