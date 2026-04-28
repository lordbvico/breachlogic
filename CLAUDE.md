# BreachLogic — Claude Code Context

## Project overview
BreachLogic is a cybersecurity puzzle game built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and React Flow. Players solve governance/IAM breach scenarios by identifying policy violations on a node-graph canvas.

## Tech stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + `tailwind-merge` + `clsx`
- **Graph canvas**: `@xyflow/react` (React Flow v12)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Dev commands
```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run type-check   # TypeScript check (no emit)
npm run lint         # ESLint
```

## Project structure
```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Home — daily puzzle + streak
│   ├── puzzle/[id]/page.tsx    # Individual puzzle canvas
│   ├── archive/page.tsx        # Full puzzle library
│   ├── sandbox/page.tsx        # Governance Sandbox (community builder)
│   └── profile/page.tsx        # User profile + ATQ score
│
├── components/
│   ├── layout/Navbar.tsx
│   ├── puzzle/PuzzleCanvas.tsx      # ★ Main node-graph canvas (React Flow)
│   ├── puzzle/RuleSetPanel.tsx      # Left panel: rule set
│   ├── puzzle/ObjectivePanel.tsx    # Right panel: tokens + objective
│   ├── puzzle/BreachOverlay.tsx     # Post-solve overlay
│   └── home/                        # Home page components
│
├── types/puzzle.ts             # All TypeScript types (from puzzle_schema.json)
├── constants/theme.ts          # Brand colors, tier config, domain icons
├── data/puzzles.ts             # Seed puzzles (Tier 1, 3, 5)
└── lib/puzzle-engine.ts        # Client-side breach validation + ATQ scoring
```

## Key data files
- `puzzle_schema.json` — canonical puzzle schema (source of truth for types)
- `puzzles_seed.json` — seed puzzle data
- `src/data/puzzles.ts` — puzzle data used at runtime

## Puzzle routes
| Route | Puzzle |
|---|---|
| `/puzzle/BL-AIGT-0001` | The Over-Provisioned Agent (Tier 5) |
| `/puzzle/BL-COMP-0001` | The Ghost Approver (Tier 1) |
| `/puzzle/BL-IAM-0003` | The Helpful Delegator (Tier 3) |

## Planned next steps
1. **Auth** — Supabase auth (`@supabase/supabase-js`)
2. **Database** — puzzle completion state in Supabase
3. **Puzzle builder** — wire up Sandbox "New Puzzle" button
4. **AI hints** — Claude API integration
5. **Stripe** — Pro subscription billing

## Notes
- No backend yet — all state is client-side
- Puzzle validation logic lives entirely in `lib/puzzle-engine.ts`
- PRD documents: `BreachLogic_PRD_v1.0.docx` and `BreachLogic_PRD_v1.1.docx`
