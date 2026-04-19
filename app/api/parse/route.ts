import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  const { text } = await request.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ profile: null, note: 'Add ANTHROPIC_API_KEY to enable auto-fill' })
  }

  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Extract drilling company profile data from the text below. Return ONLY a JSON object — no explanation, no markdown.

Fields to extract (use null if not found or unclear):
{
  "companyName": string | null,
  "rigCount": number | null,
  "drillingDepthFt": number | null,
  "tempToleranceF": number | null,
  "crewExpertise": "novice" | "intermediate" | "experienced" | "expert" | null,
  "operatingRegions": ["california" | "southwest_us" | "other_us" | "international"] | null,
  "pilotBudgetM": number | null,
  "timelineMonths": number | null,
  "riskTolerance": "low" | "medium" | "high" | null
}

Company data:
${text.slice(0, 5000)}`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'

  try {
    const profile = JSON.parse(raw)
    const filled = Object.values(profile).filter((v) => v !== null).length
    return NextResponse.json({ profile, filled })
  } catch {
    return NextResponse.json({ profile: null, filled: 0 })
  }
}
