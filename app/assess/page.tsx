'use client'

import { useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { CompanyProfile, Site, AnalysisResult } from '@/lib/types'
import { computeOverallScoreWeighted, deriveRecommendation } from '@/lib/scoring'
import { SALTON_SEA_SITES } from '@/data/sites'
import SaltonSeaMap from '@/components/SaltonSeaMap'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

const DEMO_PROFILE: CompanyProfile = {
  companyName: 'Desert Basin Energy',
  rigCount: 4,
  drillingDepthFt: 12000,
  tempToleranceF: 450,
  crewExpertise: 'experienced',
  operatingRegions: ['california', 'southwest_us'],
  pilotBudgetM: 35,
  timelineMonths: 24,
  riskTolerance: 'medium',
}
const DEMO_SITE_ID = 'salton-sea-geothermal'

const DEFAULT_FORM: CompanyProfile = {
  companyName: '',
  rigCount: 2,
  drillingDepthFt: 10000,
  tempToleranceF: 350,
  crewExpertise: 'intermediate',
  operatingRegions: ['southwest_us'],
  pilotBudgetM: 20,
  timelineMonths: 24,
  riskTolerance: 'medium',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number, invert = false): string {
  const s = invert ? 100 - score : score
  if (s >= 70) return '#22c55e'
  if (s >= 50) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(score: number, invert = false): string {
  const s = invert ? 100 - score : score
  if (s >= 75) return 'Strong'
  if (s >= 60) return 'Moderate'
  if (s >= 45) return 'Marginal'
  return 'Weak'
}

function recColors(rec: AnalysisResult['recommendation']) {
  if (rec === 'Go') return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-600' }
  if (rec === 'Conditional Go') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500' }
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-600' }
}

function seismicBadge(level: Site['seismicityLevel']) {
  return {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  }[level]
}

const REGION_OPTIONS = [
  { id: 'california', label: 'California' },
  { id: 'southwest_us', label: 'Southwest US' },
  { id: 'other_us', label: 'Other US' },
  { id: 'international', label: 'International' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps = ['Company Info', 'Capabilities', 'Site Selection', 'Results']
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const s = (i + 1) as Step
        const done = step > s
        const active = step === s
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  done && 'bg-cyan-500 text-white',
                  active && 'bg-slate-800 text-white ring-4 ring-slate-200',
                  !done && !active && 'bg-gray-200 text-gray-500'
                )}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span className={clsx('text-xs mt-1 hidden sm:block', active ? 'text-slate-800 font-medium' : 'text-gray-400')}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={clsx('w-12 sm:w-20 h-0.5 mx-1 mb-4 transition-colors', done ? 'bg-cyan-500' : 'bg-gray-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1.5">{children}</label>
}

function FormInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  type?: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  min?: number
  max?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
    />
  )
}

// ─── Private Data Paste Panel ─────────────────────────────────────────────────

function PrivateDataPanel({
  value,
  onChange,
  onExtract,
  extracting,
  filledCount,
}: {
  value: string
  onChange: (v: string) => void
  onExtract: () => void
  extracting: boolean
  filledCount: number | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Paste private company data for personalized analysis
          {filledCount !== null && filledCount > 0 && (
            <span className="bg-cyan-100 text-cyan-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {filledCount} fields extracted
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={clsx('transition-transform', open && 'rotate-180')}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Paste rig specs, budget docs, or capability reports to auto-fill fields and personalize your AI memo.
            <span className="font-medium text-gray-600"> Not stored.</span>
          </p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            placeholder={`Paste anything relevant, e.g.:

"Desert Basin Energy operates 4 land rigs capable of drilling to 14,000 ft in the Southwest US and California. Our Q-class wellheads are rated to 450°F. We have an allocated exploration budget of $28M for FY2025 with an 18-month deployment window. Our crews have completed 3 high-temperature geothermal-adjacent projects in Nevada..."`}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y font-mono leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{value.length.toLocaleString()} characters</p>
            <button
              onClick={onExtract}
              disabled={!value.trim() || extracting}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {extracting ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Extracting…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Extract & Auto-fill
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 1: Company Info ─────────────────────────────────────────────────────

function CompanyInfoStep({
  form,
  onChange,
  onNext,
  onLoadDemo,
  privateData,
  onPrivateDataChange,
}: {
  form: CompanyProfile
  onChange: (u: Partial<CompanyProfile>) => void
  onNext: () => void
  onLoadDemo: () => void
  privateData: string
  onPrivateDataChange: (v: string) => void
}) {
  const [extracting, setExtracting] = useState(false)
  const [filledCount, setFilledCount] = useState<number | null>(null)
  const valid = form.companyName.trim().length > 0 && form.pilotBudgetM > 0

  async function handleExtract() {
    if (!privateData.trim()) return
    setExtracting(true)
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: privateData }),
      })
      const data = await res.json()
      if (data.profile) {
        const p = data.profile
        const updates: Partial<CompanyProfile> = {}
        if (p.companyName)     updates.companyName     = p.companyName
        if (p.rigCount)        updates.rigCount        = p.rigCount
        if (p.drillingDepthFt) updates.drillingDepthFt = p.drillingDepthFt
        if (p.tempToleranceF)  updates.tempToleranceF  = p.tempToleranceF
        if (p.crewExpertise)   updates.crewExpertise   = p.crewExpertise
        if (p.operatingRegions?.length) updates.operatingRegions = p.operatingRegions
        if (p.pilotBudgetM)    updates.pilotBudgetM    = p.pilotBudgetM
        if (p.timelineMonths)  updates.timelineMonths  = p.timelineMonths
        if (p.riskTolerance)   updates.riskTolerance   = p.riskTolerance
        onChange(updates)
        setFilledCount(data.filled ?? Object.keys(updates).length)
      }
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Company Info</h2>
        <button
          type="button"
          onClick={onLoadDemo}
          className="text-xs bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-full font-medium transition-colors"
        >
          ★ Try Demo
        </button>
      </div>

      <div className="space-y-5">
        <PrivateDataPanel
          value={privateData}
          onChange={onPrivateDataChange}
          onExtract={handleExtract}
          extracting={extracting}
          filledCount={filledCount}
        />

        <div>
          <FieldLabel>Company Name</FieldLabel>
          <FormInput
            value={form.companyName}
            onChange={(v) => onChange({ companyName: v })}
            placeholder="e.g. Desert Basin Energy"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Pilot Budget ($M)</FieldLabel>
            <FormInput
              type="number"
              value={form.pilotBudgetM}
              onChange={(v) => onChange({ pilotBudgetM: Number(v) })}
              min={1}
              max={500}
            />
          </div>
          <div>
            <FieldLabel>Timeline (months)</FieldLabel>
            <select
              value={form.timelineMonths}
              onChange={(e) => onChange({ timelineMonths: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {[6, 12, 18, 24, 36, 48, 60].map((m) => (
                <option key={m} value={m}>
                  {m} months
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel>Risk Tolerance</FieldLabel>
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: 'low', label: 'Conservative', desc: 'Prioritize certainty over upside' },
              { id: 'medium', label: 'Moderate', desc: 'Balanced risk/return approach' },
              { id: 'high', label: 'Aggressive', desc: 'Willing to accept elevated risk' },
            ] as { id: CompanyProfile['riskTolerance']; label: string; desc: string }[]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ riskTolerance: opt.id })}
                className={clsx(
                  'p-3 rounded-lg border-2 text-left transition-colors',
                  form.riskTolerance === opt.id
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!valid}
          className="bg-slate-800 hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Capabilities ─────────────────────────────────────────────────────

function CapabilitiesStep({
  form,
  onChange,
  onBack,
  onNext,
}: {
  form: CompanyProfile
  onChange: (u: Partial<CompanyProfile>) => void
  onBack: () => void
  onNext: () => void
}) {
  function toggleRegion(id: string) {
    const regions = form.operatingRegions.includes(id)
      ? form.operatingRegions.filter((r) => r !== id)
      : [...form.operatingRegions, id]
    onChange({ operatingRegions: regions.length ? regions : [id] })
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Technical Capabilities</h2>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Number of Rigs</FieldLabel>
            <FormInput
              type="number"
              value={form.rigCount}
              onChange={(v) => onChange({ rigCount: Math.max(1, Number(v)) })}
              min={1}
              max={50}
            />
          </div>
          <div>
            <FieldLabel>Max Drilling Depth (ft)</FieldLabel>
            <select
              value={form.drillingDepthFt}
              onChange={(e) => onChange({ drillingDepthFt: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {[5000, 6000, 8000, 10000, 12000, 15000, 18000, 20000].map((d) => (
                <option key={d} value={d}>
                  {d.toLocaleString()} ft
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel>Equipment Temperature Tolerance (°F)</FieldLabel>
          <select
            value={form.tempToleranceF}
            onChange={(e) => onChange({ tempToleranceF: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {[200, 250, 300, 350, 400, 450, 500, 550].map((t) => (
              <option key={t} value={t}>
                {t}°F
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Crew Expertise Level</FieldLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { id: 'novice', label: 'Novice', desc: 'No geothermal exp.' },
              { id: 'intermediate', label: 'Intermediate', desc: 'Some hot wells' },
              { id: 'experienced', label: 'Experienced', desc: 'Multiple projects' },
              { id: 'expert', label: 'Expert', desc: 'Geothermal specialist' },
            ] as { id: CompanyProfile['crewExpertise']; label: string; desc: string }[]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ crewExpertise: opt.id })}
                className={clsx(
                  'p-2.5 rounded-lg border-2 text-left transition-colors',
                  form.crewExpertise === opt.id
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="text-xs font-semibold text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Current Operating Regions</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {REGION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleRegion(opt.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm border-2 transition-colors',
                  form.operatingRegions.includes(opt.id)
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Site Selection ───────────────────────────────────────────────────

function SiteSelectionStep({
  selectedSiteId,
  onSelect,
  onBack,
  onSubmit,
  loading,
}: {
  selectedSiteId: string
  onSelect: (id: string) => void
  onBack: () => void
  onSubmit: () => void
  loading: boolean
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Select a Site</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {SALTON_SEA_SITES.map((site) => {
          const selected = site.id === selectedSiteId
          return (
            <button
              key={site.id}
              onClick={() => onSelect(site.id)}
              className={clsx(
                'text-left p-4 rounded-xl border-2 transition-all hover:shadow-md',
                selected ? 'border-cyan-500 bg-cyan-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-semibold text-gray-900 text-sm leading-snug">{site.name}</span>
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', seismicBadge(site.seismicityLevel))}>
                  {site.seismicityLevel} risk
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{site.description}</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Resource quality</span>
                  <span className="font-medium text-gray-800">{site.resourceQuality}/100</span>
                </div>
                <div className="score-bar">
                  <div
                    className="score-bar-fill"
                    style={{ width: `${site.resourceQuality}%`, backgroundColor: scoreColor(site.resourceQuality) }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-gray-500">Est. pilot capex</span>
                  <span className="font-medium text-gray-800">${site.estimatedCapexM}M</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Zone</span>
                  <span className="text-gray-600">{site.zone}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm">
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!selectedSiteId || loading}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Analyzing…
            </>
          ) : (
            'Run Analysis →'
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Results ──────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = scoreColor(score)

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
        <text x="70" y="62" textAnchor="middle" fontSize="30" fontWeight="700" fill={color}>
          {score}
        </text>
        <text x="70" y="80" textAnchor="middle" fontSize="11" fill="#6b7280">
          out of 100
        </text>
      </svg>
      <span className="text-sm font-medium mt-1" style={{ color }}>
        {scoreLabel(score)}
      </span>
    </div>
  )
}

function ScoreRow({
  label,
  score,
  invert,
  note,
}: {
  label: string
  score: number
  invert?: boolean
  note?: string
}) {
  const display = invert ? 100 - score : score
  const color = scoreColor(score, invert)
  const label2 = scoreLabel(score, invert)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-sm font-medium text-gray-800">{label}</span>
          {note && <span className="text-xs text-gray-400 ml-2">{note}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color }}>
            {label2}
          </span>
          <span className="text-sm font-bold text-gray-900 w-12 text-right">{invert ? score : score}/100</span>
        </div>
      </div>
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{ width: `${display}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function ResultsView({
  company,
  site,
  result,
  explanation,
  loadingExplanation,
  onReset,
}: {
  company: CompanyProfile
  site: Site
  result: AnalysisResult
  explanation: string
  loadingExplanation: boolean
  onReset: () => void
}) {
  const { scores, keyOpportunities, keyRisks, nextSteps } = result

  const [weights, setWeights] = useState({ readiness: 35, economic: 30, market: 20, seismic: 15 })
  const [showSensitivity, setShowSensitivity] = useState(false)
  const wtotal = weights.readiness + weights.economic + weights.market + weights.seismic
  const liveScore = wtotal > 0 ? computeOverallScoreWeighted(scores, weights) : scores.overallPilotScore
  const liveRec = deriveRecommendation(liveScore, company.riskTolerance)
  const rc = recColors(liveRec)

  // Sub-score cards config
  const scoreCards = [
    {
      label: 'Readiness',
      score: scores.companyReadiness,
      invert: false,
      color: '#3b82f6',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="8" width="3" height="6" rx="1" fill="currentColor" opacity="0.5"/>
          <rect x="6.5" y="5" width="3" height="9" rx="1" fill="currentColor" opacity="0.75"/>
          <rect x="11" y="2" width="3" height="12" rx="1" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label: 'Economics',
      score: scores.economicViability,
      invert: false,
      color: '#10b981',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M8 5v6M6 9.5c0 .8.9 1.5 2 1.5s2-.7 2-1.5-1-1.3-2-1.5-2-.8-2-1.5S6.9 5 8 5s2 .6 2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Policy',
      score: scores.marketPolicySupport,
      invert: false,
      color: '#8b5cf6',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Seismic',
      score: scores.seismicRisk,
      invert: true,
      color: '#f59e0b',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      note: 'lower = safer',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L2 13h12L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M8 9V7M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Hero banner ───────────────────────────────────────── */}
      <div className={clsx(
        'rounded-2xl border-2 overflow-hidden animate-fade-up',
        rc.bg, rc.border
      )}>
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          {/* Left: verdict */}
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className={clsx('text-white text-sm font-bold px-3 py-1 rounded-full tracking-wide', rc.badge)}>
                {liveRec}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {company.companyName} · {site.name}
              </span>
            </div>
            <h2 className={clsx('text-2xl font-bold leading-tight mb-2', rc.text)}>
              {liveRec === 'Go'
                ? 'Proceed with the geothermal pilot'
                : liveRec === 'Conditional Go'
                ? 'Pilot viable — conditions to address'
                : 'Pilot not recommended at this stage'}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {liveRec === 'Go'
                ? 'Strong capability match, favorable economics, and supportive policy environment.'
                : liveRec === 'Conditional Go'
                ? 'Viable opportunity with key gaps that should be resolved before committing capital.'
                : 'Critical capability or risk gaps make this pilot inadvisable without major changes.'}
            </p>

            {/* Quick site stats strip */}
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { label: 'Resource quality', val: `${site.resourceQuality}/100` },
                { label: 'Temp gradient',    val: `${site.tempGradientCPerKm}°C/km` },
                { label: 'Est. capex',        val: `$${site.estimatedCapexM}M` },
                { label: 'ROM PGV p95',       val: `${site.romSeismic.pgvP95CmS} cm/s` },
              ].map(({ label, val }) => (
                <div key={label} className="bg-white/60 border border-white/80 rounded-lg px-3 py-1.5">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-sm font-bold text-gray-900">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: score circle */}
          <div className={clsx(
            'flex items-center justify-center px-8 py-6 border-t sm:border-t-0 sm:border-l',
            rc.border
          )}>
            <ScoreCircle score={liveScore} />
          </div>
        </div>
      </div>

      {/* ── Sub-score cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up delay-100">
        {scoreCards.map(({ label, score, invert, color, bg, border, icon, note }) => {
          const display = invert ? 100 - score : score
          const lbl = scoreLabel(score, invert)
          return (
            <div key={label} className={clsx('rounded-xl border p-4', bg, border)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                <span style={{ color }} className="opacity-80">{icon}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{invert ? score : score}</div>
              <div className="w-full h-1.5 rounded-full bg-white/70 mb-1.5">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${display}%`, backgroundColor: color }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color }}>{lbl}</span>
                {note && <span className="text-xs text-gray-400">{note}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Sensitivity sliders (collapsible) ─────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden no-print animate-fade-up delay-150">
        <button
          onClick={() => setShowSensitivity((s) => !s)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400">
              <path d="M2 4h2m0 0a2 2 0 0 0 4 0m-4 0V2m4 2h4M2 10h6m0 0a2 2 0 0 0 4 0m-4 0v2m4-2h0V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Sensitivity Analysis
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium text-white', recColors(liveRec).badge)}>
              {liveScore}/100 · {liveRec}
            </span>
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
            className={clsx('transition-transform text-gray-400', showSensitivity && 'rotate-180')}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {showSensitivity && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-500 mb-4">
              Adjust factor weights — the score and recommendation above update live.
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {([
                { key: 'readiness', label: 'Company Readiness', color: '#3b82f6' },
                { key: 'economic',  label: 'Economic Viability', color: '#10b981' },
                { key: 'market',    label: 'Market & Policy',    color: '#8b5cf6' },
                { key: 'seismic',   label: 'Seismic Safety',     color: '#f59e0b' },
              ] as { key: keyof typeof weights; label: string; color: string }[]).map(({ key, label, color }) => {
                const pct = wtotal > 0 ? Math.round((weights[key] / wtotal) * 100) : 25
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{label}</span>
                      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{pct}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={weights[key]}
                      onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))}
                      className="w-full h-1.5 cursor-pointer rounded-full appearance-none bg-gray-200"
                      style={{ accentColor: color }}
                    />
                  </div>
                )
              })}
            </div>
            <button onClick={() => setWeights({ readiness: 35, economic: 30, market: 20, seismic: 15 })}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      {/* ── Full-width interactive map ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-fade-up delay-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-cyan-500">
              <path d="M7 1C4.24 1 2 3.24 2 6c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.4"/>
              <circle cx="7" cy="6" r="1.8" fill="currentColor"/>
            </svg>
            {site.name} — Salton Sea Basin
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {(['low','medium','high'] as const).map(l => (
              <span key={l} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{
                  backgroundColor: l === 'low' ? '#22c55e' : l === 'medium' ? '#f59e0b' : '#ef4444'
                }}/>
                {l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ height: 460 }}>
          <SaltonSeaMap selectedSiteId={site.id} />
        </div>
        {/* Seismic data strip below map */}
        <div className="grid grid-cols-3 sm:grid-cols-6 border-t border-gray-100">
          {[
            { label: 'PGV p95',       val: `${site.romSeismic.pgvP95CmS} cm/s`, accent: true },
            { label: 'PGV mean',      val: `${site.romSeismic.pgvMeanCmS} cm/s`, accent: true },
            { label: 'PGA',           val: `${site.pga}g` },
            { label: 'Fault dist.',   val: `${site.faultDistanceKm} km` },
            { label: 'Temp gradient', val: `${site.tempGradientCPerKm}°C/km` },
            { label: 'Seismic zone',  val: site.seismicityLevel },
          ].map(({ label, val, accent }, i) => (
            <div key={label} className={clsx(
              'px-4 py-3 text-xs',
              i < 5 && 'border-r border-gray-100',
              accent ? 'bg-orange-50' : 'bg-gray-50'
            )}>
              <div className={clsx('font-medium mb-0.5', accent ? 'text-orange-600' : 'text-gray-500')}>{label}</div>
              <div className="font-bold text-gray-900 text-sm">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Opportunities + Risks ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up delay-250">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">↑</span>
            Opportunities
          </h3>
          <ul className="space-y-3">
            {keyOpportunities.map((o, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-600 text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {o}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">!</span>
            Risks
          </h3>
          <ul className="space-y-3">
            {keyRisks.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-600 text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Next Steps (timeline) ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fade-up delay-300">
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-cyan-500">
            <path d="M7.5 1v6.5L11 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
          Recommended Next Steps
        </h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-5 bottom-2 w-0.5 bg-gradient-to-b from-cyan-400 to-cyan-100" />
          <ol className="space-y-4">
            {nextSteps.map((step, i) => (
              <li key={i} className="flex gap-4 pl-2">
                <span className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-cyan-400 text-cyan-600 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                  {i + 1}
                </span>
                <div className="flex-1 pt-1.5 pb-1">
                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── AI Executive Memo ──────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden animate-fade-up delay-400">
        <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full font-semibold">AI</span>
            <span className="text-sm font-semibold text-white">Executive Memo</span>
          </div>
          <span className="text-xs text-slate-500">
            {company.companyName} · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="bg-slate-50 px-6 py-5">
          {loadingExplanation ? (
            <div className="space-y-2.5 animate-pulse">
              {[100, 88, 94, 72, 85, 60].map((w, i) => (
                <div key={i} className="h-3 rounded-full bg-slate-200" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : explanation ? (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-[system-ui]">
              {explanation}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Add an ANTHROPIC_API_KEY to .env.local to enable AI-generated memos.
            </p>
          )}
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 justify-between items-center pb-6 no-print">
        <button onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New assessment
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5V2h8v3M3 10H1V6h12v4h-2M3 8h8v4H3V8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          Print / PDF
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssessPage() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<CompanyProfile>(DEFAULT_FORM)
  const [privateData, setPrivateData] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [explanation, setExplanation] = useState('')
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [loadingExplanation, setLoadingExplanation] = useState(false)

  function updateForm(updates: Partial<CompanyProfile>) {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  function handleLoadDemo() {
    setForm(DEMO_PROFILE)
    setSelectedSiteId(DEMO_SITE_ID)
    setStep(3)
  }

  async function handleAnalyze() {
    if (!selectedSiteId) return
    setLoadingAnalysis(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: form, siteId: selectedSiteId }),
      })
      const data = await res.json()
      setResult(data.result)
      setSite(data.site)
      setStep(4)

      // Fetch AI explanation asynchronously
      setLoadingExplanation(true)
      setExplanation('')
      fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: form, site: data.site, result: data.result, privateData }),
      })
        .then((r) => r.json())
        .then((d) => setExplanation(d.explanation || ''))
        .catch(() => setExplanation(''))
        .finally(() => setLoadingExplanation(false))
    } catch {
      // silent — user can retry
    } finally {
      setLoadingAnalysis(false)
    }
  }

  function handleReset() {
    setStep(1)
    setForm(DEFAULT_FORM)
    setPrivateData('')
    setSelectedSiteId('')
    setResult(null)
    setSite(null)
    setExplanation('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-cyan-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11M1.5 7h11" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="7" cy="7" r="2.5" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-slate-900">GeoPivot</span>
        </Link>
        <span className="text-xs text-gray-400">Geothermal Pilot Assessment</span>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="no-print"><StepIndicator step={step} /></div>

        <div key={step} className="animate-fade-up">
          {step === 1 && (
            <CompanyInfoStep
              form={form}
              onChange={updateForm}
              onNext={() => setStep(2)}
              onLoadDemo={handleLoadDemo}
              privateData={privateData}
              onPrivateDataChange={setPrivateData}
            />
          )}
          {step === 2 && (
            <CapabilitiesStep
              form={form}
              onChange={updateForm}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <SiteSelectionStep
              selectedSiteId={selectedSiteId}
              onSelect={setSelectedSiteId}
              onBack={() => setStep(2)}
              onSubmit={handleAnalyze}
              loading={loadingAnalysis}
            />
          )}
          {step === 4 && result && site && (
            <ResultsView
              company={form}
              site={site}
              result={result}
              explanation={explanation}
              loadingExplanation={loadingExplanation}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  )
}
