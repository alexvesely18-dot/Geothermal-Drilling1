'use client'

import { useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { CompanyProfile, Site, AnalysisResult } from '@/lib/types'
import { OVERALL_SCORE_WEIGHTS } from '@/lib/scoring'
import { SALTON_SEA_SITES } from '@/data/sites'
import SaltonSeaMap from '@/components/SaltonSeaMap'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

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
            Paste internal documents, rig specs, budget summaries, or capability reports.
            GeoPivot uses this to auto-fill the form below and personalize your AI memo.
            <span className="font-medium text-gray-600"> Data is not stored after your session.</span>
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
  privateData,
  onPrivateDataChange,
}: {
  form: CompanyProfile
  onChange: (u: Partial<CompanyProfile>) => void
  onNext: () => void
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
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Company Information</h2>
      <p className="text-gray-500 text-sm mb-6">Tell us about your company and this pilot's strategic context.</p>

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
            <p className="text-xs text-gray-400 mt-1">Total available for geothermal pilot</p>
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
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Technical Capabilities</h2>
      <p className="text-gray-500 text-sm mb-6">Your equipment and team capabilities determine geothermal readiness.</p>

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
          <p className="text-xs text-gray-400 mt-1">Geothermal wells in this region reach 400–600°F</p>
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
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Select a Candidate Site</h2>
      <p className="text-gray-500 text-sm mb-6">Choose one Salton Sea / Imperial Valley zone to evaluate for your pilot.</p>

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
  const { scores, recommendation, keyOpportunities, keyRisks, nextSteps } = result
  const rc = recColors(recommendation)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top card */}
      <div className={clsx('rounded-2xl border-2 p-6', rc.bg, rc.border)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={clsx('text-white text-sm font-bold px-3 py-1 rounded-full', rc.badge)}>
                {recommendation}
              </span>
              <span className="text-xs text-gray-500">
                {company.companyName} · {site.name}
              </span>
            </div>
            <h2 className={clsx('text-xl font-bold', rc.text)}>
              {recommendation === 'Go'
                ? 'Proceed with the geothermal pilot'
                : recommendation === 'Conditional Go'
                ? 'Pilot viable with conditions addressed'
                : 'Pilot not recommended at this stage'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Overall Pilot Score:{' '}
              <strong className={rc.text}>{scores.overallPilotScore}/100</strong> ·{' '}
              {recommendation === 'Go'
                ? 'Strong fit across readiness, economics, and policy'
                : recommendation === 'Conditional Go'
                ? 'Conditions exist that should be resolved before committing'
                : 'Key capability or risk gaps make the pilot inadvisable now'}
            </p>
          </div>
          <ScoreCircle score={scores.overallPilotScore} />
        </div>
      </div>

      {/* Score breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Score Breakdown</h3>
        <div className="space-y-4">
          <ScoreRow label="Company Readiness" score={scores.companyReadiness} note="rigs, depth, budget, crew" />
          <ScoreRow label="Economic Viability" score={scores.economicViability} note="resource quality, incentives, capex" />
          <ScoreRow label="Market & Policy Support" score={scores.marketPolicySupport} note="CA policy, infrastructure, experience" />
          <ScoreRow
            label="Seismic Risk"
            score={scores.seismicRisk}
            invert
            note="lower bar = safer site"
          />
        </div>
        <details className="mt-5 pt-5 border-t border-gray-100 group">
          <summary className="text-sm font-medium text-cyan-700 cursor-pointer list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
            <span className="w-5 h-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs group-open:rotate-90 transition-transform">
              ›
            </span>
            How is the overall pilot score calculated?
          </summary>
          <div className="mt-3 text-sm text-gray-600 leading-relaxed space-y-2 pl-7">
            <p>
              The headline score (0–100) is a weighted blend of the four dimensions above. Weights are fixed for
              transparency:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>
                <strong>{Math.round(OVERALL_SCORE_WEIGHTS.companyReadiness * 100)}%</strong> company readiness
              </li>
              <li>
                <strong>{Math.round(OVERALL_SCORE_WEIGHTS.economicViability * 100)}%</strong> economic viability
              </li>
              <li>
                <strong>{Math.round(OVERALL_SCORE_WEIGHTS.marketPolicySupport * 100)}%</strong> market &amp; policy support
              </li>
              <li>
                <strong>{Math.round(OVERALL_SCORE_WEIGHTS.seismicMitigation * 100)}%</strong> of{' '}
                <em>(100 − seismic risk)</em> — lower seismic hazard raises this term
              </li>
            </ul>
            <p className="text-xs text-gray-500">
              Recommendation thresholds depend on your stated risk tolerance. Explore ROM statistics and benchmark scores
              on the{' '}
              <Link href="/analysis" className="text-cyan-600 font-medium hover:underline">
                Data analytics
              </Link>{' '}
              page.
            </p>
          </div>
        </details>
      </div>

      {/* Map + Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">
            Site Map — {site.name}
          </h3>
          <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: 280 }}>
            <SaltonSeaMap selectedSiteId={site.id} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-2">
              <div className="text-orange-600 font-medium">ROM PGV p95</div>
              <div className="font-bold text-gray-900">{site.romSeismic.pgvP95CmS} cm/s</div>
              <div className="text-gray-400 mt-0.5">iPOD model · 500 scenarios</div>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-2">
              <div className="text-orange-600 font-medium">ROM PGV mean</div>
              <div className="font-bold text-gray-900">{site.romSeismic.pgvMeanCmS} cm/s</div>
              <div className="text-gray-400 mt-0.5">Scripps LOH dataset</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-500">PGA (corroborating)</div>
              <div className="font-semibold text-gray-900">{site.pga}g</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-500">Fault distance</div>
              <div className="font-semibold text-gray-900">{site.faultDistanceKm} km</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-500">Temp gradient</div>
              <div className="font-semibold text-gray-900">{site.tempGradientCPerKm}°C/km</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-gray-500">Est. capex</div>
              <div className="font-semibold text-gray-900">${site.estimatedCapexM}M</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Opportunities */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">↑</span>
              Key Opportunities
            </h3>
            <ul className="space-y-2">
              {keyOpportunities.map((o, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5 shrink-0">•</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
          {/* Risks */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs">!</span>
              Key Risks
            </h3>
            <ul className="space-y-2">
              {keyRisks.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-red-400 mt-0.5 shrink-0">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recommended Next Steps</h3>
        <ol className="space-y-3">
          {nextSteps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* AI Executive Summary */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">AI</span>
          Executive Summary
        </h3>
        {loadingExplanation ? (
          <div className="space-y-2 animate-pulse">
            {[100, 85, 90, 70].map((w, i) => (
              <div key={i} className="h-3 rounded-full bg-gray-200" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : explanation ? (
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{explanation}</div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Add an ANTHROPIC_API_KEY to .env.local to enable AI-generated memos.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-between items-center pb-6">
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
        >
          ← Start new assessment
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5V2h8v3M3 10H1V6h12v4h-2M3 8h8v4H3V8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          Print / Export PDF
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
        <div className="flex items-center gap-3 text-xs">
          <Link href="/analysis" className="text-cyan-600 hover:text-cyan-800 font-medium">
            Data analytics
          </Link>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400">Geothermal Pilot Assessment</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-8 sm:px-6">
        <StepIndicator step={step} />

        {step === 1 && (
          <CompanyInfoStep
            form={form}
            onChange={updateForm}
            onNext={() => setStep(2)}
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
      </main>
    </div>
  )
}
