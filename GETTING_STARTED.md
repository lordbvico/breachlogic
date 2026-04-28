# BreachLogic — Getting Started

## Prerequisites
- Node.js 18+ (https://nodejs.org)
- npm 9+

## Run locally

```bash
# 1. Open Terminal and navigate to this folder
cd "path/to/MobileApp"

# 2. Install dependencies (first time only, ~60 seconds)
npm install

# 3. Start the dev server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

## Project structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── page.tsx           # Home — daily puzzle + streak
│   ├── puzzle/[id]/       # Individual puzzle canvas
│   ├── archive/           # Full puzzle library
│   ├── sandbox/           # Governance Sandbox (community)
│   └── profile/           # User profile + ATQ
│
├── components/
│   ├── layout/Navbar.tsx          # Top navigation
│   ├── puzzle/PuzzleCanvas.tsx    # ★ Main node-graph canvas (React Flow)
│   ├── puzzle/RuleSetPanel.tsx    # Left panel: rule set
│   ├── puzzle/ObjectivePanel.tsx  # Right panel: tokens + objective
│   ├── puzzle/BreachOverlay.tsx   # Post-solve overlay
│   └── home/                      # Home page components
│
├── types/puzzle.ts        # All TypeScript types (derived from puzzle_schema.json)
├── constants/theme.ts     # Brand colors, tier config, domain icons
├── data/puzzles.ts        # Seed puzzles (3 puzzles: Tier 1, 3, 5)
└── lib/puzzle-engine.ts   # Client-side breach validation + ATQ scoring
```

## Adding puzzles

Add new puzzles to `src/data/puzzles.ts` following the schema in `puzzle_schema.json`.
The puzzle engine validates them automatically when a player confirms a breach.

## Key pages

| Route              | What you see                                         |
|--------------------|------------------------------------------------------|
| `/`                | Daily puzzle card + streak banner                    |
| `/puzzle/BL-AIGT-0001` | The Over-Provisioned Agent (Tier 5 Grandmaster) |
| `/puzzle/BL-COMP-0001` | The Ghost Approver (Tier 1 Scout)               |
| `/puzzle/BL-IAM-0003`  | The Helpful Delegator (Tier 3 Auditor)          |
| `/archive`         | All puzzles grouped by tier                          |
| `/sandbox`         | Community puzzle builder                             |
| `/profile`         | ATQ score, rank, domain breakdown                    |

## Next development steps

1. **Auth** — add Supabase auth (`npm install @supabase/supabase-js`)
2. **Database** — connect puzzle completion state to Supabase
3. **Puzzle builder** — wire up the Sandbox page's "New Puzzle" button
4. **AI hints** — connect the hint system to the Claude API
5. **Stripe** — add Pro subscription billing
