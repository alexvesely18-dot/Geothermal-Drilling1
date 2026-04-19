'use client'

import { useState } from 'react'
import { CompanyProfile } from '@/lib/types'

// ─── Data types ───────────────────────────────────────────────────────────────

type Status = 'transfers' | 'upgrade' | 'new' | 'critical'
type Phase  = 'pilot' | 'commercial'

interface PermitRow {
  id: string
  category: string
  oilGasCredential: string | null   // null = no O&G equivalent
  geothermalPermit: string
  authority: string
  authorityShort: string
  status: Status
  timeline: string
  phase: Phase
  note?: string
  requiresCalifornia?: boolean      // only relevant when operating in CA
}

// ─── Permit dataset ───────────────────────────────────────────────────────────

const ALL_PERMITS: PermitRow[] = [
  // ── Pilot / Exploration ──────────────────────────────────────────────────
  {
    id: 'operator-license',
    category: 'Operator Licensing',
    oilGasCredential: 'CalGEM Operator License (O&G)',
    geothermalPermit: 'CalGEM Geothermal Operator License',
    authority: 'CA Division of Geologic Energy Management',
    authorityShort: 'CalGEM',
    status: 'upgrade',
    timeline: '1–3 mo',
    phase: 'pilot',
    requiresCalifornia: true,
    note: 'Separate application from O&G license — similar process, ~$500 fee, same agency.',
  },
  {
    id: 'operator-license-noca',
    category: 'Operator Licensing',
    oilGasCredential: 'State well operator license',
    geothermalPermit: 'CalGEM Geothermal Operator License',
    authority: 'CA Division of Geologic Energy Management',
    authorityShort: 'CalGEM',
    status: 'new',
    timeline: '1–4 mo',
    phase: 'pilot',
    requiresCalifornia: false,
    note: 'Must register as operator with CalGEM even if licensed in another state.',
  },
  {
    id: 'well-permit-exploration',
    category: 'Well Permitting',
    oilGasCredential: 'CalGEM Well Permit (Form WD / APD)',
    geothermalPermit: 'CalGEM Geothermal Well Permit (Form GT-5)',
    authority: 'CA Division of Geologic Energy Management',
    authorityShort: 'CalGEM',
    status: 'upgrade',
    timeline: '2–6 mo',
    phase: 'pilot',
    note: 'Same agency and similar review workflow. GT-5 adds temperature / brine management requirements.',
  },
  {
    id: 'ceqa',
    category: 'Environmental Review',
    oilGasCredential: 'CEQA Initial Study / Neg. Declaration',
    geothermalPermit: 'CEQA with geothermal impact categories',
    authority: 'County of Imperial (lead agency)',
    authorityShort: 'Imperial Co.',
    status: 'upgrade',
    timeline: '3–9 mo',
    phase: 'pilot',
    note: 'Familiar CEQA framework, but new impact categories: H₂S emissions, induced seismicity, brine disposal.',
  },
  {
    id: 'induced-seismicity',
    category: 'Seismic Monitoring',
    oilGasCredential: null,
    geothermalPermit: 'CalGEM Induced Seismicity Mitigation Protocol',
    authority: 'CA Division of Geologic Energy Management',
    authorityShort: 'CalGEM',
    status: 'new',
    timeline: '2–4 mo',
    phase: 'pilot',
    note: 'Required since 2021 before any geothermal/EGS drilling. Submit traffic-light protocol and monitoring plan.',
  },
  {
    id: 'uic-injection',
    category: 'Fluid / Brine Management',
    oilGasCredential: 'EPA UIC Class II (produced water injection)',
    geothermalPermit: 'EPA UIC Class V (geothermal fluid injection)',
    authority: 'EPA / State Water Resources Control Board',
    authorityShort: 'EPA / SWRCB',
    status: 'upgrade',
    timeline: '6–12 mo',
    phase: 'pilot',
    note: 'Different well class (Class V vs II). Most O&G operators have Class II — Class V needs a fresh application.',
  },
  {
    id: 'air-permit',
    category: 'Air Quality',
    oilGasCredential: 'SCAQMD / AQMD Authority to Construct',
    geothermalPermit: 'SCAQMD Geothermal Facility Permit (H₂S abatement)',
    authority: 'South Coast AQMD',
    authorityShort: 'SCAQMD',
    status: 'upgrade',
    timeline: '3–6 mo',
    phase: 'pilot',
    note: 'H₂S abatement system design required. Familiar permit type but new emission source categories.',
  },
  {
    id: 'surety-bond',
    category: 'Financial Assurance',
    oilGasCredential: 'CalGEM Plugging Bond ($25K–$100K/well)',
    geothermalPermit: 'CalGEM Geothermal Bond ($50K–$300K/well)',
    authority: 'CA Division of Geologic Energy Management',
    authorityShort: 'CalGEM',
    status: 'upgrade',
    timeline: '< 1 mo',
    phase: 'pilot',
    note: 'Geothermal bonds are typically 2–3× higher than O&G equivalents due to well complexity.',
  },
  {
    id: 'blm-supo',
    category: 'Land Access (Federal)',
    oilGasCredential: 'BLM Surface Use Plan of Operations (O&G)',
    geothermalPermit: 'BLM SUPO — Geothermal Exploration',
    authority: 'BLM Palm Springs Field Office',
    authorityShort: 'BLM',
    status: 'upgrade',
    timeline: '6–18 mo',
    phase: 'pilot',
    note: 'Same BLM office. SUPO process is familiar, but geothermal-specific stipulations apply.',
  },

  // ── Commercial Production ────────────────────────────────────────────────
  {
    id: 'blm-lease',
    category: 'Land Access (Federal)',
    oilGasCredential: 'BLM Oil & Gas Lease',
    geothermalPermit: 'BLM Geothermal Lease (competitive bid)',
    authority: 'Bureau of Land Management',
    authorityShort: 'BLM',
    status: 'new',
    timeline: '6–24 mo',
    phase: 'commercial',
    note: 'Separate program from O&G leasing. 10–15% royalty, 10-yr primary term. Competitive bid on most Salton Sea parcels.',
  },
  {
    id: 'well-permit-production',
    category: 'Well Permitting',
    oilGasCredential: 'Production well permits (per well)',
    geothermalPermit: 'CalGEM GT-5 Production Well Permits (per well)',
    authority: 'CA Division of Geologic Energy Management',
    authorityShort: 'CalGEM',
    status: 'upgrade',
    timeline: '2–4 mo each',
    phase: 'commercial',
    note: 'Same form as exploration wells. Scale this across your full production well count.',
  },
  {
    id: 'ferc-qf',
    category: 'Power Generation',
    oilGasCredential: null,
    geothermalPermit: 'FERC Qualifying Facility (QF) or EWG Certification',
    authority: 'Federal Energy Regulatory Commission',
    authorityShort: 'FERC',
    status: 'critical',
    timeline: '3–6 mo',
    phase: 'commercial',
    note: 'No O&G equivalent. QF status gives access to PURPA rates. EWG needed for merchant sales. File before interconnection queue.',
  },
  {
    id: 'caiso-interconnect',
    category: 'Grid Interconnection',
    oilGasCredential: null,
    geothermalPermit: 'CAISO Generator Interconnection Agreement',
    authority: 'California ISO',
    authorityShort: 'CAISO',
    status: 'critical',
    timeline: '24–48 mo',
    phase: 'commercial',
    note: 'The single longest-lead item. Queue is 2–4+ years. Engage early — this governs your commercial operation date.',
  },
  {
    id: 'ppa',
    category: 'Power Sales',
    oilGasCredential: null,
    geothermalPermit: 'Power Purchase Agreement (PPA) or CCA Contract',
    authority: 'CPUC / Counterparty Utility or CCA',
    authorityShort: 'CPUC',
    status: 'new',
    timeline: '6–18 mo',
    phase: 'commercial',
    note: 'Negotiate with SCE, SDG&E, or a CCA. California RPS mandates create strong buyer demand for geothermal baseload.',
  },
  {
    id: 'water-rights',
    category: 'Fluid / Brine Management',
    oilGasCredential: 'Produced water disposal permits',
    geothermalPermit: 'Water Rights + Brine Reinjection Plan (full scale)',
    authority: 'State Water Resources Control Board',
    authorityShort: 'SWRCB',
    status: 'new',
    timeline: '6–12 mo',
    phase: 'commercial',
    note: 'Full production requires a water rights application. Salton Sea brine is property of the state — reinjection plan required.',
  },
  {
    id: 'lithium',
    category: 'Mineral Rights',
    oilGasCredential: null,
    geothermalPermit: 'Lithium Extraction Royalty (AB 1139 / Lithium Valley Act)',
    authority: 'CalGEM / Lithium Valley Commission',
    authorityShort: 'LVC',
    status: 'new',
    timeline: 'Concurrent',
    phase: 'commercial',
    note: 'Unique to Salton Sea brine operations. Royalty rate set at $400/ton of lithium carbonate equivalent. High upside if pursued.',
  },
]

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; short: string; color: string; bg: string; textColor: string }> = {
  transfers: { label: 'Transfers',    short: 'Transfers', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   textColor: '#16a34a' },
  upgrade:   { label: 'Upgrade',      short: 'Upgrade',   color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   textColor: '#0891b2' },
  new:       { label: 'New Required', short: 'New',       color: '#f97316', bg: 'rgba(249,115,22,0.12)',  textColor: '#ea580c' },
  critical:  { label: 'Critical Gap', short: 'Critical',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   textColor: '#dc2626' },
}

const PHASE_CONFIG: Record<Phase, { label: string; sub: string }> = {
  pilot:      { label: 'Pilot / Exploration', sub: 'First well, proof-of-concept' },
  commercial: { label: 'Commercial Scale',    sub: 'Full production + grid sales' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function effectiveStatus(row: PermitRow, company: CompanyProfile): Status {
  const inCalifornia = company.operatingRegions.includes('california')
  const experienced  = company.crewExpertise === 'experienced' || company.crewExpertise === 'expert'

  // Non-CA operator treating a CA-specific upgrade as net-new
  if (row.requiresCalifornia === true && !inCalifornia) return 'new'
  // Non-CA operator skips the CA-specific duplicate row
  if (row.requiresCalifornia === false && inCalifornia) return row.status

  // Experienced crews make upgrades easier (still show upgrade, not 'transfers')
  if (row.status === 'upgrade' && experienced) return 'upgrade'

  return row.status
}

function summarize(permits: PermitRow[], company: CompanyProfile) {
  const counts = { transfers: 0, upgrade: 0, new: 0, critical: 0 }
  for (const p of permits) {
    counts[effectiveStatus(p, company)]++
  }
  return counts
}

function groupBy<T>(arr: T[], key: (t: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item)
    ;(acc[k] = acc[k] || []).push(item)
    return acc
  }, {} as Record<string, T[]>)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: Status }) {
  const { color } = STATUS_CONFIG[status]
  if (status === 'transfers') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M8 3l4 4-4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (status === 'upgrade') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 11V3M3 6l4-4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (status === 'new') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.6"/>
      <path d="M7 4.5v3.5M7 9.5v.5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

function CategoryIcon({ category }: { category: string }) {
  if (category === 'Well Permitting') return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="9" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.5 7V2M5 3.5l1.5-1.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
  if (category === 'Environmental Review') return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1.5C4 3 2 5 2 7.5a4.5 4.5 0 009 0C11 5 9 3 6.5 1.5z" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
  if (category === 'Grid Interconnection' || category === 'Power Generation' || category === 'Power Sales') return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M7.5 1.5L4 7h4.5L5.5 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (category === 'Seismic Monitoring') return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1 7h2l2-4 2 8 2-6 1.5 3H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (category === 'Land Access (Federal)') return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 11L6.5 2 11 11H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M5 11V8h3v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4.5 5.5h4M4.5 7.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Single permit row ────────────────────────────────────────────────────────

function PermitCard({ row, status }: { row: PermitRow; status: Status }) {
  const [expanded, setExpanded] = useState(false)
  const sc = STATUS_CONFIG[status]

  return (
    <div
      className="border border-slate-700/40 rounded-xl overflow-hidden transition-colors"
      style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left"
      >
        <div className="flex items-stretch gap-0">
          {/* Status stripe */}
          <div className="w-1 shrink-0 rounded-l-xl" style={{ backgroundColor: sc.color }} />

          {/* Main content */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 min-w-0">

            {/* Left: O&G credential */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Oil &amp; Gas</span>
              </div>
              {row.oilGasCredential ? (
                <p className="text-sm text-slate-300 leading-snug">{row.oilGasCredential}</p>
              ) : (
                <p className="text-sm text-slate-600 italic">No equivalent</p>
              )}
            </div>

            {/* Arrow */}
            <div className="hidden sm:flex items-center justify-center w-10 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <StatusIcon status={status} />
              </div>
            </div>

            {/* Right: Geothermal requirement */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">Geothermal</span>
              </div>
              <p className="text-sm text-white font-medium leading-snug">{row.geothermalPermit}</p>
            </div>

            {/* Meta */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0 ml-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: sc.textColor, backgroundColor: sc.bg }}
              >
                {sc.short}
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap">{row.timeline}</span>
            </div>

            {/* Chevron */}
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              className={`shrink-0 text-slate-600 transition-transform ml-1 ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4 pt-0 border-t border-slate-700/40">
          <div className="flex flex-wrap items-start justify-between gap-4 pt-3">
            <div className="flex items-start gap-2 min-w-0">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0 text-slate-500">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M6 5v4M6 3.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <p className="text-xs text-slate-400 leading-relaxed">{row.note}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-500 bg-slate-800 rounded-lg px-3 py-1.5">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M3.5 4h4M3.5 6h2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              {row.authority}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Summary pills ────────────────────────────────────────────────────────────

function SummaryPill({ status, count }: { status: Status; count: number }) {
  const sc = STATUS_CONFIG[status]
  return (
    <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700/40">
      <StatusIcon status={status} />
      <span className="text-xl font-bold" style={{ color: sc.color }}>{count}</span>
      <div className="text-xs text-slate-400 leading-tight">
        <div className="font-medium" style={{ color: sc.textColor }}>{sc.label}</div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PermitsRoadmap({ company }: { company: CompanyProfile }) {
  const [phase, setPhase]       = useState<Phase>('pilot')
  const [gapsOnly, setGapsOnly] = useState(false)

  const inCalifornia = company.operatingRegions.includes('california')

  // Filter duplicate operator-license rows based on CA presence
  const relevantRows = ALL_PERMITS.filter(row => {
    if (row.requiresCalifornia === true  && !inCalifornia) return false
    if (row.requiresCalifornia === false &&  inCalifornia) return false
    return row.phase === phase
  })

  const rowsWithStatus = relevantRows.map(row => ({
    row,
    status: effectiveStatus(row, company),
  }))

  const visible = gapsOnly
    ? rowsWithStatus.filter(({ status }) => status === 'new' || status === 'critical')
    : rowsWithStatus

  const counts = summarize(relevantRows, company)
  const totalGaps = counts.new + counts.critical

  const grouped = groupBy(visible, ({ row }) => row.category)

  // Rough total timeline estimate
  const maxMonths: Record<Phase, number> = { pilot: 18, commercial: 48 }
  const bottleneck = phase === 'commercial' ? 'CAISO interconnection queue (24–48 mo)' : 'BLM surface use plan (6–18 mo)'

  return (
    <div className="rounded-2xl border border-slate-700/60 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-750 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-cyan-400 shrink-0">
                <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-bold text-white">Regulatory Roadmap</span>
            </div>
            <p className="text-xs text-slate-400">
              O&amp;G-to-Geothermal permit gap analysis ·{' '}
              {inCalifornia ? 'California operator profile' : 'Out-of-state operator entering CA'} ·{' '}
              {company.crewExpertise} crew
            </p>
          </div>

          {/* Phase toggle */}
          <div className="flex items-center gap-1 bg-slate-900/60 rounded-xl p-1 border border-slate-700/40 self-start shrink-0">
            {(['pilot', 'commercial'] as Phase[]).map(p => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  phase === p
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {PHASE_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <SummaryPill status="transfers" count={counts.transfers} />
          <SummaryPill status="upgrade"   count={counts.upgrade}   />
          <SummaryPill status="new"       count={counts.new}       />
          <SummaryPill status="critical"  count={counts.critical}  />

          <div className="ml-auto flex items-center self-center">
            <button
              onClick={() => setGapsOnly(g => !g)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                gapsOnly
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5.5 3.5v2.5M5.5 7.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {gapsOnly ? `Showing ${totalGaps} gaps` : 'Show gaps only'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Permit rows ─────────────────────────────────────────── */}
      <div className="bg-slate-900 px-4 py-4 space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-slate-500">
                <CategoryIcon category={category} />
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{category}</span>
              <div className="flex-1 h-px bg-slate-700/50" />
            </div>
            <div className="space-y-2">
              {items.map(({ row, status }) => (
                <PermitCard key={row.id} row={row} status={status} />
              ))}
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No gaps found for this phase — all permits transfer or upgrade from your O&amp;G portfolio.
          </div>
        )}
      </div>

      {/* ── Timeline footer ─────────────────────────────────────── */}
      <div className="bg-slate-800/60 border-t border-slate-700/40 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="text-xs font-semibold text-slate-200 mb-2">
              Estimated permitting timeline to {phase === 'pilot' ? 'first exploration well' : 'commercial operations'}
            </div>
            {/* Timeline bar */}
            <div className="relative h-5 bg-slate-700/50 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                style={{ width: `${Math.min(100, (maxMonths[phase] / 48) * 100)}%`, transition: 'width 0.5s ease' }} />
              {[6, 12, 18, 24, 36, 48].filter(m => m <= maxMonths[phase] + 12).map(m => (
                <div key={m}
                  className="absolute top-0 h-full border-r border-slate-600/60 flex items-end justify-center pb-0.5"
                  style={{ left: `${(m / 48) * 100}%` }}>
                </div>
              ))}
              <span className="absolute right-3 top-0 h-full flex items-center text-xs font-bold text-white">
                ~{maxMonths[phase]} mo
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1 px-0.5">
              {[0, 6, 12, 18, 24, 36, 48].filter(m => m <= maxMonths[phase] + 6).map(m => (
                <span key={m}>{m}mo</span>
              ))}
            </div>
          </div>
          <div className="sm:max-w-xs text-xs text-slate-300 sm:text-right leading-relaxed">
            <span className="text-amber-400 font-semibold">Critical path: </span>
            {bottleneck}. Begin this process in parallel with exploration drilling.
          </div>
        </div>
      </div>
    </div>
  )
}
