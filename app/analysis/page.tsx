'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { SALTON_SEA_SITES } from '@/data/sites'
import { CompanyProfile } from '@/lib/types'
import {
  computeCompanyReadiness,
  computeEconomicViability,
  computeMarketPolicySupport,
  computeOverallScoreWeighted,
  computeSeismicRisk,
  deriveRecommendation,
} from '@/lib/scoring'

const STORAGE_KEY = 'geopivot:lastCompanyProfile'

const DEFAULT_PROFILE: CompanyProfile = {
  companyName: 'Reference Operator',
  rigCount: 2,
  drillingDepthFt: 10000,
  tempToleranceF: 350,
  crewExpertise: 'intermediate',
  operatingRegions: ['southwest_us'],
  pilotBudgetM: 20,
  timelineMonths: 24,
  riskTolerance: 'medium',
}

type WeightState = {
  readiness: number
  economic: number
  market: number
  seismic: number
}

function recStyle(rec: 'Go' | 'Conditional Go' | 'No-Go') {
  if (rec === 'Go') return 'bg-green-100 text-green-700'
  if (rec === 'Conditional Go') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function AnalysisPage() {
  const [profile, setProfile] = useState<CompanyProfile>(DEFAULT_PROFILE)
  const [weights, setWeights] = useState<WeightState>({
    readiness: 35,
    economic: 30,
    market: 20,
    seismic: 15,
  })
  const [status, setStatus] = useState('')

  const rows = useMemo(() => {
    return SALTON_SEA_SITES.map((site) => {
      const partial = {
        companyReadiness: computeCompanyReadiness(profile, site),
        seismicRisk: computeSeismicRisk(site),
        economicViability: computeEconomicViability(profile, site),
        marketPolicySupport: computeMarketPolicySupport(profile, site),
      }
      const overall = computeOverallScoreWeighted(partial, weights)
      const recommendation = deriveRecommendation(overall, profile.riskTolerance)
      return { site, partial, overall, recommendation }
    }).sort((a, b) => b.overall - a.overall)
  }, [profile, weights])

  const best = rows[0]

  function updateProfile<K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  function loadLastAssessment() {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setStatus('No saved assessment profile found yet.')
        return
      }
      const parsed = JSON.parse(raw) as CompanyProfile
      setProfile((prev) => ({ ...prev, ...parsed }))
      setStatus('Loaded your latest assessment profile.')
    } catch {
      setStatus('Could not parse saved profile.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-slate-900">GeoPivot</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/assess" className="text-cyan-700 hover:text-cyan-900 font-medium">Assessment</Link>
          <span className="text-gray-400">Data Analytics</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Assessment-Linked Data Analytics</h1>
          <p className="text-sm text-gray-600 mb-4">
            Use your company profile to compare all sites with the same scoring engine used in the assessment flow.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={loadLastAssessment}
              className="text-sm px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
            >
              Load profile from last assessment
            </button>
            <span className="text-xs text-gray-500">{status || 'Tip: run an assessment first, then load here.'}</span>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-500">Company Name</label>
            <input
              value={profile.companyName}
              onChange={(e) => updateProfile('companyName', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Rig Count</label>
            <input
              type="number"
              min={1}
              value={profile.rigCount}
              onChange={(e) => updateProfile('rigCount', Math.max(1, Number(e.target.value)))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Drilling Depth (ft)</label>
            <input
              type="number"
              min={1000}
              value={profile.drillingDepthFt}
              onChange={(e) => updateProfile('drillingDepthFt', Math.max(1000, Number(e.target.value)))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Budget ($M)</label>
            <input
              type="number"
              min={1}
              value={profile.pilotBudgetM}
              onChange={(e) => updateProfile('pilotBudgetM', Math.max(1, Number(e.target.value)))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Crew Expertise</label>
            <select
              value={profile.crewExpertise}
              onChange={(e) => updateProfile('crewExpertise', e.target.value as CompanyProfile['crewExpertise'])}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="novice">Novice</option>
              <option value="intermediate">Intermediate</option>
              <option value="experienced">Experienced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Risk Tolerance</label>
            <select
              value={profile.riskTolerance}
              onChange={(e) => updateProfile('riskTolerance', e.target.value as CompanyProfile['riskTolerance'])}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Sensitivity Weights</h2>
          <p className="text-xs text-gray-500 mb-4">Adjust weight balance and see rankings update instantly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ['readiness', 'Readiness'],
              ['economic', 'Economic'],
              ['market', 'Market / Policy'],
              ['seismic', 'Seismic Safety'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold text-gray-900">{weights[key]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weights[key]}
                  onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cross-Site Outcome Table</h2>
          <p className="text-sm text-gray-600 mb-4">
            Best current fit: <strong>{best?.site.name}</strong> ({best?.overall}/100, {best?.recommendation})
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3">Site</th>
                  <th className="py-2 pr-3">Overall</th>
                  <th className="py-2 pr-3">Recommendation</th>
                  <th className="py-2 pr-3">Readiness</th>
                  <th className="py-2 pr-3">Economic</th>
                  <th className="py-2 pr-3">Market</th>
                  <th className="py-2 pr-3">Seismic Risk</th>
                  <th className="py-2 pr-3">PGV p95</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.site.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3 font-medium text-gray-900">{row.site.name}</td>
                    <td className="py-2 pr-3 font-bold text-gray-900">{row.overall}</td>
                    <td className="py-2 pr-3">
                      <span className={clsx('text-xs px-2 py-1 rounded-full font-semibold', recStyle(row.recommendation))}>
                        {row.recommendation}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{row.partial.companyReadiness}</td>
                    <td className="py-2 pr-3">{row.partial.economicViability}</td>
                    <td className="py-2 pr-3">{row.partial.marketPolicySupport}</td>
                    <td className="py-2 pr-3">{row.partial.seismicRisk}</td>
                    <td className="py-2 pr-3">{row.site.romSeismic.pgvP95CmS} cm/s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
