'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { SALTON_SEA_SITES } from '@/data/sites'
import { ROM_META } from '@/data/seismicROM'
import { REFERENCE_COMPANY_PROFILE } from '@/lib/referenceProfile'
import { analyzeOpportunity, OVERALL_SCORE_WEIGHTS } from '@/lib/scoring'
import type { Site } from '@/lib/types'

type PgvMetric = 'pgvMeanCmS' | 'pgvP50CmS' | 'pgvP84CmS' | 'pgvP95CmS' | 'pgvMaxCmS'

const PGV_LABELS: Record<PgvMetric, string> = {
  pgvMeanCmS: 'Mean PGV',
  pgvP50CmS: 'p50 PGV',
  pgvP84CmS: 'p84 PGV',
  pgvP95CmS: 'p95 PGV',
  pgvMaxCmS: 'Max PGV',
}

function pctLabel(p: number) {
  return `${Math.round(p * 100)}%`
}

function BarCompare({
  sites,
  metric,
  maxScale,
}: {
  sites: Site[]
  metric: PgvMetric
  maxScale: number
}) {
  return (
    <div className="space-y-3">
      {sites.map((site) => {
        const v = site.romSeismic[metric]
        const w = Math.min(100, (v / maxScale) * 100)
        return (
          <div key={site.id}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-800 truncate pr-2">{site.name}</span>
              <span className="text-gray-500 tabular-nums shrink-0">{v.toFixed(1)} cm/s</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-600 transition-all"
                style={{ width: `${w}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PgvLadder({ site }: { site: Site }) {
  const r = site.romSeismic
  const rows: { label: string; value: number; tone: string }[] = [
    { label: 'Mean', value: r.pgvMeanCmS, tone: 'bg-slate-500' },
    { label: 'p50', value: r.pgvP50CmS, tone: 'bg-slate-400' },
    { label: 'p84', value: r.pgvP84CmS, tone: 'bg-amber-500' },
    { label: 'p95', value: r.pgvP95CmS, tone: 'bg-orange-600' },
    { label: 'Max', value: r.pgvMaxCmS, tone: 'bg-red-600' },
  ]
  const maxV = Math.max(...rows.map((x) => x.value), 1)
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-2">
        ROM ensemble ({r.nScenarios} scenarios) — spread shows hazard uncertainty, not a time series.
      </p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 text-xs">
          <span className="w-10 text-gray-500">{row.label}</span>
          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className={clsx('h-full rounded-full', row.tone)} style={{ width: `${(row.value / maxV) * 100}%` }} />
          </div>
          <span className="w-14 text-right tabular-nums text-gray-800">{row.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

function FaultPgvScatter({ sites }: { sites: Site[] }) {
  const pad = { l: 48, r: 16, t: 16, b: 40 }
  const w = 560
  const h = 260
  const plotW = w - pad.l - pad.r
  const plotH = h - pad.t - pad.b
  const maxX = Math.max(...sites.map((s) => s.faultDistanceKm), 1) * 1.08
  const maxY = Math.max(...sites.map((s) => s.romSeismic.pgvP95CmS), 1) * 1.08
  const sx = (km: number) => pad.l + (km / maxX) * plotW
  const sy = (pgv: number) => pad.t + plotH - (pgv / maxY) * plotH

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto max-w-2xl" role="img" aria-label="Fault distance vs PGV p95">
      <text x={pad.l + plotW / 2} y={h - 8} textAnchor="middle" className="fill-gray-500 text-[11px]">
        Fault distance (km)
      </text>
      <text
        x={14}
        y={pad.t + plotH / 2}
        textAnchor="middle"
        className="fill-gray-500 text-[11px]"
        transform={`rotate(-90, 14, ${pad.t + plotH / 2})`}
      >
        PGV p95 (cm/s)
      </text>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const x = pad.l + t * plotW
        return <line key={t} x1={x} x2={x} y1={pad.t} y2={pad.t + plotH} stroke="#f3f4f6" strokeWidth="1" />
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = pad.t + t * plotH
        return <line key={t} x1={pad.l} x2={pad.l + plotW} y1={y} y2={y} stroke="#f3f4f6" strokeWidth="1" />
      })}
      <line x1={pad.l} x2={pad.l + plotW} y1={pad.t + plotH} y2={pad.t + plotH} stroke="#d1d5db" strokeWidth="1" />
      <line x1={pad.l} x2={pad.l} y1={pad.t} y2={pad.t + plotH} stroke="#d1d5db" strokeWidth="1" />
      {sites.map((site) => {
        const x = sx(site.faultDistanceKm)
        const y = sy(site.romSeismic.pgvP95CmS)
        return (
          <g key={site.id}>
            <title>{`${site.name}: ${site.faultDistanceKm} km fault distance, ${site.romSeismic.pgvP95CmS} cm/s PGV p95`}</title>
            <circle cx={x} cy={y} r="7" className="fill-cyan-500/90 stroke-white stroke-2" />
            <text x={x + 10} y={y + 4} className="fill-gray-700 text-[9px] font-medium">
              {site.name.split(' ')[0]}
            </text>
          </g>
        )
      })}
      <text x={pad.l} y={pad.t - 4} className="fill-gray-400 text-[10px]">
        {maxY.toFixed(0)} cm/s
      </text>
      <text x={pad.l + plotW} y={pad.t + plotH + 22} textAnchor="end" className="fill-gray-400 text-[10px]">
        {maxX.toFixed(1)} km
      </text>
    </svg>
  )
}

export default function AnalysisPage() {
  const [metric, setMetric] = useState<PgvMetric>('pgvP95CmS')
  const [ladderSiteId, setLadderSiteId] = useState(SALTON_SEA_SITES[0]?.id ?? '')

  const ladderSite = SALTON_SEA_SITES.find((s) => s.id === ladderSiteId) ?? SALTON_SEA_SITES[0]

  const maxPgvForMetric = useMemo(() => {
    return Math.max(...SALTON_SEA_SITES.map((s) => s.romSeismic[metric]), 1)
  }, [metric])

  const benchmarkRows = useMemo(() => {
    return SALTON_SEA_SITES.map((site) => ({
      site,
      analysis: analyzeOpportunity(REFERENCE_COMPANY_PROFILE, site),
    })).sort((a, b) => b.analysis.scores.overallPilotScore - a.analysis.scores.overallPilotScore)
  }, [])

  const w = OVERALL_SCORE_WEIGHTS

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90">
          <div className="w-8 h-8 rounded-md bg-cyan-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L9 16M2 9L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="9" cy="9" r="3" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">GeoPivot</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/assess" className="text-cyan-300 hover:text-white transition-colors">
            Run assessment
          </Link>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">Data analytics</span>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 sm:px-6 space-y-12">
        <div>
          <p className="text-cyan-600 text-sm font-medium uppercase tracking-wide mb-2">Data analytics</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Salton Sea site intelligence</h1>
          <p className="text-gray-600 leading-relaxed max-w-3xl">
            Explore iPOD reduced-order seismic statistics, compare candidate zones, and see how a{' '}
            <strong>reference operator profile</strong> scores across sites. Your own assessment in{' '}
            <Link href="/assess" className="text-cyan-600 font-medium hover:underline">
              Run assessment
            </Link>{' '}
            uses the same scoring engine with your inputs.
          </p>
        </div>

        {/* Methodology */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data &amp; methodology</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">ROM model</dt>
              <dd className="text-gray-900 font-medium">{ROM_META.model}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Source dataset</dt>
              <dd className="text-gray-900 font-medium">{ROM_META.source}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Scenario ensemble</dt>
              <dd className="text-gray-900">
                {ROM_META.nScenarios} earthquake scenarios; training samples {ROM_META.nTraining?.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Earthquake parameter ranges</dt>
              <dd className="text-gray-800 text-xs leading-relaxed">
                depth {ROM_META.eqParams.depth_range[0]}–{ROM_META.eqParams.depth_range[1]} km · strike{' '}
                {ROM_META.eqParams.strike_range[0]}–{ROM_META.eqParams.strike_range[1]}° · dip{' '}
                {ROM_META.eqParams.dip_range[0]}–{ROM_META.eqParams.dip_range[1]}° · rake{' '}
                {ROM_META.eqParams.rake_range[0]}–{ROM_META.eqParams.rake_range[1]}°
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
            PGV percentiles summarize ground motion across the ensemble at each site. They support risk comparison across
            zones — not a substitute for site-specific engineering study.
          </p>
        </section>

        {/* PGV cross-site */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">PGV comparison across sites</h2>
              <p className="text-sm text-gray-500 mt-1">Normalized bar length uses the highest value in this cohort as full width.</p>
            </div>
            <div>
              <label htmlFor="metric" className="block text-xs font-medium text-gray-500 mb-1">
                Metric
              </label>
              <select
                id="metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value as PgvMetric)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {(Object.keys(PGV_LABELS) as PgvMetric[]).map((k) => (
                  <option key={k} value={k}>
                    {PGV_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <BarCompare sites={SALTON_SEA_SITES} metric={metric} maxScale={maxPgvForMetric} />
        </section>

        {/* Ladder + Scatter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">PGV percentile ladder</h2>
              <select
                value={ladderSiteId}
                onChange={(e) => setLadderSiteId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm max-w-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {SALTON_SEA_SITES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {ladderSite && <PgvLadder site={ladderSite} />}
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Fault distance vs PGV p95</h2>
            <p className="text-sm text-gray-500 mb-4">
              Closer faults correlate with higher ROM PGV at p95 — used with PGA and distance in the seismic risk sub-score.
            </p>
            <FaultPgvScatter sites={SALTON_SEA_SITES} />
          </section>
        </div>

        {/* Score weights + benchmark table */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Reference pilot scores (benchmark)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Using profile: {REFERENCE_COMPANY_PROFILE.rigCount} rigs, {REFERENCE_COMPANY_PROFILE.drillingDepthFt.toLocaleString()}{' '}
            ft depth, ${REFERENCE_COMPANY_PROFILE.pilotBudgetM}M budget, {REFERENCE_COMPANY_PROFILE.riskTolerance} risk tolerance.
            Overall score ={' '}
            {pctLabel(w.companyReadiness)} readiness + {pctLabel(w.economicViability)} economics + {pctLabel(w.marketPolicySupport)}{' '}
            market/policy + {pctLabel(w.seismicMitigation)} &times; (100 − seismic risk).
          </p>
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Site</th>
                <th className="py-2 pr-4 font-medium">PGV p95</th>
                <th className="py-2 pr-4 font-medium">PGA</th>
                <th className="py-2 pr-4 font-medium">Fault km</th>
                <th className="py-2 pr-4 font-medium">Gradient</th>
                <th className="py-2 pr-4 font-medium">Capex</th>
                <th className="py-2 pr-4 font-medium">Pilot score</th>
                <th className="py-2 font-medium">Call</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.map(({ site, analysis }) => (
                <tr key={site.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-4 font-medium text-gray-900">{site.name}</td>
                  <td className="py-3 pr-4 tabular-nums">{site.romSeismic.pgvP95CmS} cm/s</td>
                  <td className="py-3 pr-4 tabular-nums">{site.pga}g</td>
                  <td className="py-3 pr-4 tabular-nums">{site.faultDistanceKm}</td>
                  <td className="py-3 pr-4 tabular-nums">{site.tempGradientCPerKm}°C/km</td>
                  <td className="py-3 pr-4 tabular-nums">${site.estimatedCapexM}M</td>
                  <td className="py-3 pr-4 tabular-nums font-semibold text-gray-900">{analysis.scores.overallPilotScore}</td>
                  <td className="py-3">
                    <span
                      className={clsx(
                        'text-xs font-semibold px-2 py-1 rounded-full',
                        analysis.recommendation === 'Go' && 'bg-green-100 text-green-800',
                        analysis.recommendation === 'Conditional Go' && 'bg-amber-100 text-amber-800',
                        analysis.recommendation === 'No-Go' && 'bg-red-100 text-red-800'
                      )}
                    >
                      {analysis.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="flex flex-wrap gap-4 justify-center pb-12">
          <Link
            href="/assess"
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Run assessment with your data
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-3 text-sm">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  )
}
