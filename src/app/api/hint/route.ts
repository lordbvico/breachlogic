import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { puzzleTitle, scenario, rules, nodes, objective, hintLevel, previousHints } = body

    const rulesText = rules
      .map((r: { id: string; condition: string; effect: string }) =>
        `- Rule ${r.id}: IF ${r.condition} THEN ${r.effect}`)
      .join('\n')

    const nodesText = nodes
      .map((n: { label: string; type: string }) => `- ${n.label} (${n.type})`)
      .join('\n')

    const prevHintsText = previousHints?.length
      ? `\nPrevious hints already given:\n${previousHints.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}`
      : ''

    const prompt = `You are a cybersecurity educator helping a student solve a governance/IAM puzzle called "${puzzleTitle}".

Scenario: ${scenario}

Policy rules in effect:
${rulesText}

Nodes in the network:
${nodesText}

Objective: ${objective}
${prevHintsText}

Give hint #${hintLevel}. Use the Socratic method — ask a guiding question or point the student toward a specific rule or node to examine, without revealing the answer. Keep it to 1-2 sentences. Be progressively more specific with each hint level.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const hint = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ hint })
  } catch (err) {
    console.error('Hint API error:', err)
    return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 })
  }
}
