import { NextRequest, NextResponse } from 'next/server'
import { analyzeOpportunity } from '@/lib/scoring'
import { SALTON_SEA_SITES } from '@/data/sites'
import { CompanyProfile } from '@/lib/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { company, siteId }: { company: CompanyProfile; siteId: string } = body

  const site = SALTON_SEA_SITES.find((s) => s.id === siteId)
  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  const result = analyzeOpportunity(company, site)
  return NextResponse.json({ result, site })
}
