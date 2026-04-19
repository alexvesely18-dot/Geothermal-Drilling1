import { CompanyProfile } from './types'

/**
 * Reference company profile for cross-site analytics and benchmarking.
 * Matches the assessment form defaults — scores on the Analysis page are
 * illustrative until you complete an assessment with your own inputs.
 */
export const REFERENCE_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'Reference operator (median profile)',
  rigCount: 2,
  drillingDepthFt: 10000,
  tempToleranceF: 350,
  crewExpertise: 'intermediate',
  operatingRegions: ['southwest_us'],
  pilotBudgetM: 20,
  timelineMonths: 24,
  riskTolerance: 'medium',
}
