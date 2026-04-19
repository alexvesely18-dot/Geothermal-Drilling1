export interface CompanyProfile {
  companyName: string
  rigCount: number
  drillingDepthFt: number
  tempToleranceF: number
  crewExpertise: 'novice' | 'intermediate' | 'experienced' | 'expert'
  operatingRegions: string[]
  pilotBudgetM: number
  timelineMonths: number
  riskTolerance: 'low' | 'medium' | 'high'
}

export interface Site {
  id: string
  name: string
  description: string
  zone: string
  lat: number
  lng: number
  tempGradientCPerKm: number
  pga: number
  faultDistanceKm: number
  seismicityLevel: 'low' | 'medium' | 'high'
  resourceQuality: number
  infrastructureScore: number
  estimatedCapexM: number
  keyFeatures: string[]
  keyRisks: string[]
}

export interface ScoreBreakdown {
  companyReadiness: number
  seismicRisk: number
  economicViability: number
  marketPolicySupport: number
  overallPilotScore: number
}

export interface AnalysisResult {
  scores: ScoreBreakdown
  recommendation: 'Go' | 'Conditional Go' | 'No-Go'
  keyOpportunities: string[]
  keyRisks: string[]
  nextSteps: string[]
}
