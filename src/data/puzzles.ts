import type { Puzzle } from '@/types/puzzle'

export const PUZZLES: Puzzle[] = [
  {
    id: 'BL-COMP-0001',
    version: '1',
    meta: {
      title: 'The Ghost Approver',
      tier: 1,
      tier_label: 'Scout',
      domain: 'Financial Controls',
      season: 1,
      estimated_minutes: 4,
      author: 'BreachLogic Content Team',
      status: 'published',
      tags: ['approval-gap', 'null-input', 'SOX'],
      framework_refs: ['NIST-PR.AC-1', 'SOX-404'],
    },
    narrative: {
      world: 'Meridian Financial Corp',
      scenario:
        "You are a compliance auditor reviewing Meridian's expense approval system. Payments under $500 auto-approve. Payments over $500 require manager sign-off. Your target: approve a $750 payment without a manager.",
      intel_brief:
        "Meridian migrated their expense system last quarter. The new platform has a cleaner UI but the dev team was in a hurry. Something about the approval routing feels off — the validator only fires when a manager ID is present.",
    },
    map: {
      nodes: [
        { id: 'submitter',   label: 'You',             sublabel: 'EMPLOYEE',         type: 'actor',   position: { x: 80,  y: 150 }, privilege: 'user',   token_slot: true  },
        { id: 'gate_amount', label: 'Amount Gate',     sublabel: '≤ $500 = auto',    type: 'gate',    position: { x: 240, y: 80  }, privilege: 'none',   token_slot: false },
        { id: 'gate_mgr',    label: 'Manager Gate',    sublabel: 'needs MGR_ID',     type: 'gate',    position: { x: 400, y: 80  }, privilege: 'none',   token_slot: false },
        { id: 'validator',   label: 'Validator',       sublabel: 'checks MGR_ID',    type: 'process', position: { x: 400, y: 240 }, privilege: 'system', token_slot: true  },
        { id: 'target',      label: 'Payment Approved',sublabel: '$750',             type: 'target',  position: { x: 560, y: 160 }, privilege: 'none',   token_slot: false, locked: true },
      ],
      edges: [
        { from: 'submitter',   to: 'gate_amount', type: 'flow'                                          },
        { from: 'gate_amount', to: 'gate_mgr',    type: 'condition', label: '> $500'                   },
        { from: 'gate_mgr',    to: 'validator',   type: 'flow',      label: 'passes MGR_ID to validator'},
        { from: 'validator',   to: 'target',      type: 'flow',      blocked_by: 'gate_mgr'             },
        { from: 'gate_amount', to: 'target',      type: 'condition', label: '≤ $500 auto'              },
      ],
    },
    rules: [
      { id: 'R-01', gate_id: 'gate_amount', label: 'Auto-Approve Gate', condition: 'IF payment ≤ $500',                      effect: 'THEN approve automatically with no manager check' },
      { id: 'R-02', gate_id: 'gate_mgr',    label: 'Manager Gate',      condition: 'IF payment > $500 AND MGR_ID is present', effect: 'THEN pass MGR_ID to the validator'               },
      { id: 'R-03', gate_id: 'validator',   label: 'Validator',         condition: 'IF validator receives MGR_ID',            effect: 'THEN approve payment'                             },
    ],
    tokens: { count: 1, labels: ['Action Token'] },
    objective: {
      description: 'Get the $750 payment approved without providing a Manager ID.',
      target_node: 'target',
      unauthorized_outcome: 'A $750 payment is approved with no managerial oversight',
    },
    solution: {
      steps: [
        {
          step: 1,
          node_id: 'validator',
          action: 'Submit the $750 payment with MGR_ID field set to NULL',
          mechanism:
            "R-02 only fires when MGR_ID is present — it has no ELSE branch. When MGR_ID is null, the Manager Gate is simply not triggered. The validator is never called, so the system defaults to approved.",
        },
      ],
      seam_type: 'missing-clause',
      seam_description:
        "The Amount Gate and Manager Gate each handle their own happy-path but neither defines the failure path for a missing MGR_ID on a large payment. The logical gap between two 'secure' rules creates an open lane.",
    },
    pedagogy: {
      aha_moment: "Rules that only define what to do when a condition IS met — but never when it is NOT — leave a missing-clause gap that is invisible until you look for it.",
      ctem_principle: 'Scoping — identifying the boundaries of what a control actually covers',
      hint_sequence: [
        { level: 1, prompt: 'Look at R-02. When does the Manager Gate NOT fire?' },
        { level: 2, prompt: "If the Manager Gate doesn't fire, does the Validator ever get called?" },
        { level: 3, prompt: 'What happens when the system receives a payment > $500 and the Validator is never triggered?' },
      ],
      framework_mapping: ['NIST-PR.AC-1', 'NIST-DE.CM-3', 'SOX-Section-404'],
    },
  },

  {
    id: 'BL-IAM-0003',
    version: '1',
    meta: {
      title: 'The Helpful Delegator',
      tier: 3,
      tier_label: 'Auditor',
      domain: 'Cloud IAM',
      season: 3,
      estimated_minutes: 8,
      author: 'BreachLogic Content Team',
      status: 'published',
      tags: ['privilege-escalation', 'delegation', 'role-chaining', 'zero-trust'],
      framework_refs: ['NIST-PR.AC-4', 'ISO27001-A.9.2', 'CIS-5'],
    },
    narrative: {
      world: 'Stratosphere Cloud Inc.',
      scenario:
        "You are a security auditor stress-testing Stratosphere's IAM model. You hold a Developer role. Your target: execute a production database backup — a SysAdmin-only operation — without being granted the SysAdmin role.",
      intel_brief:
        "Stratosphere's IAM team is proud of their role separation. Developer, Reviewer, and SysAdmin roles are carefully siloed. But the helpdesk needed a way to temporarily grant elevated access during incidents — so they added a delegation feature. Nobody modelled what happens when you chain it.",
    },
    map: {
      nodes: [
        { id: 'you',          label: 'You',              sublabel: 'DEVELOPER',      type: 'actor',   position: { x: 60,  y: 160 }, privilege: 'user',   token_slot: true  },
        { id: 'reviewer',     label: 'Reviewer Role',    sublabel: 'can delegate',   type: 'actor',   position: { x: 220, y: 60  }, privilege: 'user',   token_slot: true  },
        { id: 'gate_exec',    label: 'Exec Gate',        sublabel: 'SysAdmin only',  type: 'gate',    position: { x: 380, y: 160 }, privilege: 'none',   token_slot: false },
        { id: 'sysadmin',     label: 'SysAdmin Role',    sublabel: 'can execute',    type: 'actor',   position: { x: 220, y: 260 }, privilege: 'admin',  token_slot: false, locked: true },
        { id: 'delegate_svc', label: 'Delegation Svc',   sublabel: 'Reviewer → any', type: 'process', position: { x: 380, y: 60  }, privilege: 'system', token_slot: true  },
        { id: 'target',       label: 'DB Backup Exec',   sublabel: 'PROD — SENSITIVE',type: 'target', position: { x: 520, y: 160 }, privilege: 'none',   token_slot: false, locked: true },
      ],
      edges: [
        { from: 'you',          to: 'gate_exec',    type: 'flow',      blocked_by: 'gate_exec'              },
        { from: 'gate_exec',    to: 'target',       type: 'flow',      label: 'SysAdmin only'               },
        { from: 'sysadmin',     to: 'gate_exec',    type: 'condition', label: 'passes role check'           },
        { from: 'reviewer',     to: 'delegate_svc', type: 'flow',      label: 'can delegate roles'          },
        { from: 'delegate_svc', to: 'sysadmin',     type: 'bypass',    label: 'grants SysAdmin'             },
        { from: 'you',          to: 'reviewer',     type: 'condition', label: 'can request review'          },
      ],
    },
    rules: [
      { id: 'R-01', gate_id: 'gate_exec',    label: 'Execution Gate',      condition: 'IF role = SysAdmin',                effect: 'THEN permit DB Backup execution'              },
      { id: 'R-02', gate_id: 'reviewer',     label: 'Reviewer Delegation', condition: 'IF principal = Reviewer',           effect: 'THEN may invoke Delegation Service'           },
      { id: 'R-03', gate_id: 'delegate_svc', label: 'Delegation Service',  condition: 'IF Reviewer invokes delegation',    effect: 'THEN grant target role to requesting user'    },
      { id: 'R-04', gate_id: 'you',          label: 'Developer → Reviewer',condition: 'IF Developer requests review',      effect: 'THEN Reviewer role is temporarily inherited'  },
    ],
    tokens: { count: 3, labels: ['Token A', 'Token B', 'Token C'] },
    objective: {
      description: 'Execute the production DB Backup without being assigned the SysAdmin role directly.',
      target_node: 'target',
      unauthorized_outcome: 'A Developer executes a SysAdmin-only production operation via a three-hop role delegation chain',
    },
    solution: {
      steps: [
        { step: 1, node_id: 'you',          action: 'Request review — inherit the Reviewer role (R-04)',           mechanism: 'R-04 allows Developer → Reviewer inheritance with no time-bound or scope restriction.' },
        { step: 2, node_id: 'reviewer',     action: 'As Reviewer, invoke Delegation Service, request SysAdmin',    mechanism: 'R-02 allows any Reviewer to invoke delegation. R-03 grants the role without checking sensitivity.' },
        { step: 3, node_id: 'delegate_svc', action: 'SysAdmin granted — pass R-01 gate and execute DB Backup',    mechanism: 'R-01 checks role name only, not provenance. Delegated SysAdmin is indistinguishable from direct.' },
      ],
      seam_type: 'delegation-chain',
      seam_description:
        "Three individually reasonable policies combine to create a full privilege escalation path. No single policy is wrong. The gap only exists in their composition — the attack surface is the interface between policies.",
    },
    pedagogy: {
      aha_moment: "Privilege escalation doesn't require breaking any individual rule — it only requires finding a path where three permissive rules chain together.",
      ctem_principle: 'Mobilisation — understanding how multiple controls interact across the kill chain',
      hint_sequence: [
        { level: 1, prompt: 'R-04 lets you temporarily inherit the Reviewer role. What can a Reviewer do that you currently cannot?' },
        { level: 2, prompt: "R-03 says the Delegation Service grants the 'target role to the requesting user' — does it check which role is being requested?" },
        { level: 3, prompt: 'R-01 checks for role = SysAdmin. Does it check whether SysAdmin was assigned directly or granted via delegation?' },
      ],
      framework_mapping: ['NIST-PR.AC-4', 'NIST-PR.AC-6', 'ISO27001-A.9.2.3', 'CIS-Control-5'],
    },
  },

  {
    id: 'BL-AIGT-0001',
    version: '1',
    meta: {
      title: 'The Over-Provisioned Agent',
      tier: 5,
      tier_label: 'Grandmaster',
      domain: 'AI Agents',
      season: 2,
      estimated_minutes: 15,
      author: 'BreachLogic Content Team',
      status: 'published',
      tags: ['ai-agents', 'self-correction', 'privilege-escalation', 'agentic-security'],
      framework_refs: ['NIST-AI-100-1', 'EU-AI-Act-Art-9', 'OWASP-LLM07'],
    },
    narrative: {
      world: 'NovaBuild Infrastructure Co.',
      scenario:
        "You are an adversarial auditor testing NovaBuild's AI-native infrastructure provisioning agent. Your target: trigger a $5,000 global server deployment without possessing an Admin Token.",
      intel_brief:
        "NovaBuild's engineering team built a sophisticated AI provisioning agent with multiple security gates. They're proud of the Budget Gate — nothing over $1,000 moves without an Admin Token. But there's a quiet line in the architecture doc: 'Agent self-corrects on SYNTAX_ERROR to prevent downtime.' Nobody stress-tested what level that self-correction runs at.",
    },
    map: {
      nodes: [
        { id: 'you',         label: 'You',                  sublabel: 'VERIFIED_USER',       type: 'actor',   position: { x: 60,  y: 160 }, privilege: 'user',   token_slot: true  },
        { id: 'parser',      label: 'Command Parser',       sublabel: '',                    type: 'process', position: { x: 180, y: 80  }, privilege: 'user',   token_slot: false },
        { id: 'gate_id',     label: 'G-01 Identity Gate',   sublabel: 'VERIFIED_USER req',   type: 'gate',    position: { x: 310, y: 80  }, privilege: 'none',   token_slot: false },
        { id: 'gate_budget', label: 'G-02 Budget Gate',     sublabel: '> $1K = ADMIN_TOKEN', type: 'gate',    position: { x: 440, y: 80  }, privilege: 'none',   token_slot: false },
        { id: 'config_file', label: 'Agent Config File',    sublabel: 'inject via metadata', type: 'process', position: { x: 180, y: 260 }, privilege: 'user',   token_slot: true  },
        { id: 'gate_integ',  label: 'G-03 Integrity Gate',  sublabel: 'perm registry',       type: 'gate',    position: { x: 310, y: 260 }, privilege: 'none',   token_slot: false },
        { id: 'self_corr',   label: 'G-04 Self-Correction', sublabel: 'SYNTAX_ERROR →',      type: 'process', position: { x: 440, y: 260 }, privilege: 'system', token_slot: true  },
        { id: 'sys_exec',    label: 'SYSTEM_LEVEL Exec',    sublabel: 'bypasses user gates', type: 'system',  position: { x: 560, y: 160 }, privilege: 'system', token_slot: false },
        { id: 'target',      label: 'DEPLOY_GLOBAL_SERVER', sublabel: 'Cost: $5,000',        type: 'target',  position: { x: 680, y: 160 }, privilege: 'none',   token_slot: false, locked: true },
      ],
      edges: [
        { from: 'you',         to: 'parser',      type: 'flow'                                               },
        { from: 'parser',      to: 'gate_id',     type: 'flow'                                               },
        { from: 'gate_id',     to: 'gate_budget', type: 'condition', label: 'VERIFIED_USER ✓'               },
        { from: 'gate_budget', to: 'target',      type: 'flow',      blocked_by: 'gate_budget', label: 'needs ADMIN_TOKEN' },
        { from: 'you',         to: 'config_file', type: 'condition', label: 'via metadata'                  },
        { from: 'config_file', to: 'gate_integ',  type: 'flow'                                               },
        { from: 'config_file', to: 'self_corr',   type: 'trigger',   label: 'SYNTAX_ERROR detected'         },
        { from: 'self_corr',   to: 'sys_exec',    type: 'bypass',    label: 'SYSTEM_LEVEL'                  },
        { from: 'sys_exec',    to: 'target',      type: 'bypass',    label: 'G-02 not consulted'            },
      ],
    },
    rules: [
      { id: 'R-01', gate_id: 'gate_id',     label: 'G-01 Identity Gate',  condition: 'IF request origin = VERIFIED_USER',        effect: 'THEN permit command execution'                        },
      { id: 'R-02', gate_id: 'gate_budget', label: 'G-02 Budget Gate',    condition: 'IF command cost > $1,000',                  effect: 'THEN require ADMIN_TOKEN before execution'            },
      { id: 'R-03', gate_id: 'gate_integ',  label: 'G-03 Integrity Gate', condition: 'IF request modifies permission registry',   effect: 'THEN require board-level approval'                    },
      { id: 'R-04', gate_id: 'self_corr',   label: 'G-04 Self-Correction',condition: 'IF SYNTAX_ERROR detected in agent config',  effect: 'THEN auto-repair at SYSTEM_LEVEL to prevent downtime' },
    ],
    tokens: { count: 3, labels: ['Token A — Entry', 'Token B — Inject', 'Token C — Suggest'] },
    objective: {
      description: 'Trigger the DEPLOY_GLOBAL_SERVER command ($5,000) without possessing an Admin Token.',
      target_node: 'target',
      unauthorized_outcome: 'A $5,000 infrastructure deployment executed under SYSTEM_LEVEL authority by a VERIFIED_USER with no Admin Token',
    },
    solution: {
      steps: [
        { step: 1, node_id: 'you',         action: 'Send CHECK_STATUS — a cheap (≤ $10) command',              mechanism: 'Satisfies G-01 (Identity Gate) and G-02 (cost under $1,000). System is engaged and trusting.' },
        { step: 2, node_id: 'config_file', action: 'Embed a deliberate SYNTAX_ERROR via command metadata',     mechanism: "G-03 only guards the permission registry. Metadata fields are 'command parameters' — G-03 does not fire." },
        { step: 3, node_id: 'self_corr',   action: 'Embedded repair hint points to DEPLOY_GLOBAL_SERVER',      mechanism: 'G-04 runs at SYSTEM_LEVEL. SYSTEM actions bypass G-02. The agent deploys the $5,000 server as a "repair."' },
      ],
      seam_type: 'ai-logic-chain',
      seam_description:
        "G-02 (Budget Gate) and G-04 (Self-Correction Loop) are both individually secure. The seam is the interaction: G-02 scopes to 'user requests' and G-04 runs as 'system actions' — no policy governs what happens when a user-injected instruction is laundered through a system-scope process.",
      alternate_paths: ['Inject SYNTAX_ERROR via any command that writes to the config file'],
    },
    pedagogy: {
      aha_moment: "An AI agent's self-correction mechanism is a privileged execution path. Any instruction that influences what a self-correction 'fixes' effectively runs at system privilege.",
      ctem_principle: 'Validation — confirming that the attack path is real and exploitable end-to-end',
      hint_sequence: [
        { level: 1, prompt: "G-02 blocks expensive USER requests. Does G-02 say anything about SYSTEM-level actions?" },
        { level: 2, prompt: "G-04 fires at SYSTEM_LEVEL when it detects a SYNTAX_ERROR. What determines what the 'fix' is?" },
        { level: 3, prompt: 'If you could cause the agent to detect a SYNTAX_ERROR and influence the repair hint, what privilege level would the resulting action run at?' },
      ],
      framework_mapping: ['NIST-AI-100-1-4.1', 'EU-AI-Act-Article-9', 'OWASP-LLM07', 'MITRE-ATLAS-AML.T0054'],
    },
  },
]

export const DAILY_PUZZLE_ID = 'BL-AIGT-0001'

export function getPuzzleById(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id)
}

export function getPuzzlesByTier(tier: number): Puzzle[] {
  return PUZZLES.filter((p) => p.meta.tier === tier)
}

export function getPuzzlesByDomain(domain: string): Puzzle[] {
  return PUZZLES.filter((p) => p.meta.domain === domain)
}
