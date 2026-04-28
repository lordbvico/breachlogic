import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BookOpen, Layout, MousePointer, List, Search, Lightbulb, Zap,
  ChevronRight, CheckCircle, XCircle, AlertTriangle, Info,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How to Play — BreachLogic',
  description: 'Learn how to read the node graph, interpret policy rules, place tokens, and find the logical seam in every BreachLogic puzzle.',
}

const TOC = [
  { id: 'overview',      label: 'What is BreachLogic?',    icon: BookOpen    },
  { id: 'interface',     label: 'The Puzzle Interface',     icon: Layout      },
  { id: 'nodes',         label: 'Node & Edge Types',        icon: Search      },
  { id: 'rules',         label: 'Reading the Rule Set',     icon: List        },
  { id: 'tokens',        label: 'Placing Tokens',           icon: MousePointer},
  { id: 'seams',         label: 'Finding the Seam',         icon: Search      },
  { id: 'hints',         label: 'Hints & Feedback',         icon: Lightbulb   },
  { id: 'scoring',       label: 'ATQ Scoring',              icon: Zap         },
  { id: 'walkthrough',   label: 'Walkthrough: Ghost Approver', icon: ChevronRight },
]

export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-brand-navy">How to Play</h1>
        <p className="text-sm text-slate mt-1">
          Everything you need to go from curious to confident in BreachLogic.
        </p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-20">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid mb-3">Contents</p>
          <nav className="space-y-0.5">
            {TOC.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate hover:text-brand-navy hover:bg-brand-navy/5 transition-colors"
              >
                <Icon className="w-3 h-3 flex-shrink-0 text-slate-mid" />
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-6 rounded-lg bg-brand-teallite border border-brand-teal/30 p-3">
            <p className="text-[11px] font-semibold text-brand-tealdk mb-1">Ready to try?</p>
            <Link
              href="/puzzle/BL-COMP-0001"
              className="text-[11px] text-brand-teal hover:underline flex items-center gap-1"
            >
              Start with the Tier 1 puzzle <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-12">

          {/* ── Overview ──────────────────────────────────────────────────── */}
          <section id="overview" className="scroll-mt-20">
            <SectionHeading icon={BookOpen}>What is BreachLogic?</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              BreachLogic is a daily puzzle game that trains <strong className="text-brand-navy">adversarial thinking</strong> — the ability to look at a rule-governed system and find the gap that an attacker would exploit. Every puzzle is a miniature security scenario: a set of policy rules, a network of connected systems, and a sensitive target that should be unreachable.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Your job is not to break anything — it&apos;s to identify the <em>logical seam</em>: the combination of individually reasonable rules that together create an unintended path to the target. This is exactly what red-teamers, penetration testers, and compliance auditors do in real life.
            </p>
            <Callout icon={Info} color="teal">
              You are always playing the role of the auditor or attacker — never the defender. The goal is to find the breach path, not to patch it.
            </Callout>
          </section>

          {/* ── Interface ─────────────────────────────────────────────────── */}
          <section id="interface" className="scroll-mt-20">
            <SectionHeading icon={Layout}>The Puzzle Interface</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-5">
              Every puzzle has three panels arranged side by side.
            </p>

            <div className="grid gap-4 sm:grid-cols-3 mb-5">
              <PanelCard
                title="Left — Rule Set"
                color="navy"
                description="All the IF/THEN policy rules in force for this scenario. These define what is and isn't allowed — and where the gaps are."
              />
              <PanelCard
                title="Centre — Node Graph"
                color="teal"
                description="The interactive network diagram. Nodes are systems, accounts, services, and gates. Edges show how requests flow between them."
              />
              <PanelCard
                title="Right — Objective"
                color="red"
                description="The target you're trying to reach, your token slots, and action buttons. Place tokens on the nodes that form your breach path."
              />
            </div>

            <p className="text-sm text-slate leading-relaxed">
              The <strong className="text-brand-navy">top bar</strong> shows the puzzle title, tier, a countdown timer, and the <strong className="text-brand-navy">Intel Brief</strong> toggle (ℹ️) — click it to reveal background lore about the scenario&apos;s world.
            </p>
          </section>

          {/* ── Nodes & Edges ─────────────────────────────────────────────── */}
          <section id="nodes" className="scroll-mt-20">
            <SectionHeading icon={Search}>Node & Edge Types</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-5">
              Nodes and edges are colour-coded by type. Learning to read them quickly is the key skill.
            </p>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-mid mb-3">Node types</h3>
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              <NodeTypeCard bg="#E3F2FD" border="#1A237E" label="Actor" description="A human user, service account, or role. These are the starting points of most breach paths." example="You (Developer), Reviewer Role" />
              <NodeTypeCard bg="#FAEEDA" border="#BA7517" label="Gate" description="A policy check or logical condition. If the condition isn't met, the edge is blocked. Gates are the controls you need to bypass or exploit." example="Manager Gate, Budget Gate, SSO Gate" />
              <NodeTypeCard bg="#E0F7FA" border="#0097A7" label="Process" description="A running service, function, or mechanism. Processes can be exploited when they run at a higher privilege than the caller." example="Delegation Service, Self-Correction Loop" />
              <NodeTypeCard bg="#ECEFF1" border="#37474F" label="System" description="Infrastructure or platform-level execution context. System-level nodes typically bypass user-level gates." example="SYSTEM_LEVEL Exec, Agent Config File" />
              <NodeTypeCard bg="#FCEBEB" border="#A32D2D" label="Target" description="The sensitive resource you are trying to reach. Targets are always locked — you reach them indirectly via the breach path." example="Admin Panel, DB Backup Exec, Payment Approved" />
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-mid mb-3">Edge types</h3>
            <div className="space-y-2.5 mb-4">
              <EdgeRow color="#475569"  dashed={false} animated={false} label="Flow"      description="Normal request flow. Solid dark arrow — the default connection between nodes." />
              <EdgeRow color="#475569"  dashed={true}  animated={false} label="Blocked"   description="A flow edge that cannot be traversed without a bypass. Shows as a dashed red arrow." />
              <EdgeRow color="#E65100"  dashed={false} animated={true}  label="Bypass"    description="An alternate path that skips a gate. Animated orange — this is usually where the seam lives." />
              <EdgeRow color="#E65100"  dashed={false} animated={true}  label="Trigger"   description="An event that fires a process automatically. Animated orange — look for what causes it." />
              <EdgeRow color="#3B6D11"  dashed={false} animated={true}  label="Solve path" description="After a correct breach, the edges that formed your path glow green." />
            </div>

            <Callout icon={AlertTriangle} color="amber">
              Blocked edges (dashed red) tell you exactly which gate is protecting the path. Finding a <strong>bypass or trigger edge</strong> that reaches the same destination is usually the key move.
            </Callout>
          </section>

          {/* ── Rules ─────────────────────────────────────────────────────── */}
          <section id="rules" className="scroll-mt-20">
            <SectionHeading icon={List}>Reading the Rule Set</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Every rule in the left panel follows the same pattern:
            </p>

            <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5 font-mono text-sm">
              <div className="flex gap-3 items-start mb-2">
                <span className="text-[10px] font-semibold bg-slate-lite text-slate px-2 py-0.5 rounded flex-shrink-0 mt-0.5">R-01</span>
                <div>
                  <span className="text-brand-tealdk font-semibold">IF</span>
                  <span className="text-slate"> payment ≤ $500</span>
                  <br />
                  <span className="text-target-red font-semibold">THEN</span>
                  <span className="text-slate"> approve automatically with no manager check</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate leading-relaxed mb-4">
              The <strong className="text-brand-tealdk">IF</strong> clause is the <em>condition</em> — what must be true for the rule to fire. The <strong className="text-target-red">THEN</strong> clause is the <em>effect</em> — what happens when it does.
            </p>

            <p className="text-sm text-slate leading-relaxed mb-3">
              When reading rules, ask these three questions:
            </p>

            <ol className="space-y-3 mb-4 pl-4">
              {[
                { q: 'What does the rule NOT cover?', detail: 'Rules only define what happens when their condition IS met. The gap is almost always in the unspecified ELSE branch — what happens when the condition is NOT met.' },
                { q: 'Which nodes does the rule reference?', detail: 'Rules are tied to gate nodes. Find the gate in the graph and trace the edges into and out of it.' },
                { q: 'Are two rules contradicting each other?', detail: 'Some seams exist because two rules written independently create conflicting behaviour when combined — each rule is correct, but together they open a gap.' },
              ].map(({ q, detail }, i) => (
                <li key={i} className="text-sm text-slate">
                  <span className="font-semibold text-brand-navy">{i + 1}. {q}</span>
                  <p className="text-slate-mid leading-relaxed mt-0.5 ml-0">{detail}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Tokens ────────────────────────────────────────────────────── */}
          <section id="tokens" className="scroll-mt-20">
            <SectionHeading icon={MousePointer}>Placing Tokens</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Action tokens represent the steps in your breach. Each token corresponds to a node — you&apos;re saying &quot;I take action at this node.&quot;
            </p>

            <div className="space-y-3 mb-5">
              <Step n={1} title="Identify token-slot nodes">
                Nodes with a small teal dot at the bottom are selectable. Locked nodes (🔒) cannot receive tokens.
              </Step>
              <Step n={2} title="Click a node to place a token">
                A selected node shows a navy circle with a ✓ and a teal ring. The token appears in the right panel, labelled A, B, C…
              </Step>
              <Step n={3} title="Click again or press ✕ to remove">
                Toggle tokens freely until you&apos;re satisfied with your path.
              </Step>
              <Step n={4} title="Fill all slots, then click Confirm Breach">
                The Confirm button only activates when all required tokens are placed. If the path is wrong, the canvas pulses red and a &quot;No valid breach path&quot; message appears. Try again.
              </Step>
            </div>

            <Callout icon={Info} color="teal">
              Token <em>order</em> doesn&apos;t matter for validation — what matters is that the right nodes are selected. The solution steps explain the logical order after you solve.
            </Callout>
          </section>

          {/* ── Seams ─────────────────────────────────────────────────────── */}
          <section id="seams" className="scroll-mt-20">
            <SectionHeading icon={Search}>Finding the Seam</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              A <strong className="text-brand-navy">seam</strong> is the logical gap between two or more policies that creates an unintended path. Every BreachLogic puzzle has exactly one seam type.
            </p>

            <div className="space-y-3">
              {[
                { name: 'Missing Clause',       color: '#EAF3DE', text: '#3B6D11', desc: 'A rule only defines what happens when its condition IS met — and has no ELSE branch. The gap is the undefined case.', tip: 'Look for a gate that only fires on a specific input. What happens when that input is absent?' },
                { name: 'Policy Contradiction', color: '#FCEBEB', text: '#A32D2D', desc: 'Two rules written by different teams conflict when combined. Each rule is individually correct, but together they create a gap.', tip: 'Compare rules that cover the same resource or action. Do they share a common enforcement point?' },
                { name: 'Delegation Chain',     color: '#E3F2FD', text: '#1A237E', desc: 'Three or more individually reasonable rules chain together to create a privilege escalation path.', tip: 'Trace from the lowest-privilege actor upward. Can you inherit a role → use that role to get another → use that one to reach the target?' },
                { name: 'Scope Confusion',      color: '#E0F7FA', text: '#0097A7', desc: 'A control is defined by a technical property (IP range, role name, subnet) that can be legitimately acquired by an unintended party.', tip: "Ask: who ELSE has this property? The rule author assumed only one group would qualify — but who else does?" },
                { name: 'Race Condition',       color: '#FAEEDA', text: '#BA7517', desc: 'Two controls use different time sources or event orderings. Manipulating the order or timing allows both to be satisfied simultaneously.', tip: 'Look for clocks, timers, or sequence-dependent checks. Does any control trust a client-reported value?' },
                { name: 'AI Logic Chain',       color: '#FCEBEB', text: '#A32D2D', desc: 'A self-correction or autonomous process runs at elevated privilege. Influencing what the system "repairs" effectively runs attacker input at system level.', tip: 'Find the self-correction mechanism. What determines what it fixes, and at what privilege level does it run?' },
              ].map(({ name, color, text, desc, tip }) => (
                <div key={name} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: color, color: text }}>
                      {name}
                    </span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed mb-2">{desc}</p>
                  <p className="text-[11px] text-brand-tealdk">
                    <span className="font-semibold">Tip: </span>{tip}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Hints ─────────────────────────────────────────────────────── */}
          <section id="hints" className="scroll-mt-20">
            <SectionHeading icon={Lightbulb}>Hints & Feedback</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Each puzzle has up to three hints. Hints are Socratic — they ask a guiding question rather than giving away the answer. Each successive hint is more specific.
            </p>
            <div className="space-y-3 mb-5">
              <div className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-white text-sm">
                <span className="w-6 h-6 rounded-full bg-brand-teal/20 text-brand-tealdk text-[10px] font-semibold flex items-center justify-center flex-shrink-0">1</span>
                <p className="text-slate">Broad directional nudge — points you to the right area of the graph or the relevant rule.</p>
              </div>
              <div className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-white text-sm">
                <span className="w-6 h-6 rounded-full bg-brand-teal/20 text-brand-tealdk text-[10px] font-semibold flex items-center justify-center flex-shrink-0">2</span>
                <p className="text-slate">More specific — focuses on the exact gap or mechanism to exploit.</p>
              </div>
              <div className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-white text-sm">
                <span className="w-6 h-6 rounded-full bg-brand-teal/20 text-brand-tealdk text-[10px] font-semibold flex items-center justify-center flex-shrink-0">3</span>
                <p className="text-slate">Near-explicit — tells you which nodes to focus on and what to look for in the rules.</p>
              </div>
            </div>
            <Callout icon={AlertTriangle} color="amber">
              Each hint used reduces your ATQ score by 8 points. Try to solve without hints first — then use them strategically if stuck.
            </Callout>
            <p className="text-sm text-slate leading-relaxed mt-4">
              After a correct solve, the <strong className="text-brand-navy">Breach Confirmed</strong> overlay shows the solution steps, the seam description, and the <em>aha moment</em> — the core insight the puzzle teaches. Reading this carefully is how you get better.
            </p>
          </section>

          {/* ── Scoring ───────────────────────────────────────────────────── */}
          <section id="scoring" className="scroll-mt-20">
            <SectionHeading icon={Zap}>ATQ Scoring</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              ATQ (Adversarial Thinking Quotient) is your running score. It increases with each puzzle you solve and determines your rank.
            </p>

            <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5">
              <p className="text-xs font-semibold text-slate-mid uppercase tracking-wider mb-3">Score formula</p>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span className="text-slate">Base points</span><span className="text-brand-navy font-semibold">Tier × 20 (20–100)</span></div>
                <div className="flex justify-between"><span className="text-slate">Hint penalty</span><span className="text-target-red font-semibold">−8 per hint used</span></div>
                <div className="flex justify-between"><span className="text-slate">Speed bonus</span><span className="text-success-green font-semibold">−10 to +10</span></div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-5 mb-5">
              {[
                { rank: 'Scout',       range: '0–199',   color: '#3B6D11', bg: '#EAF3DE' },
                { rank: 'Analyst',     range: '200–399', color: '#0097A7', bg: '#E0F7FA' },
                { rank: 'Auditor',     range: '400–599', color: '#1A237E', bg: '#E3F2FD' },
                { rank: 'Red-Teamer', range: '600–799', color: '#BA7517', bg: '#FAEEDA' },
                { rank: 'Grandmaster',range: '800+',    color: '#A32D2D', bg: '#FCEBEB' },
              ].map(({ rank, range, color, bg }) => (
                <div key={rank} className="rounded-lg p-3 text-center border border-slate-200">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: bg, color }}>
                    {rank}
                  </span>
                  <p className="text-[11px] text-slate-mid mt-1.5">{range} ATQ</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate leading-relaxed">
              The speed bonus compares your solve time to the puzzle&apos;s estimated time. Solve faster than estimated → up to +10 bonus. Take significantly longer → up to −10 penalty. The minimum ATQ earned from any solve is 1.
            </p>
          </section>

          {/* ── Walkthrough ───────────────────────────────────────────────── */}
          <section id="walkthrough" className="scroll-mt-20">
            <SectionHeading icon={ChevronRight}>Walkthrough: The Ghost Approver</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-2">
              Let&apos;s solve <strong className="text-brand-navy">The Ghost Approver</strong> (Tier 1 · Scout · Financial Controls) step by step. This is the best starting puzzle.
            </p>
            <Link href="/puzzle/BL-COMP-0001" className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline mb-5">
              Open the puzzle <ChevronRight className="w-3 h-3" />
            </Link>

            <WalkthroughStep n={1} title="Read the scenario">
              <p>You are approving a <strong>$750 payment</strong> without a Manager ID. The system auto-approves payments ≤ $500. Payments over $500 require manager sign-off.</p>
            </WalkthroughStep>

            <WalkthroughStep n={2} title="Read the rules">
              <div className="space-y-2 font-mono text-xs bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p><span className="text-brand-tealdk">IF</span> payment ≤ $500 <span className="text-target-red">THEN</span> approve automatically with no manager check</p>
                <p><span className="text-brand-tealdk">IF</span> payment &gt; $500 AND MGR_ID is present <span className="text-target-red">THEN</span> pass MGR_ID to the validator</p>
                <p><span className="text-brand-tealdk">IF</span> validator receives MGR_ID <span className="text-target-red">THEN</span> approve payment</p>
              </div>
              <p className="mt-2 text-sm text-slate">Notice R-02: it only fires when <code className="bg-slate-lite px-1 rounded text-xs">MGR_ID is present</code>. There is no rule for what happens when MGR_ID is <em>absent</em>.</p>
            </WalkthroughStep>

            <WalkthroughStep n={3} title="Ask: what does R-02 NOT cover?">
              <p>R-02 handles the case where payment &gt; $500 AND a Manager ID is provided. But what happens when payment &gt; $500 and <strong>no</strong> Manager ID is provided? Neither R-02 nor any other rule defines this. The Manager Gate simply doesn&apos;t fire — and neither does the Validator.</p>
            </WalkthroughStep>

            <WalkthroughStep n={4} title="Find it in the graph">
              <p>Look at the graph: the <strong>Validator</strong> node has a blocked edge to <strong>Payment Approved</strong> (dashed red). But the Validator is only reached via the Manager Gate — which only fires when MGR_ID is present. If you bypass the Manager Gate, the Validator is never called.</p>
            </WalkthroughStep>

            <WalkthroughStep n={5} title="Place your token">
              <p>This puzzle has <strong>1 token</strong>. Place it on the <strong>Validator</strong> node. You are indicating: &quot;I submit the payment with MGR_ID = NULL, which means the Validator is never triggered.&quot; The system defaults to approved.</p>
            </WalkthroughStep>

            <WalkthroughStep n={6} title="Confirm Breach">
              <p>Click <strong>Confirm Breach</strong>. The solve path lights up green. The overlay reveals the aha moment: <em>&quot;Rules that only define what to do when a condition IS met — but never when it is NOT — leave a missing-clause gap.&quot;</em></p>
            </WalkthroughStep>

            <div className="mt-4 rounded-xl border border-success-green/30 bg-success-greenlite p-4 flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-success-green flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-success-green mb-0.5">You found the seam: Missing Clause</p>
                <p className="text-xs text-slate leading-relaxed">The Amount Gate and Manager Gate each handle their own happy path but neither defines the failure path for a missing MGR_ID on a large payment. The gap between two &quot;secure&quot; rules creates an open lane.</p>
              </div>
            </div>

            <div className="mt-6 text-center pt-6 border-t border-slate-200">
              <p className="text-sm font-semibold text-brand-navy mb-3">Ready to train?</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/puzzle/BL-COMP-0001" className="px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-brand-navydk transition-colors">
                  Solve The Ghost Approver
                </Link>
                <Link href="/archive" className="px-4 py-2 border border-slate-200 text-slate text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                  Browse all puzzles
                </Link>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
      <Icon className="w-4 h-4 text-brand-navy" />
      <h2 className="text-base font-semibold text-brand-navy">{children}</h2>
    </div>
  )
}

function Callout({ icon: Icon, color, children }: { icon: React.ElementType; color: 'teal' | 'amber'; children: React.ReactNode }) {
  const styles = {
    teal:  { wrapper: 'bg-brand-teallite border-brand-teal/30',  icon: 'text-brand-teal',  text: 'text-brand-tealdk' },
    amber: { wrapper: 'bg-gate-amberlite border-gate-amber/30',  icon: 'text-gate-amber',  text: 'text-gate-amberdk' },
  }[color]
  return (
    <div className={`rounded-lg border px-4 py-3 flex gap-3 ${styles.wrapper}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      <p className={`text-xs leading-relaxed ${styles.text}`}>{children}</p>
    </div>
  )
}

function PanelCard({ title, color, description }: { title: string; color: string; description: string }) {
  const border = color === 'navy' ? 'border-brand-navy/20' : color === 'teal' ? 'border-brand-teal/30' : 'border-target-red/20'
  const heading = color === 'navy' ? 'text-brand-navy' : color === 'teal' ? 'text-brand-tealdk' : 'text-target-red'
  return (
    <div className={`rounded-xl border bg-white p-4 ${border}`}>
      <p className={`text-xs font-semibold mb-2 ${heading}`}>{title}</p>
      <p className="text-xs text-slate leading-relaxed">{description}</p>
    </div>
  )
}

function NodeTypeCard({ bg, border, label, description, example }: { bg: string; border: string; label: string; description: string; example: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded border-2"
          style={{ background: bg, borderColor: border, color: border }}
        >
          {label}
        </span>
      </div>
      <p className="text-xs text-slate leading-relaxed mb-1.5">{description}</p>
      <p className="text-[11px] text-slate-mid"><span className="font-medium">e.g.</span> {example}</p>
    </div>
  )
}

function EdgeRow({ color, dashed, animated, label, description }: { color: string; dashed: boolean; animated: boolean; label: string; description: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="w-16 flex-shrink-0 flex items-center">
        <svg width="60" height="12" viewBox="0 0 60 12">
          <line
            x1="2" y1="6" x2="52" y2="6"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={dashed ? '6 3' : undefined}
          >
            {animated && (
              <animate attributeName="stroke-dashoffset" values="18;0" dur="1s" repeatCount="indefinite" />
            )}
          </line>
          <polygon points="52,2 60,6 52,10" fill={color} />
        </svg>
      </div>
      <div>
        <span className="text-xs font-semibold text-brand-navy">{label}</span>
        <span className="text-xs text-slate ml-2">{description}</span>
      </div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-brand-navy text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </div>
      <div className="flex-1 pb-4 border-b border-slate-100 last:border-0">
        <p className="text-sm font-semibold text-brand-navy mb-1">{title}</p>
        <div className="text-xs text-slate leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function WalkthroughStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-5">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-brand-navy text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
          {n}
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-2" />
      </div>
      <div className="flex-1 pb-5">
        <p className="text-sm font-semibold text-brand-navy mb-1.5">{title}</p>
        <div className="text-sm text-slate leading-relaxed space-y-1.5">{children}</div>
      </div>
    </div>
  )
}
