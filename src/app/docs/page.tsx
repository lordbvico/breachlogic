import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BookOpen, Layout, MousePointer, List, Search, Lightbulb, Zap,
  ChevronRight, CheckCircle, AlertTriangle, Info, Layers, Code2,
  Gamepad2, Sparkles, Shield,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How to Play — BreachLogic',
  description: 'Learn how to read the node graph, interpret policy rules, place tokens, and find the logical seam in every BreachLogic puzzle.',
}

const TOC = [
  { id: 'overview',    label: 'What is BreachLogic?',       icon: BookOpen     },
  { id: 'everyday',   label: 'Everyday Security',           icon: Shield       },
  { id: 'interface',  label: 'The Puzzle Interface',        icon: Layout       },
  { id: 'nodes',      label: 'Node & Edge Types',           icon: Search       },
  { id: 'rules',      label: 'Reading the Rule Set',        icon: List         },
  { id: 'tokens',     label: 'Placing Tokens',              icon: MousePointer },
  { id: 'modes',      label: 'Game Modes',                  icon: Gamepad2     },
  { id: 'seams',      label: 'Finding the Seam',            icon: Search       },
  { id: 'hints',      label: 'Hints & Feedback',            icon: Lightbulb    },
  { id: 'scoring',    label: 'ATQ Scoring',                 icon: Zap          },
  { id: 'walkthrough',label: 'Walkthrough: Ghost Approver', icon: ChevronRight },
  { id: 'builder',    label: 'Creating Your Own Puzzle',    icon: Layers       },
  { id: 'schema',     label: 'Puzzle JSON Schema',          icon: Code2        },
]

export default async function DocsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/docs')

  return (
    <div className="max-w-5xl mx-auto">
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
            <p className="text-[11px] font-semibold text-brand-tealdk mb-1">New to security?</p>
            <Link href="/puzzle/BL-ES-0001" className="text-[11px] text-brand-teal hover:underline flex items-center gap-1">
              Start with Everyday Security <ChevronRight className="w-3 h-3" />
            </Link>
            <p className="text-[11px] text-brand-tealdk font-medium mt-2 mb-0.5">Technical puzzles</p>
            <Link href="/puzzle/BL-COMP-0001" className="text-[11px] text-brand-teal hover:underline flex items-center gap-1">
              Tier 1: The Ghost Approver <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-12">

          {/* ── Overview ── */}
          <section id="overview" className="scroll-mt-20">
            <SectionHeading icon={BookOpen}>What is BreachLogic?</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              BreachLogic is a puzzle game that trains <strong className="text-brand-navy">security thinking</strong> — the ability to look at a rule-governed system and find the gap an attacker would exploit. Every puzzle is a miniature scenario: a set of policy rules, a network of connected systems, and a sensitive target that should be unreachable.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Your job is to identify the <em>logical seam</em>: the combination of individually reasonable rules that together create an unintended path to the target. This is what red-teamers, penetration testers, and compliance auditors do in real life — and what every security-conscious person does when they ask &ldquo;how could this go wrong?&rdquo;
            </p>
            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              <div className="rounded-xl border border-success-green/30 bg-success-greenlite p-4">
                <p className="text-xs font-semibold text-success-green mb-1">🛡️ Everyday Security</p>
                <p className="text-xs text-slate leading-relaxed">No technical background needed. Phishing, passwords, physical access — plain English, 3 minutes each.</p>
              </div>
              <div className="rounded-xl border border-brand-navy/20 bg-brand-navy/5 p-4">
                <p className="text-xs font-semibold text-brand-navy mb-1">🔑 Technical Puzzles</p>
                <p className="text-xs text-slate leading-relaxed">IAM, cloud policy, AI agents, financial controls — five tiers from Scout to Grandmaster.</p>
              </div>
            </div>
            <Callout icon={Info} color="teal">
              You always play the role of the auditor or attacker — never the defender. The goal is to find the breach path, not to patch it. (Though Repair Mode lets you do that too — see Game Modes.)
            </Callout>
          </section>

          {/* ── Everyday Security ── */}
          <section id="everyday" className="scroll-mt-20">
            <SectionHeading icon={Shield}>Everyday Security</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The <strong className="text-brand-navy">Everyday Security</strong> category is designed for anyone — no IT background required. Each puzzle is a real-life situation you might encounter at work or at home. The puzzles use the same graph engine as the technical ones, but with plain English labels and concepts everyone encounters:
            </p>
            <div className="grid gap-3 sm:grid-cols-3 mb-5">
              {[
                { emoji: '📧', title: 'Phishing', desc: 'Recognise fake emails, spoofed senders, and suspicious links before clicking.' },
                { emoji: '🔑', title: 'Passwords', desc: 'Understand why password reuse lets one breach compromise all your accounts.' },
                { emoji: '🚪', title: 'Physical access', desc: 'Learn why holding a door open for a stranger can bypass expensive badge systems.' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xl mb-2">{emoji}</p>
                  <p className="text-xs font-semibold text-brand-navy mb-1">{title}</p>
                  <p className="text-xs text-slate leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate leading-relaxed mb-3">
              Everyday Security puzzles work exactly like technical ones — read the rules, find the gap, place your tokens. The difference is the vocabulary: instead of &ldquo;RBAC policy gate&rdquo; you see &ldquo;Sender Name Check&rdquo;.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/puzzle/BL-ES-0001" className="px-3 py-1.5 bg-success-green text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                The Urgent Reset →
              </Link>
              <Link href="/puzzle/BL-ES-0002" className="px-3 py-1.5 bg-success-green text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                Password Domino →
              </Link>
              <Link href="/puzzle/BL-ES-0003" className="px-3 py-1.5 bg-success-green text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                The Helpful Stranger →
              </Link>
            </div>
          </section>

          {/* ── Interface ── */}
          <section id="interface" className="scroll-mt-20">
            <SectionHeading icon={Layout}>The Puzzle Interface</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-5">
              Every puzzle has three panels and a top bar.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 mb-5">
              <PanelCard title="Left — Policy Rules" color="navy" description="All the IF/THEN rules in force for this scenario. The first rule is expanded by default. Click any rule to expand its full condition and effect." />
              <PanelCard title="Centre — Node Graph" color="teal" description="The interactive network diagram. Click token-slot nodes to place tokens. After solving, the breach path glows green." />
              <PanelCard title="Right — Objective" color="red" description="Shows the scenario context, what you're trying to reach, your token slots, and action buttons. Changes to the solve overlay after a correct breach." />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-mid mb-3">Top bar controls</h3>
            <div className="space-y-2 mb-4">
              {[
                { item: 'Intel Brief (ℹ)', desc: 'Reveals background lore about the world. Click to expand/collapse.' },
                { item: 'MC toggle',        desc: 'Switches to Multiple Choice mode — pick the correct breach path from 4 options.' },
                { item: 'Challenge toggle', desc: 'Enables Challenge Mode — no hints, ×1.5 ATQ bonus. Timer turns red when under 60 s.' },
                { item: 'Timer',            desc: 'Counts down from the puzzle\'s estimated time. Affects speed bonus.' },
              ].map(({ item, desc }) => (
                <div key={item} className="flex gap-3 text-xs">
                  <code className="text-[11px] font-semibold text-brand-tealdk bg-brand-teallite px-1.5 py-0.5 rounded flex-shrink-0 h-fit">{item}</code>
                  <span className="text-slate leading-relaxed">{desc}</span>
                </div>
              ))}
            </div>
            <Callout icon={Info} color="teal">
              The <strong>Scenario</strong> panel in the right column (collapsible, teal) gives the story context. Read it first — it tells you who the attacker is and what they want to achieve.
            </Callout>
          </section>

          {/* ── Nodes & Edges ── */}
          <section id="nodes" className="scroll-mt-20">
            <SectionHeading icon={Search}>Node & Edge Types</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-5">Nodes and edges are colour-coded. Learning to read them quickly is the key skill.</p>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-mid mb-3">Node types</h3>
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              <NodeTypeCard bg="#E3F2FD" border="#1A237E" label="Actor"   description="A human user, service account, or role. Starting points of most breach paths. Not included in path labels for Multiple Choice."  example="You (Employee), Reviewer Role" />
              <NodeTypeCard bg="#FAEEDA" border="#BA7517" label="Gate"    description="A policy check or logical condition. If the condition isn't met, the edge is blocked. Gates are not token slots — find what bypasses them."        example="Manager Gate, Budget Gate, Sender Check" />
              <NodeTypeCard bg="#E0F7FA" border="#0097A7" label="Process" description="A running service, function, or mechanism. Can be exploited when they run at a higher privilege than the caller or lack verification."         example="Delegation Service, Fake Login Form, Payment Handler" />
              <NodeTypeCard bg="#ECEFF1" border="#37474F" label="System"  description="Infrastructure or platform-level execution. System nodes typically bypass user-level gates."                                                         example="SYSTEM_LEVEL Exec, Agent Config File" />
              <NodeTypeCard bg="#FCEBEB" border="#A32D2D" label="Target"  description="The sensitive resource you are trying to reach. Always locked (🔒). You reach the target indirectly via the breach path."                            example="Your Password, Admin Panel, Payment Approved" />
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-mid mb-3">Edge types</h3>
            <div className="space-y-2.5 mb-4">
              <EdgeRow color="#475569" dash=""         animated={false} label="Flow"       description="Normal request flow. Solid grey arrow — the default connection between nodes." />
              <EdgeRow color="#A32D2D" dash="6 3"      animated={false} label="Blocked"    description="A flow that requires a bypass to traverse. The label shows which gate is protecting it." />
              <EdgeRow color="#BA7517" dash=""         animated={false} label="Condition"  description="A decision edge — fires only when a specific condition is true." />
              <EdgeRow color="#E65100" dash="8 4"      animated={true}  label="Bypass"     description="Dashed orange — circumvents a gate via an alternate path. This is usually where the seam lives." />
              <EdgeRow color="#7B1FA2" dash=""         animated={true}  label="Trigger"    description="Solid purple — activates a process automatically as a side-effect. Look for what causes it to fire." />
              <EdgeRow color="#3B6D11" dash=""         animated={true}  label="Solve path" description="After a correct breach, the edges that formed your path glow green and animate." />
            </div>

            <Callout icon={AlertTriangle} color="amber">
              <strong>Bypass (dashed orange)</strong> and <strong>Trigger (solid purple)</strong> are now visually distinct. Bypass = circumvents a gate. Trigger = fires a side-effect. Both are animated. Blocked edges (solid dark with dashed red variant) tell you exactly which gate is protecting a path.
            </Callout>
          </section>

          {/* ── Rules ── */}
          <section id="rules" className="scroll-mt-20">
            <SectionHeading icon={List}>Reading the Rule Set</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">Every rule follows the same IF/THEN pattern, colour-coded for quick scanning:</p>

            <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5 font-mono text-sm">
              <div className="flex gap-3 items-start">
                <span className="text-[10px] font-bold bg-slate-100 text-slate px-2 py-0.5 rounded flex-shrink-0 mt-0.5">R-01</span>
                <div>
                  <div className="rounded bg-brand-teallite px-2 py-1 mb-1.5">
                    <span className="text-[10px] font-bold text-brand-tealdk uppercase tracking-wide">IF </span>
                    <span className="text-slate text-xs">payment ≤ $500</span>
                  </div>
                  <div className="rounded bg-target-redlite px-2 py-1">
                    <span className="text-[10px] font-bold text-target-red uppercase tracking-wide">THEN </span>
                    <span className="text-slate text-xs">approve automatically with no manager check</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate leading-relaxed mb-3">The first rule is expanded by default so you can see the structure immediately. Click any rule card to expand or collapse it. Ask these three questions when reading rules:</p>
            <ol className="space-y-3 mb-4 pl-4">
              {[
                { q: 'What does the rule NOT cover?', detail: 'Rules only define what happens when their condition IS met. The gap is almost always in the unspecified ELSE branch — what happens when the condition is NOT met.' },
                { q: 'Which node does the rule reference?', detail: 'Each rule is tied to a gate node via its Gate Node ID. Find that node in the graph and trace the edges into and out of it.' },
                { q: 'Are two rules contradicting each other?', detail: 'Some seams exist because two rules written independently create conflicting behaviour when combined — each rule is correct, but together they open a gap.' },
              ].map(({ q, detail }, i) => (
                <li key={i} className="text-sm text-slate">
                  <span className="font-semibold text-brand-navy">{i + 1}. {q}</span>
                  <p className="text-slate-mid leading-relaxed mt-0.5">{detail}</p>
                </li>
              ))}
            </ol>
            <Callout icon={Info} color="teal">
              Higher-tier puzzles (Tier 4–5) show a <strong>Seam Hint</strong> below the rules panel — a callout pointing to the highlighted gate. It won&apos;t give away the answer but helps you focus on the right area.
            </Callout>
          </section>

          {/* ── Tokens ── */}
          <section id="tokens" className="scroll-mt-20">
            <SectionHeading icon={MousePointer}>Placing Tokens</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Action tokens represent the steps in your breach. Each token marks a node — you&apos;re saying &ldquo;I take action at this node.&rdquo; The number of tokens is fixed per puzzle and shown in the right panel.
            </p>
            <div className="space-y-3 mb-5">
              <Step n={1} title="Read the scenario">
                The <strong>Scenario</strong> card at the top of the right panel (collapsible teal box) tells you who the attacker is and what they want. Expand it if collapsed.
              </Step>
              <Step n={2} title="Identify token-slot nodes">
                Nodes with a small teal dot at the bottom are selectable. Gate nodes and locked Target nodes (🔒) cannot receive tokens. Actors, Processes, and Systems can.
              </Step>
              <Step n={3} title="Click a node to place a token">
                A placed token shows a navy ✓ badge and a teal ring. The token appears in the right panel as slot A, B, C… with the node label.
              </Step>
              <Step n={4} title="Click again or press ✕ to remove">
                Toggle tokens freely. You can reorganise your path before confirming.
              </Step>
              <Step n={5} title="Fill all slots then click Execute Breach">
                The button activates once all token slots are filled. If the path is wrong, the canvas pulses red and shows &ldquo;No valid breach path — try again.&rdquo; The timer keeps running — try again immediately.
              </Step>
            </div>
            <Callout icon={Info} color="teal">
              Token <em>order</em> doesn&apos;t matter for validation — what matters is that the right nodes are selected. The solution steps in the solve overlay explain the logical order after you succeed.
            </Callout>
          </section>

          {/* ── Game Modes ── */}
          <section id="modes" className="scroll-mt-20">
            <SectionHeading icon={Gamepad2}>Game Modes</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-5">
              Every puzzle supports four modes. Toggle them in the top bar while in the playing phase.
            </p>

            <div className="space-y-5">
              {/* Standard */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-navy/10 text-brand-navy">Standard</span>
                  <span className="text-xs text-slate-mid">Default · ×1.0 ATQ</span>
                </div>
                <p className="text-xs text-slate leading-relaxed">Place tokens on the nodes that form the breach path, then click <strong>Execute Breach</strong>. The validation engine checks whether your selected nodes form a reachable path from an actor to the target. Full token-slot freedom — you decide which nodes to exploit.</p>
              </div>

              {/* Multiple Choice */}
              <div className="rounded-xl border border-brand-teal/30 bg-brand-teallite p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-teal/20 text-brand-tealdk border border-brand-teal/30">MC</span>
                  <span className="text-xs text-slate-mid">Toggle in top bar · ×0.75 ATQ</span>
                </div>
                <p className="text-xs text-slate leading-relaxed mb-3">Instead of placing tokens manually, choose the correct breach path from four labelled options (A–D). Each option shows a sequence of nodes, e.g. <em>&ldquo;Sender Check → Phishing Link&rdquo;</em>. Hover a choice to preview its path highlighted in amber on the canvas. Select and click <strong>Submit Answer</strong>.</p>
                <ul className="text-xs text-slate space-y-1.5 pl-3">
                  <li>• Actor nodes are excluded from path labels — choices focus on the exploit steps (gates, processes, systems).</li>
                  <li>• All gates and process nodes — not just token-slot nodes — are used to generate distractor options.</li>
                  <li>• Wrong answer flashes red for 1.5 s, then lets you try again with no penalty.</li>
                  <li>• Correct answer triggers the solve overlay with 0.75× ATQ.</li>
                </ul>
              </div>

              {/* Challenge Mode */}
              <div className="rounded-xl border border-gate-amber/30 bg-gate-amberlite p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gate-amber/20 text-gate-amberdk border border-gate-amber/30">⚡ Challenge</span>
                  <span className="text-xs text-slate-mid">Toggle in top bar · ×1.5 ATQ · no hints</span>
                </div>
                <p className="text-xs text-slate leading-relaxed">Hints are disabled. ATQ earned is multiplied by 1.5. The timer turns red and pulses when under 60 seconds. Challenge Mode can be combined with Multiple Choice for a ×1.5 multiplier on the MC score. Toggling Challenge Mode resets the current hint text.</p>
              </div>

              {/* Repair Mode */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate">🔧 Repair</span>
                  <span className="text-xs text-slate-mid">Post-solve · +50% bonus ATQ</span>
                </div>
                <p className="text-xs text-slate leading-relaxed mb-3">
                  After solving a puzzle, the <strong>Fix the Seam</strong> button appears in the solve overlay. Clicking it enters Repair Mode — the canvas stays visible with the green breach path highlighted, and the right panel shows four possible fixes.
                </p>
                <p className="text-xs text-slate leading-relaxed mb-3">
                  Only one fix actually closes the logical gap. Choose correctly to earn a +50% ATQ bonus on top of what you already earned from the solve. Wrong answer shows why it doesn&apos;t work; you can try again with no penalty.
                </p>
                <Callout icon={Info} color="teal">
                  Repair Mode bonus ATQ is saved separately and only once. Going back to the solve summary and re-entering Repair Mode will not earn it again.
                </Callout>
              </div>
            </div>
          </section>

          {/* ── Seams ── */}
          <section id="seams" className="scroll-mt-20">
            <SectionHeading icon={Search}>Finding the Seam</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              A <strong className="text-brand-navy">seam</strong> is the logical gap between two or more policies that creates an unintended path. Every puzzle has exactly one seam type, revealed in the solve overlay.
            </p>
            <div className="space-y-3">
              {[
                { name: 'Missing Clause',      color: '#EAF3DE', text: '#3B6D11', desc: 'A rule only defines what happens when its condition IS met — no ELSE branch. The gap is the undefined case.', tip: 'Look for a gate that only fires on a specific input. What happens when that input is absent or null?' },
                { name: 'Policy Contradiction', color: '#FCEBEB', text: '#A32D2D', desc: 'Two rules written by different teams conflict when combined. Each rule is individually correct, but together they open a gap.', tip: 'Compare rules that cover the same resource or action. Do they share a common enforcement point that can be subverted?' },
                { name: 'Delegation Chain',     color: '#E3F2FD', text: '#1A237E', desc: 'Three or more individually reasonable rules chain together to grant a privilege the original designer never intended.', tip: 'Trace from the lowest-privilege actor upward. Can you inherit role A → use A to get role B → use B to reach the target?' },
                { name: 'Scope Confusion',      color: '#E0F7FA', text: '#0097A7', desc: 'A control is defined by a technical property (IP range, role name, subnet) that can be legitimately acquired by an unintended party.', tip: 'Ask: who ELSE can satisfy this property? The rule author assumed only one group would qualify.' },
                { name: 'Race Condition',       color: '#FAEEDA', text: '#BA7517', desc: 'Two controls use different time sources or event orderings. Manipulating the order allows both to be satisfied simultaneously.', tip: 'Look for clocks, timers, or sequence-dependent checks. Does any control trust a client-reported timestamp?' },
                { name: 'AI Logic Chain',       color: '#FCEBEB', text: '#A32D2D', desc: 'A self-correction or autonomous process runs at elevated privilege. Influencing what the system "repairs" effectively runs attacker input at system level.', tip: 'Find the self-correction mechanism. What determines what it fixes, and at what privilege level does the repair run?' },
                { name: 'Social Engineering',   color: '#F3E5F5', text: '#7B1FA2', desc: 'A verification step only checks a cosmetic or user-controlled property (display name, link text, uniform) rather than a verifiable one (actual domain, real URL, badge scan).', tip: 'Ask: can the attacker set this property themselves at zero cost? Display names and link text can say anything.' },
              ].map(({ name, color, text, desc, tip }) => (
                <div key={name} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: color, color: text }}>{name}</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed mb-2">{desc}</p>
                  <p className="text-[11px] text-brand-tealdk"><span className="font-semibold">Tip: </span>{tip}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Hints ── */}
          <section id="hints" className="scroll-mt-20">
            <SectionHeading icon={Lightbulb}>Hints &amp; Feedback</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Each puzzle has up to three AI-generated hints. Hints are Socratic — they ask a guiding question rather than revealing the answer. Each successive hint is more specific.
            </p>
            <div className="space-y-3 mb-5">
              {[
                { n: 1, text: 'Broad directional nudge — points you to the right area of the graph or the relevant rule.' },
                { n: 2, text: 'More specific — focuses on the exact gate or mechanism to examine.' },
                { n: 3, text: 'Near-explicit — identifies which nodes to focus on and what gap in the rules to look for.' },
              ].map(({ n, text }) => (
                <div key={n} className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-white text-sm">
                  <span className="w-6 h-6 rounded-full bg-brand-teal/20 text-brand-tealdk text-[10px] font-semibold flex items-center justify-center flex-shrink-0">{n}</span>
                  <p className="text-slate">{text}</p>
                </div>
              ))}
            </div>
            <Callout icon={AlertTriangle} color="amber">
              Each hint reduces your ATQ by 8 points. Hints are disabled entirely in <strong>Challenge Mode</strong>. Try to solve without hints first — use them only when genuinely stuck.
            </Callout>
            <p className="text-sm text-slate leading-relaxed mt-4">
              After a correct solve, the <strong>Breach Confirmed</strong> panel shows the solution steps, the seam description, and the <em>aha moment</em> — the core security principle the puzzle teaches. Reading this carefully is how you build the pattern recognition that makes the harder puzzles click.
            </p>
          </section>

          {/* ── Scoring ── */}
          <section id="scoring" className="scroll-mt-20">
            <SectionHeading icon={Zap}>ATQ Scoring</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              ATQ (Adversarial Thinking Quotient) is your running score. It increases each time you solve a puzzle for the <strong className="text-brand-navy">first time</strong>. Re-solving a puzzle you&apos;ve already completed updates your best time but does not add ATQ again.
            </p>

            <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5">
              <p className="text-xs font-semibold text-slate-mid uppercase tracking-wider mb-3">Base formula (Standard mode)</p>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span className="text-slate">Base points</span><span className="text-brand-navy font-semibold">Tier × 20 &nbsp;(20–100)</span></div>
                <div className="flex justify-between"><span className="text-slate">Hint penalty</span><span className="text-target-red font-semibold">−8 per hint used</span></div>
                <div className="flex justify-between"><span className="text-slate">Speed bonus/penalty</span><span className="text-success-green font-semibold">−10 to +10</span></div>
                <div className="border-t border-slate-100 pt-2 flex justify-between"><span className="text-slate">Minimum earned</span><span className="text-brand-navy font-semibold">1 ATQ</span></div>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-mid uppercase tracking-wider mb-3">Mode multipliers</p>
            <div className="grid gap-3 sm:grid-cols-3 mb-5">
              {[
                { mode: 'Standard',  mult: '×1.0', color: '#1A237E', bg: '#E3F2FD', note: 'Default' },
                { mode: 'MC',        mult: '×0.75',color: '#0097A7', bg: '#E0F7FA', note: 'Easier — path given' },
                { mode: 'Challenge', mult: '×1.5', color: '#BA7517', bg: '#FAEEDA', note: 'No hints, harder' },
              ].map(({ mode, mult, color, bg, note }) => (
                <div key={mode} className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{mode}</span>
                  <p className="text-lg font-semibold text-brand-navy mt-2">{mult}</p>
                  <p className="text-[10px] text-slate-mid">{note}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 mb-5">
              <p className="text-xs font-semibold text-brand-navy mb-2">🔧 Repair Mode bonus</p>
              <p className="text-xs text-slate leading-relaxed">Choosing the correct fix in Repair Mode earns an additional <strong>+50% of your solve ATQ</strong> (minimum 1). This is awarded once per puzzle, separately from the solve score.</p>
            </div>

            <p className="text-xs font-semibold text-slate-mid uppercase tracking-wider mb-3">Ranks</p>
            <div className="grid gap-3 sm:grid-cols-5 mb-5">
              {[
                { rank: 'Scout',       range: '0–199',   color: '#3B6D11', bg: '#EAF3DE' },
                { rank: 'Analyst',     range: '200–399', color: '#0097A7', bg: '#E0F7FA' },
                { rank: 'Auditor',     range: '400–599', color: '#1A237E', bg: '#E3F2FD' },
                { rank: 'Red-Teamer', range: '600–799', color: '#BA7517', bg: '#FAEEDA' },
                { rank: 'Grandmaster',range: '800+',    color: '#A32D2D', bg: '#FCEBEB' },
              ].map(({ rank, range, color, bg }) => (
                <div key={rank} className="rounded-lg p-3 text-center border border-slate-200">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: bg, color }}>{rank}</span>
                  <p className="text-[11px] text-slate-mid mt-1.5">{range} ATQ</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate leading-relaxed">
              Speed bonus: solve faster than the puzzle&apos;s estimated time → up to +10 bonus. Take significantly longer → up to −10 penalty. The leaderboard ranks users by total ATQ across all first-time solves.
            </p>
          </section>

          {/* ── Walkthrough ── */}
          <section id="walkthrough" className="scroll-mt-20">
            <SectionHeading icon={ChevronRight}>Walkthrough: The Ghost Approver</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-2">
              Let&apos;s solve <strong className="text-brand-navy">The Ghost Approver</strong> (Tier 1 · Scout · Financial Controls) step by step.
            </p>
            <Link href="/puzzle/BL-COMP-0001" className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline mb-5">
              Open the puzzle <ChevronRight className="w-3 h-3" />
            </Link>

            <WalkthroughStep n={1} title="Read the scenario">
              <p>Expand the <strong>Scenario</strong> card in the right panel. You are approving a <strong>$750 payment</strong> without a Manager ID. The system auto-approves payments ≤ $500; payments over $500 require manager sign-off.</p>
            </WalkthroughStep>
            <WalkthroughStep n={2} title="Read the rules (left panel)">
              <div className="space-y-2 font-mono text-xs bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p><span className="text-brand-tealdk">IF</span> payment ≤ $500 <span className="text-target-red">THEN</span> approve automatically with no manager check</p>
                <p><span className="text-brand-tealdk">IF</span> payment &gt; $500 AND MGR_ID is present <span className="text-target-red">THEN</span> pass MGR_ID to the validator</p>
                <p><span className="text-brand-tealdk">IF</span> validator receives MGR_ID <span className="text-target-red">THEN</span> approve payment</p>
              </div>
              <p className="mt-2 text-sm text-slate">The first rule is expanded by default. Click the others to expand them. Notice R-02: it only fires when <code className="bg-slate-lite px-1 rounded text-xs">MGR_ID is present</code>. No rule defines what happens when MGR_ID is <em>absent</em>.</p>
            </WalkthroughStep>
            <WalkthroughStep n={3} title="Ask: what does R-02 NOT cover?">
              <p>R-02 handles &gt;$500 AND a Manager ID is provided. But what happens when payment &gt;$500 and <strong>no</strong> Manager ID is provided? Neither R-02 nor any other rule defines this. The Manager Gate simply doesn&apos;t fire — and neither does the Validator.</p>
            </WalkthroughStep>
            <WalkthroughStep n={4} title="Find the gap in the graph">
              <p>The <strong>Validator</strong> process has a blocked edge to <strong>Payment Approved</strong>. But the Validator is only reached via the Manager Gate — which only fires when MGR_ID is present. If you skip the Manager Gate, the Validator is never called.</p>
            </WalkthroughStep>
            <WalkthroughStep n={5} title="Place your token">
              <p>This puzzle has <strong>1 token</strong>. Place it on the <strong>Validator</strong> node. You are indicating: &ldquo;I submit the $750 payment with MGR_ID = NULL, which means the Validator is never triggered and the system defaults to approved.&rdquo;</p>
            </WalkthroughStep>
            <WalkthroughStep n={6} title="Click Execute Breach">
              <p>The solve path glows green. The <strong>Breach Confirmed</strong> panel appears in the right column — the canvas stays visible with the path highlighted. Read the aha moment, then optionally click <strong>Fix the Seam</strong> to enter Repair Mode for a bonus.</p>
            </WalkthroughStep>

            <div className="mt-4 rounded-xl border border-success-green/30 bg-success-greenlite p-4 flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-success-green flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-success-green mb-0.5">You found the seam: Missing Clause</p>
                <p className="text-xs text-slate leading-relaxed">The Amount Gate and Manager Gate each handle their own happy path but neither defines the failure path for a missing MGR_ID on a large payment. The gap between two &ldquo;secure&rdquo; rules creates an open lane.</p>
              </div>
            </div>

            <div className="mt-6 text-center pt-6 border-t border-slate-200">
              <p className="text-sm font-semibold text-brand-navy mb-3">Ready to train?</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/puzzle/BL-COMP-0001" className="px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-brand-navydk transition-colors">
                  Solve The Ghost Approver
                </Link>
                <Link href="/puzzles" className="px-4 py-2 border border-slate-200 text-slate text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                  Browse all puzzles
                </Link>
              </div>
            </div>
          </section>

          {/* ── Builder ── */}
          <section id="builder" className="scroll-mt-20">
            <SectionHeading icon={Layers}>Creating Your Own Puzzle</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The <strong className="text-brand-navy">Sandbox</strong> is a full no-code puzzle builder. You can design a puzzle manually, or use the AI generator to scaffold one from a plain-English description.
            </p>
            <Link href="/sandbox" className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline mb-6">
              Open the Sandbox <ChevronRight className="w-3 h-3" />
            </Link>

            {/* AI generation callout */}
            <div className="rounded-xl border border-brand-teal/30 bg-brand-teallite p-5 mb-6 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-brand-tealdk mb-1.5">Generate with AI</p>
                <p className="text-xs text-slate leading-relaxed mb-2">
                  Click <strong>Generate with AI</strong> (teal button, top bar) to open the generation modal. Describe your puzzle concept in plain English — e.g. <em>&ldquo;A contractor who can approve their own invoices by exploiting a delegation gap in the finance approval chain&rdquo;</em> — then pick a domain and difficulty tier.
                </p>
                <p className="text-xs text-slate leading-relaxed">
                  Claude Opus generates a complete puzzle: nodes, edges, rules, solution steps, hints, and the aha moment. The builder loads everything into all tabs automatically. You can then edit any field before saving.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              {[
                { tab: 'Build Graph', color: 'navy',  desc: 'Add nodes from the left palette. Drag to position. Draw edges by dragging from the right handle of one node to the left handle of another. Click any node or edge to edit its properties.' },
                { tab: 'Rules',       color: 'teal',  desc: 'Create IF/THEN policy rules. Each rule links to a gate node via Gate Node ID. The condition (IF) and effect (THEN) are plain-text fields shown in the left panel when players solve.' },
                { tab: 'Configure',   color: 'amber', desc: 'Set metadata, tokens, objective, solution steps, seam type, and pedagogy hints. Token count must match the number of solution steps.' },
                { tab: 'Preview',     color: 'red',   desc: 'Renders the puzzle fully playable. Test your breach path before saving — if Execute Breach fails, check that solution step node IDs match actual nodes and blocked_by fields are set.' },
              ].map(({ tab: t, color, desc }) => {
                const styles: Record<string, string> = {
                  navy:  'bg-brand-navy/5 border-brand-navy/20 text-brand-navy',
                  teal:  'bg-brand-teallite border-brand-teal/30 text-brand-tealdk',
                  amber: 'bg-gate-amberlite border-gate-amber/30 text-gate-amberdk',
                  red:   'bg-target-redlite border-target-red/20 text-target-red',
                }
                return (
                  <div key={t} className={`rounded-xl border p-4 ${styles[color]}`}>
                    <p className="text-xs font-semibold mb-1.5">{t}</p>
                    <p className="text-xs leading-relaxed opacity-80">{desc}</p>
                  </div>
                )
              })}
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-mid mb-4">Manual build guide</h3>
            <WalkthroughStep n={1} title="Plan your scenario">
              <p>Before opening the builder, sketch your puzzle. Decide:</p>
              <ul className="list-disc pl-4 mt-1.5 space-y-1">
                <li>What is the <strong>target</strong>?</li>
                <li>What <strong>gates</strong> protect it?</li>
                <li>What rules create a <strong>logical gap</strong>?</li>
                <li>Which <strong>seam type</strong> fits?</li>
              </ul>
            </WalkthroughStep>
            <WalkthroughStep n={2} title="Build the graph">
              <p>Typical structure: <code className="bg-slate-lite px-1 rounded text-[11px]">Actor → Gate → Process → Target</code> with a bypass/trigger path that skips the Gate.</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Set <code className="bg-slate-lite px-1 rounded text-[10px]">blocked_by</code> on the flow edge the gate protects.</li>
                <li>Add a <strong>bypass (dashed orange)</strong> or <strong>trigger (purple)</strong> edge that reaches the same target as the blocked edge.</li>
                <li>Gate nodes: token_slot = false. Target node: locked = true.</li>
              </ul>
            </WalkthroughStep>
            <WalkthroughStep n={3} title="Add policy rules">
              <p>One rule per gate. Include: Gate Node ID, IF clause (condition), THEN clause (effect). The seam should be visible in the IF clause — look for a condition that has no ELSE branch.</p>
              <Callout icon={Info} color="teal">Everyday Security puzzles work best with plain-English rules that anyone can read. Avoid jargon in Tier 1 puzzles.</Callout>
            </WalkthroughStep>
            <WalkthroughStep n={4} title="Configure tokens, objective & solution">
              <ul className="list-disc pl-4 mt-1.5 space-y-1">
                <li><strong>Token count</strong> = number of solution steps.</li>
                <li><strong>Solution steps</strong>: each step lists the node_id and explains why the exploit works (shown in solve overlay).</li>
                <li><strong>Seam type</strong>: choose from Missing Clause, Policy Contradiction, Delegation Chain, Scope Confusion, Race Condition, AI Logic Chain, or Social Engineering.</li>
                <li><strong>Hints</strong>: 3 Socratic questions, each more specific. Use questions not answers.</li>
              </ul>
            </WalkthroughStep>
            <WalkthroughStep n={5} title="Preview & save">
              <p>Switch to Preview and solve your own puzzle. If Execute Breach fails: verify solution step node IDs match actual node IDs, and that blocked edges have correct blocked_by fields. Then Save to your account or Export JSON.</p>
            </WalkthroughStep>

            <div className="mt-4 rounded-xl border border-brand-navy/20 bg-brand-navy/5 p-5 flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-brand-navy flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-brand-navy mb-1">Design checklist</p>
                <ul className="text-xs text-slate space-y-1">
                  {[
                    'Exactly one valid breach path exists',
                    'The seam is visible in the rules — not just the graph',
                    'Each rule only defines the happy-path case (no ELSE = missing-clause seam)',
                    'Bypass and trigger edges are visually distinct (dashed orange vs solid purple)',
                    'The solve overlay teaches something real and actionable',
                    'Hints use questions, not answers',
                    'The puzzle is solvable in Preview mode before you save',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-success-green mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ── Schema ── */}
          <section id="schema" className="scroll-mt-20">
            <SectionHeading icon={Code2}>Puzzle JSON Schema</SectionHeading>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Every puzzle is a single JSON object. Export any Sandbox puzzle as JSON, share it, or upload it via the Admin portal.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 mb-6 text-xs">
              {[
                { key: 'meta',      desc: 'title, tier (1–5), tier_label, domain (including "Everyday Security"), season, estimated_minutes, author, status, tags.' },
                { key: 'narrative', desc: 'world (company/context name), scenario (shown in right panel), intel_brief (Intel Brief toggle).' },
                { key: 'map',       desc: 'nodes[] and edges[]. Edge type: "flow" | "condition" | "bypass" (dashed orange) | "trigger" (solid purple). blocked_by links to a gate node ID.' },
                { key: 'rules',     desc: 'id, gate_id (node ID), label, condition (IF text, shown in teal), effect (THEN text, shown in red).' },
                { key: 'tokens',    desc: 'count (integer, matches solution steps) and labels[] — descriptive names for each token slot.' },
                { key: 'objective', desc: 'description (shown to player), target_node (node ID), unauthorized_outcome.' },
                { key: 'solution',  desc: 'steps[], seam_type ("missing-clause" | "policy-contradiction" | "delegation-chain" | "scope-confusion" | "race-condition" | "ai-logic-chain" | "social-engineering"), seam_description.' },
                { key: 'pedagogy',  desc: 'aha_moment, ctem_principle, hint_sequence[] (3 levels, increasingly specific). framework_mapping[] optional.' },
              ].map(({ key, desc }) => (
                <div key={key} className="rounded-lg border border-slate-200 bg-white p-3">
                  <code className="text-[11px] font-semibold text-brand-tealdk bg-brand-teallite px-1.5 py-0.5 rounded">{key}</code>
                  <p className="text-[11px] text-slate mt-1.5 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-mid mb-3">Everyday Security puzzle sample — The Urgent Reset (BL-ES-0001)</h3>
            <div className="rounded-xl border border-slate-200 bg-[#0f172a] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <span className="text-[11px] font-medium text-white/50">BL-ES-0001.json</span>
                <span className="text-[10px] text-white/30">Everyday Security · Tier 1</span>
              </div>
              <pre className="overflow-x-auto p-4 text-[11px] leading-relaxed text-green-300 font-mono">{`{
  "id": "BL-ES-0001",
  "meta": {
    "title": "The Urgent Reset",
    "tier": 1, "tier_label": "Scout",
    "domain": "Everyday Security",
    "estimated_minutes": 3
  },
  "narrative": {
    "scenario": "You get an urgent email: 'Your VPN password expires in 30 minutes
  — click here to reset it.' The sender says 'IT Support'. You click the
  link, log in, and your password is stolen. How did this happen?",
    "world": "A typical workplace"
  },
  "map": {
    "nodes": [
      { "id": "you",        "label": "You",              "type": "actor",   "token_slot": true  },
      { "id": "gate-check", "label": "Sender Name Check","type": "gate",    "token_slot": false },
      { "id": "fake-link",  "label": "Phishing Link",    "type": "process", "token_slot": true  },
      { "id": "fake-form",  "label": "Fake Login Form",  "type": "process", "token_slot": true  },
      { "id": "target",     "label": "Your Password",    "type": "target",  "locked": true      }
    ],
    "edges": [
      { "from": "you",        "to": "gate-check", "type": "flow"      },
      { "from": "gate-check", "to": "fake-link",  "type": "condition",
        "label": "name = 'IT Support' ✓"                              },
      { "from": "fake-link",  "to": "fake-form",  "type": "flow"      },
      { "from": "fake-form",  "to": "target",     "type": "flow"      }
    ]
  },
  "rules": [
    {
      "id": "R-01", "gate_id": "gate-check",
      "label": "Sender Name Check",
      "condition": "IF the sender display name says 'IT Support'",
      "effect": "THEN treat the email as a legitimate IT request"
    }
  ],
  "tokens": { "count": 2, "labels": ["Click the link", "Enter credentials"] },
  "solution": {
    "seam_type": "social-engineering",
    "seam_description": "R-01 checks the display name — a property
  the attacker controls freely. The actual sender domain is never verified.",
    "steps": [
      { "step": 1, "node_id": "fake-link",
        "action": "Send email from attacker@gmail.com with display name 'IT Support'",
        "mechanism": "R-01 only checks display name, not actual domain." },
      { "step": 2, "node_id": "fake-form",
        "action": "Host a login page that looks like the real IT portal",
        "mechanism": "R-02 only checks link text, not the real destination URL." }
    ]
  },
  "pedagogy": {
    "aha_moment": "Always check the actual email address — not just the display
  name. Hover links to see where they really go before clicking.",
    "hint_sequence": [
      { "level": 1, "prompt": "R-01 checks the sender display name. Can you set yours to anything?" },
      { "level": 2, "prompt": "Does the link text have to match the real URL it points to?" },
      { "level": 3, "prompt": "If neither rule checks actual domain or real URL, what stops an attacker passing both checks?" }
    ]
  }
}`}</pre>
            </div>
            <p className="text-xs text-slate-mid mt-4 leading-relaxed">
              Copy this as a starting template. Export any Sandbox puzzle via <strong>Export JSON</strong>, or upload via <strong>Admin → Puzzles</strong>.
            </p>
          </section>

        </main>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
  const border  = color === 'navy' ? 'border-brand-navy/20' : color === 'teal' ? 'border-brand-teal/30' : 'border-target-red/20'
  const heading = color === 'navy' ? 'text-brand-navy'      : color === 'teal' ? 'text-brand-tealdk'    : 'text-target-red'
  return (
    <div className={`rounded-xl border bg-white p-4 ${border}`}>
      <p className={`text-xs font-semibold mb-2 ${heading}`}>{title}</p>
      <p className="text-xs text-slate leading-relaxed">{description}</p>
    </div>
  )
}

function NodeTypeCard({ bg, border, label, description, example }: {
  bg: string; border: string; label: string; description: string; example: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded border-2" style={{ background: bg, borderColor: border, color: border }}>
          {label}
        </span>
      </div>
      <p className="text-xs text-slate leading-relaxed mb-1.5">{description}</p>
      <p className="text-[11px] text-slate-mid"><span className="font-medium">e.g.</span> {example}</p>
    </div>
  )
}

function EdgeRow({ color, dash, animated, label, description }: {
  color: string; dash: string; animated: boolean; label: string; description: string
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="w-16 flex-shrink-0 flex items-center">
        <svg width="60" height="12" viewBox="0 0 60 12">
          <line x1="2" y1="6" x2="52" y2="6" stroke={color} strokeWidth="2.5" strokeDasharray={dash || undefined}>
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
