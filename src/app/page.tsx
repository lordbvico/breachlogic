import Link from 'next/link'
import { Shield, Target, Zap, BookOpen, ChevronRight, Lock, Users, TrendingUp } from 'lucide-react'
import { TIER_CONFIG, DOMAIN_ICONS } from '@/constants/theme'

export default function LandingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-16 py-4">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 bg-brand-teallite border border-brand-teal/30 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-tealdk">
          <Zap className="w-3 h-3" />
          Season 2 · AI Red-Teamer puzzles now live
        </div>
        <h1 className="text-4xl font-semibold text-brand-navy leading-tight">
          Train the adversarial<br />
          <span className="text-brand-teal">mindset.</span>
        </h1>
        <p className="text-base text-slate leading-relaxed max-w-lg mx-auto">
          BreachLogic is a daily logic puzzle game for security professionals. Find the gap in a rule-governed system before an attacker does — one seam at a time.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/puzzles"
            className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white font-semibold rounded-xl hover:bg-brand-navydk transition-colors text-sm"
          >
            Start training free
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate font-semibold rounded-xl hover:bg-white hover:border-brand-teal/40 transition-colors text-sm"
          >
            <BookOpen className="w-4 h-4" />
            How it works
          </Link>
        </div>
      </section>

      {/* ── What is a seam ────────────────────────────────────────────────── */}
      <section>
        <div className="rounded-2xl bg-brand-navy text-white p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">The concept</p>
          <h2 className="text-xl font-semibold mb-3">Every secure system has a seam.</h2>
          <p className="text-sm text-white/70 leading-relaxed max-w-xl mb-6">
            A seam is the logical gap between two individually correct policy rules that together create an unintended breach path. Real attackers find seams. So do auditors and red-teamers. BreachLogic trains you to see them.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '📋', title: 'Read the rules',    desc: 'Study the IF/THEN policy set. Every puzzle has 3–4 rules.' },
              { icon: '🗺️', title: 'Trace the graph',   desc: 'Navigate the node network. Find the blocked path and what bypasses it.' },
              { icon: '🎯', title: 'Place your tokens', desc: 'Select the nodes that form your breach path. Confirm when ready.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="space-y-2">
                <span className="text-2xl">{icon}</span>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tiers ─────────────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-mid mb-4">Five difficulty tiers</p>
        <div className="grid gap-2.5">
          {([1, 2, 3, 4, 5] as const).map((tier) => {
            const cfg = TIER_CONFIG[tier]
            const examples: Record<number, string> = {
              1: 'A rule with no ELSE branch — payments slip through.',
              2: 'Two policies that conflict when combined.',
              3: 'Three roles that chain into escalated privilege.',
              4: 'Two clocks, two time sources, one bypass window.',
              5: 'An AI self-correction loop running at system privilege.',
            }
            return (
              <div key={tier} className="flex items-center gap-4 rounded-xl bg-white border border-slate-200 px-4 py-3">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 w-24 text-center"
                  style={{ background: cfg.bgColor, color: cfg.color }}
                >
                  T{tier} · {cfg.label}
                </span>
                <p className="text-xs text-slate">{examples[tier]}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Domains ───────────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-mid mb-4">8 security domains</p>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(DOMAIN_ICONS).map(([domain, icon]) => (
            <div key={domain} className="rounded-xl bg-white border border-slate-200 p-3 text-center">
              <span className="text-xl">{icon}</span>
              <p className="text-[10px] text-slate mt-1.5 leading-tight">{domain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social proof ──────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users,     stat: '8',      label: 'puzzles in the archive' },
            { icon: TrendingUp, stat: '5',     label: 'difficulty tiers'       },
            { icon: Lock,      stat: '∞',      label: 'seams to find'          },
          ].map(({ icon: Icon, stat, label }) => (
            <div key={label} className="rounded-xl bg-white border border-slate-200 p-5 text-center">
              <Icon className="w-5 h-5 text-brand-navy mx-auto mb-2" />
              <p className="text-2xl font-semibold text-brand-navy">{stat}</p>
              <p className="text-[11px] text-slate-mid mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-brand-teal/30 bg-brand-teallite p-8 text-center space-y-4">
        <Target className="w-8 h-8 text-brand-teal mx-auto" />
        <h2 className="text-xl font-semibold text-brand-navy">Ready to train?</h2>
        <p className="text-sm text-slate leading-relaxed max-w-md mx-auto">
          Sign in with Google to track your ATQ score, maintain your streak, and unlock the full puzzle archive.
        </p>
        <Link
          href="/puzzles"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-navy text-white font-semibold rounded-xl hover:bg-brand-navydk transition-colors text-sm"
        >
          Start training — it&apos;s free
          <ChevronRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-slate-mid">No credit card required · Cancel anytime</p>
      </section>

    </div>
  )
}
