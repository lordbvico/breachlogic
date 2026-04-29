import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a BreachLogic puzzle designer. BreachLogic is a cybersecurity governance puzzle game where players identify policy seams — logical gaps that allow unauthorized access — by placing tokens on nodes in a policy graph.

Output ONLY a raw JSON object (no markdown fences, no explanation, no surrounding text). The JSON must exactly match this schema:

{
  "id": "BL-COMMUNITY-<unix_timestamp>",
  "version": "1",
  "meta": {
    "title": "<catchy 3-5 word title>",
    "tier": <1-5>,
    "tier_label": "<Scout|Analyst|Auditor|Red-Teamer|Grandmaster>",
    "domain": "<Cloud IAM|AI Agents|Financial Controls|Supply Chain|Incident Response|Compliance GRC|Network|Identity>",
    "season": 1,
    "estimated_minutes": <3-15>,
    "author": "Community",
    "status": "draft",
    "tags": ["<tag1>", "<tag2>"]
  },
  "narrative": {
    "scenario": "<2-3 sentences: the breach scenario from the attacker's perspective>",
    "intel_brief": "<1-2 sentences: background company/system context>",
    "world": "<company or org name>"
  },
  "map": {
    "nodes": [
      {
        "id": "n-1",
        "label": "<short label>",
        "sublabel": "<optional role or resource name>",
        "type": "<actor|gate|process|system|target>",
        "position": { "x": <number>, "y": <number> },
        "locked": <true only for target nodes>,
        "token_slot": <false for gate and target nodes, true for actor/process/system>,
        "privilege": "<user|admin|system|none>"
      }
    ],
    "edges": [
      {
        "from": "<node id>",
        "to": "<node id>",
        "label": "<optional edge label>",
        "type": "<flow|condition|trigger|bypass>",
        "blocked_by": "<node id of blocking gate, only when relevant>"
      }
    ]
  },
  "rules": [
    {
      "id": "R-01",
      "gate_id": "<id of a gate node>",
      "label": "<rule name>",
      "condition": "<IF condition — what triggers this rule>",
      "effect": "<THEN effect — what happens>"
    }
  ],
  "tokens": {
    "count": <2-3, matches solution steps count>,
    "labels": ["<Token A label>", "<Token B label>"]
  },
  "objective": {
    "description": "<what unauthorized access must be achieved — 1 sentence>",
    "target_node": "<id of the target node>",
    "unauthorized_outcome": "<1 sentence: the bad outcome if breached>"
  },
  "solution": {
    "steps": [
      {
        "step": 1,
        "node_id": "<id of a token-slot node>",
        "action": "<what the attacker does at this node>",
        "mechanism": "<1-2 sentences: how/why this exploits the policy gap>"
      }
    ],
    "seam_type": "<missing-clause|policy-contradiction|delegation-chain|scope-confusion|race-condition|ai-logic-chain>",
    "seam_description": "<1-2 sentences describing the exact logical gap>"
  },
  "pedagogy": {
    "aha_moment": "<key insight the player gains — 1-2 sentences>",
    "ctem_principle": "<one actionable principle, e.g. Validate policy completeness at every gate>",
    "hint_sequence": [
      { "level": 1, "prompt": "<broad nudge, Socratic question>" },
      { "level": 2, "prompt": "<more specific, points to a rule or node>" },
      { "level": 3, "prompt": "<near-explicit hint about the gap>" }
    ],
    "framework_mapping": ["<NIST AC-X>", "<SOC 2 CCX.X>", "<ISO 27001 A.X.X>"]
  }
}

LAYOUT RULES:
- Place nodes horizontally: Actor at x≈100, Gates at x≈300-400, Processes/Systems at x≈500-600, Target at x≈750
- Use y≈200 for main flow; branch nodes at y≈100 or y≈320
- Space nodes at least 160px apart

PUZZLE DESIGN RULES:
- The seam must be a REAL logical gap (not just a missing permission) — e.g., a gate that checks role but not scope, a delegation that doesn't cap re-delegation, an approval flow with a race window
- Token count: 2-3 tokens placed on actor/process/system nodes that form the breach path
- The player should be able to identify the exploit without writing code — just by reading the policy rules
- Each puzzle should teach one clear security principle
- Include 3-5 nodes total (keep it learnable at tier 1-2, complex at tier 4-5)
- Tier 1 (Scout): 3-4 nodes, obvious gap, single path
- Tier 3 (Auditor): 5-6 nodes, subtle gap, may require a bypass edge
- Tier 5 (Grandmaster): 6-8 nodes, complex interaction, multiple gates`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { description, domain, tier } = body as {
      description: string
      domain?: string
      tier?: number
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description required' }, { status: 400 })
    }

    const userPrompt = [
      `Generate a BreachLogic puzzle with this concept:`,
      `"${description.trim()}"`,
      domain  ? `Domain: ${domain}` : '',
      tier    ? `Tier: ${tier} (${['', 'Scout', 'Analyst', 'Auditor', 'Red-Teamer', 'Grandmaster'][tier]})` : '',
      ``,
      `Make it realistic, educational, and immediately playable. The policy gap must be logical and non-obvious.`,
      `Use unix timestamp ${Date.now()} for the puzzle ID.`,
    ].filter(Boolean).join('\n')

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: userPrompt }],
      system: SYSTEM_PROMPT,
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No content returned' }, { status: 500 })
    }

    // Extract JSON — strip any accidental markdown fences
    const raw = textBlock.text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const puzzle = JSON.parse(raw)

    // Basic validation
    if (!puzzle.id || !puzzle.map?.nodes?.length || !puzzle.solution?.steps?.length) {
      return NextResponse.json({ error: 'Generated puzzle is incomplete' }, { status: 500 })
    }

    return NextResponse.json({ puzzle })
  } catch (err) {
    console.error('Generate puzzle error:', err)
    const msg = err instanceof SyntaxError ? 'AI returned malformed JSON — try again' : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
