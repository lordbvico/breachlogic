import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { PUZZLES } from '@/data/puzzles'
import DailyCard from '@/components/home/DailyCard'
import { DOMAIN_ICONS, TIER_CONFIG } from '@/constants/theme'
import type { Puzzle } from '@/types/puzzle'

export const metadata = {
  title: 'Puzzles — BreachLogic',
  description: 'Browse the full puzzle library, filtered by tier and domain.',
}

const TIERS = [1, 2, 3, 4, 5]

/** Max ATQ for a puzzle = tier × 20 (no hints, solved exactly at estimated time) */
function maxAtq(tier: number) { return tier * 20 }

/** Percentage score clamped 0–100 */
function scorePct(atqDelta: number, tier: number) {
  return Math.min(100, Math.max(0, Math.round((atqDelta / maxAtq(tier)) * 100)))
}

export default async function PuzzlesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/puzzles')

  const adminDb = createAdminClient()

  const [{ data: completions }, { data: communityRows }, { data: hiddenRows }] = await Promise.all([
    supabase
      .from('puzzle_completions')
      .select('puzzle_id, atq_delta, tier')
      .eq('user_id', user.id),
    supabase
      .from('community_puzzles')
      .select('data, author_id')
      .eq('published', true)
      .order('updated_at', { ascending: false }),
    // Must use admin client — RLS prevents regular users from reading unpublished rows
    adminDb
      .from('community_puzzles')
      .select('data')
      .eq('published', false),
  ])

  // Map puzzle_id → { atqDelta, tier } for score display
  const completionMap = new Map(
    (completions ?? []).map((c) => [
      c.puzzle_id as string,
      { atqDelta: (c.atq_delta as number | null) ?? 0, tier: (c.tier as number | null) ?? 1 },
    ]),
  )
  const solvedIds = new Set(completionMap.keys())

  // Community puzzles (published from sandbox)
  const communityPuzzles: Puzzle[] = (communityRows ?? [])
    .map((r) => r.data as unknown as Puzzle)
    .filter(Boolean)

  // Official puzzles hidden by admin via hidden override
  const hiddenOfficialIds = new Set(
    (hiddenRows ?? [])
      .filter((r) => (r.data as Record<string, unknown>)?._hidden === true)
      .map((r) => (r.data as Record<string, unknown>)?.id as string)
      .filter(Boolean),
  )

  // Split Everyday Security from technical puzzles (excluding admin-hidden ones)
  const everydayPuzzles = PUZZLES.filter((p) => p.meta.domain === 'Everyday Security' && !hiddenOfficialIds.has(p.id))
  const technicalPuzzles = PUZZLES.filter((p) => p.meta.domain !== 'Everyday Security' && !hiddenOfficialIds.has(p.id))

  // Community puzzles that aren't Everyday Security get merged into tier sections
  const communityTechnical = communityPuzzles.filter((p) => p.meta.domain !== 'Everyday Security')
  const communityEveryday  = communityPuzzles.filter((p) => p.meta.domain === 'Everyday Security')

  const byTier = TIERS.map((t) => ({
    tier: t,
    label: TIER_CONFIG[t as keyof typeof TIER_CONFIG].label,
    official:  technicalPuzzles.filter((p) => p.meta.tier === t),
    community: communityTechnical.filter((p) => p.meta.tier === t),
  })).filter((g) => g.official.length + g.community.length > 0)

  const totalCount = (everydayPuzzles.length + technicalPuzzles.length) + communityPuzzles.length

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">Puzzles</h1>
        <p className="text-sm text-slate mt-1">
          {totalCount} puzzles · {solvedIds.size} solved
        </p>
      </div>

      {/* ── Everyday Security — shown first, for everyone ── */}
      {everydayPuzzles.length > 0 && (
        <section>
          {/* Banner */}
          <div className="rounded-xl bg-gradient-to-r from-success-greenlite to-brand-teallite border border-success-green/20 px-5 py-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{DOMAIN_ICONS['Everyday Security']}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-semibold text-brand-navy">Everyday Security</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-green/15 text-success-green border border-success-green/30">
                    For Everyone
                  </span>
                </div>
                <p className="text-xs text-slate leading-relaxed">
                  No technical background needed. These short puzzles teach the security habits that protect you at work and at home — phishing, passwords, physical security, and more.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {[...everydayPuzzles, ...communityEveryday].map((p) => {
              const c = completionMap.get(p.id)
              const isCustom = communityEveryday.some((cp) => cp.id === p.id)
              return (
                <DailyCard
                  key={p.id} puzzle={p} compact
                  solved={solvedIds.has(p.id)}
                  isCustom={isCustom}
                  atqEarned={c?.atqDelta}
                  scorePct={c ? scorePct(c.atqDelta, p.meta.tier) : undefined}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ── Technical puzzles by tier (official + community merged) ── */}
      {byTier.map(({ tier, label, official, community }) => {
        const cfg = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]
        const total = official.length + community.length
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
                {cfg.description} · {total} puzzle{total !== 1 ? 's' : ''}
                {community.length > 0 && (
                  <span className="ml-1.5 text-brand-tealdk">· {community.length} community</span>
                )}
              </span>
            </div>
            <div className="space-y-2.5">
              {official.map((p) => {
                const c = completionMap.get(p.id)
                return (
                  <DailyCard
                    key={p.id} puzzle={p} compact
                    solved={solvedIds.has(p.id)}
                    atqEarned={c?.atqDelta}
                    scorePct={c ? scorePct(c.atqDelta, p.meta.tier) : undefined}
                  />
                )
              })}
              {community.map((p) => {
                const c = completionMap.get(p.id)
                return (
                  <DailyCard
                    key={p.id} puzzle={p} compact isCustom
                    solved={solvedIds.has(p.id)}
                    atqEarned={c?.atqDelta}
                    scorePct={c ? scorePct(c.atqDelta, p.meta.tier) : undefined}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

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
