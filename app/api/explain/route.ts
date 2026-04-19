import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AnalysisResult, CompanyProfile, Site } from '@/lib/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { company, site, result, privateData }: {
    company: CompanyProfile
    site: Site
    result: AnalysisResult
    privateData?: string
  } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ explanation: buildFallback(company, site, result) })
  }

  const client = new Anthropic()

  const privateSection = privateData?.trim()
    ? `\nAdditional private company context (use to personalize the memo):\n${privateData.slice(0, 3000)}\n`
    : ''

  const prompt = `You are a strategic advisor to an oil and gas drilling company evaluating a geothermal pilot.

Company: ${company.companyName} | Rigs: ${company.rigCount} | Max depth: ${company.drillingDepthFt.toLocaleString()} ft | Budget: $${company.pilotBudgetM}M | Risk tolerance: ${company.riskTolerance} | Crew: ${company.crewExpertise}

Site: ${site.name} | Temp gradient: ${site.tempGradientCPerKm}°C/km | ROM p95 PGV: ${site.romSeismic.pgvP95CmS} cm/s | PGA ${site.pga}g | Est. capex: $${site.estimatedCapexM}M

Scores — Overall: ${result.scores.overallPilotScore}/100 | Readiness: ${result.scores.companyReadiness}/100 | Seismic risk: ${result.scores.seismicRisk}/100 | Economic: ${result.scores.economicViability}/100 | Market: ${result.scores.marketPolicySupport}/100

Recommendation: ${result.recommendation}

Opportunities: ${result.keyOpportunities.join('; ')}
Risks: ${result.keyRisks.join('; ')}
Next steps: ${result.nextSteps.join('; ')}
${privateSection}
Write a concise executive memo (3–4 paragraphs) for the company's leadership explaining this recommendation. Where private company context is available, reference it specifically (equipment, crew, budget, prior projects) to make the memo feel tailored rather than generic. Focus on strategic logic, primary opportunity, main risks, and recommended first move. Professional, direct tone. No headers or bullets.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const explanation =
    message.content[0].type === 'text'
      ? message.content[0].text
      : buildFallback(company, site, result)

  return NextResponse.json({ explanation })
}

function buildFallback(company: CompanyProfile, site: Site, result: AnalysisResult): string {
  const { recommendation, scores, keyOpportunities, keyRisks, nextSteps } = result
  return `${company.companyName}'s evaluation of a geothermal pilot at ${site.name} yields an overall pilot viability score of ${scores.overallPilotScore}/100, resulting in a ${recommendation} recommendation. This assessment reflects your company's operational capabilities, the site's geophysical profile, and the broader market environment in California's Imperial Valley.

The strongest drivers are ${keyOpportunities[0]?.toLowerCase() || 'favorable resource quality'} and ${keyOpportunities[1]?.toLowerCase() || 'strong policy incentives under the Inflation Reduction Act'}. California's Renewable Portfolio Standard and the Lithium Valley Act create a compelling long-term backdrop that de-risks the revenue case for a geothermal investment in this region.

The primary risks to manage are ${keyRisks[0]?.toLowerCase() || 'seismic exposure and equipment compatibility'}. These are addressable but require proactive planning before committing capital. A staged approach beginning with 1–2 wells is the most prudent path given the current risk profile.

The recommended first move is to ${nextSteps[0]?.toLowerCase() || 'commission a detailed site assessment and engage permitting authorities'}. This establishes the technical and regulatory foundation needed to reach a full pilot investment decision within 6–12 months.`
}
