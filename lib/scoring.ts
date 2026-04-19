import { CompanyProfile, Site, ScoreBreakdown, AnalysisResult } from './types'

// ─── Company Readiness ────────────────────────────────────────────────────────

function scoreRigCount(n: number): number {
  if (n >= 5) return 100
  if (n >= 3) return 80
  if (n >= 2) return 65
  return 50
}

function scoreDrillingDepth(ft: number): number {
  if (ft >= 15000) return 100
  if (ft >= 12000) return 88
  if (ft >= 10000) return 72
  if (ft >= 8000) return 55
  if (ft >= 6000) return 35
  return 15
}

function scoreTempTolerance(f: number): number {
  if (f >= 500) return 100
  if (f >= 400) return 85
  if (f >= 350) return 65
  if (f >= 300) return 45
  if (f >= 250) return 25
  return 10
}

function scoreCrewExpertise(level: CompanyProfile['crewExpertise']): number {
  return { novice: 20, intermediate: 55, experienced: 80, expert: 100 }[level]
}

function scoreBudgetFit(budgetM: number, capexM: number): number {
  const r = budgetM / capexM
  if (r >= 2.0) return 100
  if (r >= 1.5) return 90
  if (r >= 1.0) return 75
  if (r >= 0.75) return 55
  if (r >= 0.5) return 35
  return 15
}

export function computeCompanyReadiness(company: CompanyProfile, site: Site): number {
  return Math.round(
    scoreRigCount(company.rigCount) * 0.15 +
    scoreDrillingDepth(company.drillingDepthFt) * 0.25 +
    scoreTempTolerance(company.tempToleranceF) * 0.20 +
    scoreCrewExpertise(company.crewExpertise) * 0.20 +
    scoreBudgetFit(company.pilotBudgetM, site.estimatedCapexM) * 0.20
  )
}

// ─── Seismic Risk (higher = more dangerous) ───────────────────────────────────
// Primary signal: ROM p95 PGV from iPOD model (Scripps LOH dataset)
// Secondary signals: PGA and fault distance (corroborating evidence)

function pgvP95ToRisk(pgvCmS: number): number {
  // PGV thresholds based on HAZUS structural damage onset levels:
  //  >100 cm/s → near-certain severe damage
  //  75–100    → very high
  //  50–75     → high
  //  30–50     → moderate-high
  //  15–30     → moderate
  //  <15       → low
  if (pgvCmS >= 100) return 95
  if (pgvCmS >= 75)  return 85
  if (pgvCmS >= 50)  return 72
  if (pgvCmS >= 30)  return 58
  if (pgvCmS >= 15)  return 38
  return 20
}

function pgaToRisk(pga: number): number {
  return Math.min(100, Math.round(pga * 130))
}

function faultDistToRisk(km: number): number {
  if (km >= 20) return 5
  if (km >= 15) return 15
  if (km >= 10) return 30
  if (km >= 5)  return 55
  if (km >= 2)  return 78
  return 95
}

export function computeSeismicRisk(site: Site): number {
  // ROM PGV (p95) is the primary seismic hazard signal — 50% weight
  // PGA and fault distance corroborate at 30% and 20%
  return Math.round(
    pgvP95ToRisk(site.romSeismic.pgvP95CmS) * 0.50 +
    pgaToRisk(site.pga)                     * 0.30 +
    faultDistToRisk(site.faultDistanceKm)   * 0.20
  )
}

// ─── Economic Viability ───────────────────────────────────────────────────────

const CA_ELECTRICITY_SCORE = 78  // favorable ~$0.18/kWh industrial
const INCENTIVE_SCORE = 85       // IRA PTC/ITC + CA incentives
const CAPACITY_FACTOR_SCORE = 90 // geothermal ~90% capacity factor

function tempGradientToScore(gradient: number): number {
  if (gradient >= 110) return 100
  if (gradient >= 90) return 82
  if (gradient >= 75) return 64
  if (gradient >= 60) return 45
  return 25
}

export function computeEconomicViability(company: CompanyProfile, site: Site): number {
  return Math.round(
    tempGradientToScore(site.tempGradientCPerKm) * 0.25 +
    site.resourceQuality * 0.20 +
    scoreBudgetFit(company.pilotBudgetM, site.estimatedCapexM) * 0.15 +
    INCENTIVE_SCORE * 0.20 +
    CA_ELECTRICITY_SCORE * 0.10 +
    CAPACITY_FACTOR_SCORE * 0.10
  )
}

// ─── Market / Policy Support ─────────────────────────────────────────────────

const CA_POLICY_SCORE = 88  // Strong RPS + Lithium Valley Act + IRA alignment

function regionalExpScore(regions: string[]): number {
  if (regions.includes('california') || regions.includes('southwest_us')) return 85
  if (regions.includes('other_us')) return 60
  return 40
}

export function computeMarketPolicySupport(company: CompanyProfile, site: Site): number {
  return Math.round(
    CA_POLICY_SCORE * 0.40 +
    site.infrastructureScore * 0.35 +
    regionalExpScore(company.operatingRegions) * 0.25
  )
}

// ─── Overall Score ────────────────────────────────────────────────────────────

export function computeOverallScore(s: Omit<ScoreBreakdown, 'overallPilotScore'>): number {
  const raw =
    s.companyReadiness * 0.35 +
    s.economicViability * 0.30 +
    s.marketPolicySupport * 0.20 +
    (100 - s.seismicRisk) * 0.15
  return Math.max(0, Math.min(100, Math.round(raw)))
}

// ─── Weighted Overall Score (for sensitivity analysis) ────────────────────────

export function computeOverallScoreWeighted(
  s: Omit<ScoreBreakdown, 'overallPilotScore'>,
  w: { readiness: number; economic: number; market: number; seismic: number }
): number {
  const total = w.readiness + w.economic + w.market + w.seismic
  if (total === 0) return 0
  const raw =
    s.companyReadiness    * (w.readiness / total) +
    s.economicViability   * (w.economic  / total) +
    s.marketPolicySupport * (w.market    / total) +
    (100 - s.seismicRisk) * (w.seismic  / total)
  return Math.max(0, Math.min(100, Math.round(raw)))
}

// ─── Recommendation ───────────────────────────────────────────────────────────

export function deriveRecommendation(
  score: number,
  risk: CompanyProfile['riskTolerance']
): AnalysisResult['recommendation'] {
  const t = { low: { go: 78, cond: 62 }, medium: { go: 68, cond: 50 }, high: { go: 58, cond: 40 } }[risk]
  if (score >= t.go) return 'Go'
  if (score >= t.cond) return 'Conditional Go'
  return 'No-Go'
}

// ─── Insights ─────────────────────────────────────────────────────────────────

function deriveOpportunities(c: CompanyProfile, site: Site, s: ScoreBreakdown): string[] {
  const out: string[] = []
  if (site.resourceQuality >= 80)
    out.push(`Exceptional resource quality (${site.resourceQuality}/100) at ${site.name} supports strong long-term output`)
  if (s.economicViability >= 70)
    out.push('Favorable CA electricity prices and IRA incentives create a compelling economic case')
  if (s.companyReadiness >= 70)
    out.push(`Your drilling depth capability (${c.drillingDepthFt.toLocaleString()} ft) is well-matched to this resource`)
  if (site.tempGradientCPerKm >= 90)
    out.push('Above-average temperature gradient reduces the number of wells needed to reach target capacity')
  if (s.marketPolicySupport >= 75)
    out.push("California's Lithium Valley Act and clean energy mandates provide strong long-term policy tailwinds")
  if (c.pilotBudgetM >= site.estimatedCapexM * 1.5)
    out.push('Budget headroom above estimated capex meaningfully reduces financial execution risk')
  return out.slice(0, 3)
}

function deriveRisks(c: CompanyProfile, site: Site, s: ScoreBreakdown): string[] {
  const out: string[] = []
  if (s.seismicRisk >= 60)
    out.push(`ROM p95 PGV of ${site.romSeismic.pgvP95CmS} cm/s at ${site.name} indicates elevated seismic hazard — specialized well design required`)
  if (site.faultDistanceKm < 5)
    out.push(`Close fault proximity (${site.faultDistanceKm} km) increases operational risk and insurance costs`)
  if (s.companyReadiness < 60)
    out.push('Company technical capabilities may require augmentation — crew training or equipment upgrades needed')
  if (c.tempToleranceF < 350)
    out.push('Equipment temperature tolerance may be insufficient for high-enthalpy geothermal brines')
  if (c.pilotBudgetM < site.estimatedCapexM)
    out.push(`Pilot budget ($${c.pilotBudgetM}M) is below estimated site capex ($${site.estimatedCapexM}M) — phased approach required`)
  if (s.seismicRisk >= 75)
    out.push('High seismicity may trigger induced seismicity monitoring requirements, adding regulatory complexity')
  return out.slice(0, 3)
}

function deriveNextSteps(
  c: CompanyProfile,
  site: Site,
  s: ScoreBreakdown,
  rec: AnalysisResult['recommendation']
): string[] {
  const steps: string[] = []
  if (rec === 'No-Go') {
    steps.push('Evaluate Heber or East Mesa as lower-risk alternative entry points')
    steps.push('Conduct a capability gap analysis before committing capital to any geothermal pilot')
    steps.push('Explore a joint venture with an established geothermal operator to bridge the readiness gap')
    return steps
  }
  if (s.seismicRisk >= 60)
    steps.push('Commission a site-specific seismic hazard assessment and induced seismicity monitoring plan')
  if (c.tempToleranceF < 400)
    steps.push('Evaluate high-temperature-resistant casing and wellhead equipment for geothermal brine service')
  if (c.crewExpertise === 'novice' || c.crewExpertise === 'intermediate')
    steps.push('Partner with a geothermal crew training provider or hire a specialist geothermal operations lead')
  if (c.pilotBudgetM < site.estimatedCapexM * 1.2)
    steps.push(`Structure pilot as Phase 1 (1–2 wells, ~$${Math.round(site.estimatedCapexM * 0.45)}M) with full deployment contingent on results`)
  if (rec === 'Go')
    steps.push(`Initiate CEQA/NEPA pre-application consultation for ${site.name}`)
  steps.push('Engage Imperial Irrigation District regarding grid interconnection and power purchase agreement terms')
  if (site.id === 'salton-sea-geothermal' || site.id === 'brawley-zone')
    steps.push('Assess lithium co-production potential alongside power — significant upside under the Lithium Valley Act')
  return steps.slice(0, 4)
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export function analyzeOpportunity(company: CompanyProfile, site: Site): AnalysisResult {
  const companyReadiness = computeCompanyReadiness(company, site)
  const seismicRisk = computeSeismicRisk(site)
  const economicViability = computeEconomicViability(company, site)
  const marketPolicySupport = computeMarketPolicySupport(company, site)

  const partial = { companyReadiness, seismicRisk, economicViability, marketPolicySupport }
  const overallPilotScore = computeOverallScore(partial)
  const scores: ScoreBreakdown = { ...partial, overallPilotScore }

  const recommendation = deriveRecommendation(overallPilotScore, company.riskTolerance)
  const keyOpportunities = deriveOpportunities(company, site, scores)
  const keyRisks = deriveRisks(company, site, scores)
  const nextSteps = deriveNextSteps(company, site, scores, recommendation)

  return { scores, recommendation, keyOpportunities, keyRisks, nextSteps }
}
