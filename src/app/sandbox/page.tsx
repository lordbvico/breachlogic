import { Layers, Plus, Users, Star } from 'lucide-react'

export const metadata = {
  title: 'Governance Sandbox — BreachLogic',
}

const COMMUNITY_PUZZLES = [
  { title: 'The Runaway Webhook',   author: 'Priya K.',  tier: 2, solves: 142, domain: 'Cloud IAM'          },
  { title: 'The Forgotten API Key', author: 'Marcus T.', tier: 1, solves: 89,  domain: 'Compliance GRC'     },
  { title: 'The Phantom Session',   author: 'Dele A.',   tier: 4, solves: 23,  domain: 'Identity'            },
]

export default function SandboxPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Governance Sandbox
          </h1>
          <p className="text-sm text-slate mt-1">
            Build your own System Maps from real-world frameworks, challenge the community to break them.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-brand-navydk transition-colors">
          <Plus className="w-4 h-4" />
          New Puzzle
        </button>
      </div>

      {/* Framework templates */}
      <div>
        <h2 className="text-xs font-semibold text-slate-mid uppercase tracking-widest mb-3">
          Start from a template
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'NIST CSF 2.0',   color: '#1A237E', bg: '#E3F2FD' },
            { name: 'ISO 27001',       color: '#0097A7', bg: '#E0F7FA' },
            { name: 'SOC 2 Type II',   color: '#3B6D11', bg: '#EAF3DE' },
            { name: 'EU AI Act',       color: '#BA7517', bg: '#FAEEDA' },
            { name: 'HIPAA',           color: '#633806', bg: '#FFF3E0' },
            { name: 'PCI-DSS',         color: '#A32D2D', bg: '#FCEBEB' },
          ].map(({ name, color, bg }) => (
            <button
              key={name}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-left hover:shadow-sm hover:border-brand-teal/40 transition-all"
              style={{ borderLeftWidth: 3, borderLeftColor: color }}
            >
              <span style={{ color }}>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Community puzzles */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-mid" />
          <h2 className="text-xs font-semibold text-slate-mid uppercase tracking-widest">
            Community challenges
          </h2>
        </div>
        <div className="space-y-2.5">
          {COMMUNITY_PUZZLES.map((p) => (
            <div
              key={p.title}
              className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-4 py-3 hover:border-brand-teal/40 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-navy truncate">{p.title}</p>
                <p className="text-[11px] text-slate-mid mt-0.5">
                  by {p.author} · {p.domain}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-mid flex-shrink-0">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" /> {p.solves} solves
                </span>
                <span className="w-5 h-5 rounded-full bg-slate-lite flex items-center justify-center text-[9px] font-bold text-slate">
                  T{p.tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-brand-teallite border border-brand-teal/30 p-5">
        <h2 className="text-sm font-semibold text-brand-tealdk mb-3">How the Sandbox works</h2>
        <div className="space-y-2.5 text-xs text-slate">
          {[
            'Build a System Map using the no-code drag-and-drop canvas — same tool as the daily puzzle editor.',
            'The solution validator confirms exactly one valid logical seam exists before you can publish.',
            'When another player breaks your sandbox, you both earn XP — incentivising challenges, not gatekeeping.',
            'Your Designer Rank tracks puzzle-creation reputation separately from your player ATQ.',
          ].map((step, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-teal/20 text-brand-tealdk text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
