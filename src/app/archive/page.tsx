import { PUZZLES } from '@/data/puzzles'
import DailyCard from '@/components/home/DailyCard'
import { DOMAIN_ICONS, TIER_CONFIG } from '@/constants/theme'
import type { PuzzleDomain } from '@/types/puzzle'

export const metadata = {
  title: 'Archive — BreachLogic',
  description: 'Browse the full puzzle library, filtered by tier and domain.',
}

const TIERS = [1, 2, 3, 4, 5]
const DOMAINS: PuzzleDomain[] = [
  'Cloud IAM', 'AI Agents', 'Financial Controls', 'Supply Chain',
  'Incident Response', 'Compliance GRC', 'Network', 'Identity',
]

export default function ArchivePage() {
  // Group puzzles by tier
  const byTier = TIERS.map((t) => ({
    tier: t,
    label: TIER_CONFIG[t].label,
    puzzles: PUZZLES.filter((p) => p.meta.tier === t),
  })).filter((g) => g.puzzles.length > 0)

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">Puzzle Archive</h1>
        <p className="text-sm text-slate mt-1">
          {PUZZLES.length} puzzles across {byTier.length} tiers. Pro subscribers get full access.
        </p>
      </div>

      {/* Tier groups */}
      {byTier.map(({ tier, label, puzzles }) => {
        const cfg = TIER_CONFIG[tier]
        return (
          <section key={tier}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: cfg.bgColor, color: cfg.color }}
              >
                {label}
              </span>
              <span className="text-xs text-slate-mid">
                {cfg.description} · {puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2.5">
              {puzzles.map((p) => (
                <DailyCard key={p.id} puzzle={p} compact />
              ))}
            </div>
          </section>
        )
      })}

      {/* Unlock CTA */}
      <div className="rounded-xl border border-brand-navy/20 bg-brand-navy/5 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-brand-navy">Full archive — 90+ puzzles</p>
        <p className="text-xs text-slate mt-1 mb-3">
          Unlock the complete library with filters, practice mode, and domain-specific training paths.
        </p>
        <button className="px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-brand-navydk transition-colors">
          Upgrade to Pro — $9.99/mo
        </button>
      </div>
    </div>
  )
}
