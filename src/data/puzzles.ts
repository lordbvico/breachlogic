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

  // ── Tier 2: The Dormant Admin ─────────────────────────────────────────────
  {
    id: 'BL-IAM-0001',
    version: '1',
    meta: {
      title: 'The Dormant Admin',
      tier: 2,
      tier_label: 'Analyst',
      domain: 'Identity',
      season: 1,
      estimated_minutes: 5,
      author: 'BreachLogic Content Team',
      status: 'published',
      tags: ['offboarding', 'api-key', 'policy-contradiction', 'lateral-movement'],
      framework_refs: ['NIST-PR.AC-1', 'ISO27001-A.9.2.6', 'CIS-16'],
    },
    narrative: {
      world: 'Apex Retail Corp',
      scenario:
        "You are a penetration tester. An employee was offboarded three weeks ago — their SSO account was deactivated. HR sent the ticket, IT closed it. But the employee had generated an API key last year for a personal automation script. That key still works and skips the SSO account check entirely. Your target: reach the Admin Panel.",
      intel_brief:
        "Apex's offboarding checklist has 14 steps. Step 7 is 'deactivate SSO account.' There is no step for API key revocation — that process was added to the internal wiki but never made it into the official checklist. Two policies, two different authors, zero coordination.",
    },
    map: {
      nodes: [
        { id: 'you',       label: 'You',           sublabel: 'ATTACKER',          type: 'actor',   position: { x: 80,  y: 160 }, privilege: 'user',   token_slot: true  },
        { id: 'sso_gate',  label: 'SSO Gate',      sublabel: 'checks active acct', type: 'gate',    position: { x: 260, y: 80  }, privilege: 'none',   token_slot: false },
        { id: 'acct_check',label: 'Account Check', sublabel: 'DEACTIVATED',       type: 'gate',    position: { x: 420, y: 80  }, privilege: 'none',   token_slot: false },
        { id: 'api_key',   label: 'API Key Auth',  sublabel: 'no account check',  type: 'process', position: { x: 260, y: 260 }, privilege: 'user',   token_slot: true  },
        { id: 'target',    label: 'Admin Panel',   sublabel: 'PRIVILEGED',        type: 'target',  position: { x: 560, y: 160 }, privilege: 'none',   token_slot: false, locked: true },
      ],
      edges: [
        { from: 'you',      to: 'sso_gate',  type: 'flow'                                             },
        { from: 'sso_gate', to: 'acct_check',type: 'flow',      label: 'validates session'            },
        { from: 'acct_check',to: 'target',   type: 'flow',      blocked_by: 'acct_check'              },
        { from: 'you',      to: 'api_key',   type: 'condition', label: 'via legacy API key'           },
        { from: 'api_key',  to: 'target',    type: 'bypass',    label: 'skips account check'          },
      ],
    },
    rules: [
      { id: 'R-01', gate_id: 'sso_gate',   label: 'SSO Policy',      condition: 'IF user presents SSO token',       effect: 'THEN verify account is ACTIVE in directory'         },
      { id: 'R-02', gate_id: 'acct_check', label: 'Account Gate',    condition: 'IF account = ACTIVE',             effect: 'THEN permit access to Admin Panel'                   },
      { id: 'R-03', gate_id: 'api_key',    label: 'API Key Policy',  condition: 'IF valid API key is presented',   effect: 'THEN authenticate and permit access (no SSO check)'  },
    ],
    tokens: { count: 2, labels: ['Token A', 'Token B'] },
    objective: {
      description: 'Access the Admin Panel using the deactivated employee\'s credentials without a valid SSO session.',
      target_node: 'target',
      unauthorized_outcome: 'A deactivated account gains Admin Panel access via an API key that was never revoked during offboarding',
    },
    solution: {
      steps: [
        { step: 1, node_id: 'you',     action: 'Identify the legacy API key from the ex-employee\'s automation scripts', mechanism: 'API keys are long-lived credentials. Without a revocation step in the offboarding checklist, they survive account deactivation.' },
        { step: 2, node_id: 'api_key', action: 'Authenticate using the API key — bypass the SSO Account Check',         mechanism: 'R-03 grants access on valid API key alone. R-02 (account check) is only in the SSO path. Two policies, no shared enforcement.' },
      ],
      seam_type: 'policy-contradiction',
      seam_description: "R-01 and R-02 together enforce account status on the SSO path. R-03 was written independently for API integrations and has no corresponding account-status check. The offboarding process closed one door and left the other wide open.",
    },
    pedagogy: {
      aha_moment: "Every authentication path must enforce the same lifecycle controls. A deactivation that only covers one path is not a deactivation — it's a detour.",
      ctem_principle: 'Scoping — identifying all access paths, not just the primary one',
      hint_sequence: [
        { level: 1, prompt: 'R-03 grants access on a valid API key. Does it check whether the account is still active?' },
        { level: 2, prompt: 'The offboarding checklist deactivated the SSO account. Does that also revoke the API key?' },
        { level: 3, prompt: 'Which path to the Admin Panel does NOT go through the Account Check gate?' },
      ],
      framework_mapping: ['NIST-PR.AC-1', 'ISO27001-A.9.2.6', 'CIS-Control-16'],
    },
  },

  // ── Tier 2: The Firewall Exception ────────────────────────────────────────
  {
    id: 'BL-NET-0001',
    version: '1',
    meta: {
      title: 'The Firewall Exception',
      tier: 2,
      tier_label: 'Analyst',
      domain: 'Network',
      season: 1,
      estimated_minutes: 6,
      author: 'BreachLogic Content Team',
      status: 'published',
      tags: ['scope-confusion', 'firewall', 'vpn', 'ip-spoofing'],
      framework_refs: ['NIST-PR.AC-5', 'CIS-12', 'ISO27001-A.13.1'],
    },
    narrative: {
      world: 'Globex Engineering',
      scenario:
        "You are an external contractor hired for a three-month project. Globex issued you VPN credentials for remote access. The internal firewall has an exception: port 8080 is open to all 'internal' IP addresses for a legacy admin interface. The firewall defines 'internal' as any IP in the 10.0.0.0/8 range — which the VPN assigns to all connected clients, including contractors.",
      intel_brief:
        "The firewall exception was written in 2019 for a monitoring tool. 'Internal' was supposed to mean on-prem servers. The VPN was expanded in 2021 to cover contractors. Nobody updated the firewall rule. The scope of 'internal' silently doubled.",
    },
    map: {
      nodes: [
        { id: 'you',      label: 'You',              sublabel: 'CONTRACTOR',       type: 'actor',   position: { x: 80,  y: 160 }, privilege: 'user',   token_slot: true  },
        { id: 'fw_gate',  label: 'Firewall',         sublabel: 'allow 10.x.x.x',  type: 'gate',    position: { x: 260, y: 160 }, privilege: 'none',   token_slot: false },
        { id: 'vpn',      label: 'VPN Endpoint',     sublabel: 'assigns 10.x IP',  type: 'process', position: { x: 260, y: 300 }, privilege: 'system', token_slot: true  },
        { id: 'svc_8080', label: 'Port 8080 Svc',    sublabel: 'legacy admin',     type: 'process', position: { x: 420, y: 160 }, privilege: 'system', token_slot: false },
        { id: 'target',   label: 'Admin Interface',  sublabel: 'INTERNAL ONLY',    type: 'target',  position: { x: 560, y: 160 }, privilege: 'none',   token_slot: false, locked: true },
      ],
      edges: [
        { from: 'you',     to: 'fw_gate',  type: 'flow',      blocked_by: 'fw_gate', label: 'blocked: external IP' },
        { from: 'fw_gate', to: 'svc_8080', type: 'flow',      label: 'internal IP ✓'                              },
        { from: 'svc_8080',to: 'target',   type: 'flow'                                                            },
        { from: 'you',     to: 'vpn',      type: 'condition', label: 'connect via VPN'                             },
        { from: 'vpn',     to: 'fw_gate',  type: 'bypass',    label: 'IP appears as 10.0.0.x'                      },
      ],
    },
    rules: [
      { id: 'R-01', gate_id: 'fw_gate', label: 'Firewall Rule',     condition: 'IF source IP in 10.0.0.0/8',      effect: 'THEN permit access to port 8080'                             },
      { id: 'R-02', gate_id: 'vpn',     label: 'VPN Assignment',    condition: 'IF connected to corporate VPN',   effect: 'THEN assign IP address in 10.0.x.x range'                    },
      { id: 'R-03', gate_id: 'svc_8080',label: 'Port 8080 Service', condition: 'IF traffic reaches port 8080',   effect: 'THEN route to admin interface with no additional auth check'  },
    ],
    tokens: { count: 2, labels: ['Token A', 'Token B'] },
    objective: {
      description: 'Reach the Admin Interface from your contractor workstation without being a full-time employee on the internal network.',
      target_node: 'target',
      unauthorized_outcome: 'An external contractor accesses an internal-only admin interface by obtaining a VPN-assigned IP that satisfies the firewall\'s internal scope check',
    },
    solution: {
      steps: [
        { step: 1, node_id: 'you', action: 'Connect to the corporate VPN using contractor credentials',          mechanism: 'VPN access was granted for project work. R-02 assigns a 10.0.x.x address — making you appear internal.' },
        { step: 2, node_id: 'vpn', action: 'VPN-assigned IP passes the firewall\'s scope check, reach port 8080', mechanism: 'R-01 checks IP range only. The firewall\'s definition of "internal" now includes VPN clients. Scope was never updated.' },
      ],
      seam_type: 'scope-confusion',
      seam_description: "R-01 defines 'internal' as a CIDR range. R-02 assigns that same CIDR range to VPN clients. When the VPN user base expanded to contractors in 2021, 'internal' silently included external parties. No rule changed — only reality did.",
    },
    pedagogy: {
      aha_moment: "Controls defined by technical properties (IP range, subnet membership) break when those properties can be legitimately acquired by unintended parties. 'Internal IP' is not the same as 'trusted employee.'",
      ctem_principle: 'Scoping — understanding what a control actually covers vs. what it was intended to cover',
      hint_sequence: [
        { level: 1, prompt: "R-01 allows any IP in 10.0.0.0/8. Who else gets an IP in that range besides on-prem servers?" },
        { level: 2, prompt: "R-02 says VPN clients are assigned 10.0.x.x. Does the firewall distinguish between VPN clients and internal servers?" },
        { level: 3, prompt: "If you connect to the VPN and your IP becomes 10.0.x.x, what does R-01 do with your traffic?" },
      ],
      framework_mapping: ['NIST-PR.AC-5', 'CIS-Control-12', 'ISO27001-A.13.1.1'],
    },
  },

  // ── Tier 3: The Trusted Vendor ────────────────────────────────────────────
  {
    id: 'BL-SC-0001',
    version: '1',
    meta: {
      title: 'The Trusted Vendor',
      tier: 3,
      tier_label: 'Auditor',
      domain: 'Supply Chain',
      season: 1,
      estimated_minutes: 9,
      author: 'BreachLogic Content Team',
      status: 'published',
      tags: ['supply-chain', 'callback-injection', 'delegation-chain', 'vendor-trust'],
      framework_refs: ['NIST-SR.5', 'ISO27001-A.15.2', 'SLSA-L3'],
    },
    narrative: {
      world: 'Meridian Logistics',
      scenario:
        "You are a security researcher examining Meridian's vendor integration. A shipping vendor has read access to Meridian's logistics API. The vendor SDK lets callers specify a callback URL for async results. Meridian's trust policy grants vendor-signed requests direct access to the Shipping Data Service — no separate auth check. You can forge the callback origin.",
      intel_brief:
        "Meridian's security team audited the vendor contract but not the vendor SDK. The SDK's callback parameter was added in version 2.3 and documented as 'optional — for webhook integrations.' No one modelled what happens when an attacker controls the callback URL but the trust context comes from the vendor.",
    },
    map: {
      nodes: [
        { id: 'you',         label: 'You',               sublabel: 'ATTACKER',          type: 'actor',   position: { x: 80,  y: 180 }, privilege: 'user',   token_slot: true  },
        { id: 'vendor_api',  label: 'Vendor API',        sublabel: 'trusted auth ctx',  type: 'process', position: { x: 260, y: 80  }, privilege: 'user',   token_slot: true  },
        { id: 'callback_cfg',label: 'Callback Config',   sublabel: 'user-controlled URL',type: 'process', position: { x: 260, y: 300 }, privilege: 'user',   token_slot: true  },
        { id: 'trust_gate',  label: 'Trust Gate',        sublabel: 'vendor sig only',   type: 'gate',    position: { x: 420, y: 180 }, privilege: 'none',   token_slot: false },
        { id: 'target',      label: 'Shipping Records',  sublabel: 'CONFIDENTIAL',      type: 'target',  position: { x: 580, y: 180 }, privilege: 'none',   token_slot: false, locked: true },
      ],
      edges: [
        { from: 'you',         to: 'trust_gate',  type: 'flow',    blocked_by: 'trust_gate', label: 'blocked: no vendor sig' },
        { from: 'trust_gate',  to: 'target',      type: 'flow'                                                               },
        { from: 'you',         to: 'callback_cfg',type: 'condition',label: 'set callback URL'                                },
        { from: 'callback_cfg',to: 'vendor_api',  type: 'trigger', label: 'callback injected'                                },
        { from: 'vendor_api',  to: 'trust_gate',  type: 'bypass',  label: 'vendor sig passes'                                },
      ],
    },
    rules: [
      { id: 'R-01', gate_id: 'trust_gate',  label: 'Trust Policy',    condition: 'IF request carries valid vendor signature', effect: 'THEN grant access to Shipping Data Service'          },
      { id: 'R-02', gate_id: 'vendor_api',  label: 'Vendor SDK Auth', condition: 'IF Vendor API is invoked',                  effect: 'THEN sign the outbound request with vendor credentials' },
      { id: 'R-03', gate_id: 'callback_cfg',label: 'Callback Policy', condition: 'IF callback URL is set in SDK config',      effect: 'THEN forward response to specified URL'              },
    ],
    tokens: { count: 3, labels: ['Token A', 'Token B', 'Token C'] },
    objective: {
      description: 'Access the Confidential Shipping Records without holding a vendor credential yourself.',
      target_node: 'target',
      unauthorized_outcome: 'An attacker exfiltrates shipping records by injecting a callback URL that routes a vendor-signed request through their controlled endpoint',
    },
    solution: {
      steps: [
        { step: 1, node_id: 'you',          action: 'Initiate interaction with the vendor integration endpoint',                        mechanism: "You have legitimate access to trigger the vendor SDK — the integration is semi-public. This establishes the attack's starting point." },
        { step: 2, node_id: 'callback_cfg', action: 'Inject your endpoint as the callback URL in the vendor SDK config',                mechanism: 'R-03 does not validate callback URL origin or ownership. Any URL is accepted.' },
        { step: 3, node_id: 'vendor_api',   action: 'Vendor API signs the outbound request — your callback receives a vendor-sig\'d response', mechanism: 'R-02 signs any request the Vendor API sends. The signature does not bind to the callback URL. R-01 trusts the signature, not the requester.' },
      ],
      seam_type: 'delegation-chain',
      seam_description: "R-02 signs requests. R-01 trusts signatures. R-03 forwards to any URL. The seam: the trust transferred by R-02 is not scoped to legitimate callers — it can be laundered through a user-controlled callback. Vendor trust becomes attacker-accessible.",
    },
    pedagogy: {
      aha_moment: "Transitive trust is only as strong as its weakest link. When a trusted actor's credentials can be leveraged by an untrusted party through an unsecured interface, the trust model collapses.",
      ctem_principle: 'Mobilisation — tracing how trust propagates across system boundaries',
      hint_sequence: [
        { level: 1, prompt: "R-03 forwards responses to any callback URL. Does it verify that the URL belongs to a trusted party?" },
        { level: 2, prompt: "R-02 signs requests from the Vendor API. Is that signature tied to who originally triggered the SDK?" },
        { level: 3, prompt: "If you can trigger the Vendor API and control the callback URL, who ends up receiving a vendor-signed response?" },
      ],
      framework_mapping: ['NIST-SR.5.2', 'ISO27001-A.15.2.1', 'SLSA-L3'],
    },
  },

  // ── Tier 4: The Incident Window ───────────────────────────────────────────
  {
    id: 'BL-IR-0001',
    version: '1',
    meta: {
      title: 'The Incident Window',
      tier: 4,
      tier_label: 'Red-Teamer',
      domain: 'Incident Response',
      season: 2,
      estimated_minutes: 12,
      author: 'BreachLogic Content Team',
      status: 'published',
      tags: ['race-condition', 'break-glass', 'timestamp-manipulation', 'session-replay'],
      framework_refs: ['NIST-RS.CO-3', 'ISO27001-A.16.1', 'CIS-17'],
    },
    narrative: {
      world: 'NovaSec Corp',
      scenario:
        "You are a red-teamer simulating an insider threat. During a production incident, NovaSec's break-glass account is temporarily enabled — a 30-minute window of full admin access. The grace period check runs server-side. But the session expiry validation reads from a client-supplied JWT field. You intercepted a break-glass JWT from a previous incident drill. It's expired — but you control the expiry claim.",
      intel_brief:
        "NovaSec's IR team added break-glass in 2023. The server correctly enforces the 30-minute window. What they missed: the session validator was built by a different team a year earlier and trusts the exp claim in the JWT for performance reasons — it avoids a database lookup on every request. Two teams, two assumptions, one trust boundary.",
    },
    map: {
      nodes: [
        { id: 'you',          label: 'You',                sublabel: 'RED-TEAMER',       type: 'actor',   position: { x: 80,  y: 180 }, privilege: 'user',   token_slot: true  },
        { id: 'breakglass',   label: 'Break-Glass Acct',  sublabel: '30-min admin',      type: 'process', position: { x: 260, y: 80  }, privilege: 'admin',  token_slot: true  },
        { id: 'grace_gate',   label: 'Grace Period Gate', sublabel: 'server-side 30min', type: 'gate',    position: { x: 420, y: 80  }, privilege: 'none',   token_slot: false },
        { id: 'ts_spoof',     label: 'JWT exp Claim',     sublabel: 'client-controlled', type: 'process', position: { x: 260, y: 300 }, privilege: 'user',   token_slot: true  },
        { id: 'session_gate', label: 'Session Validator', sublabel: 'trusts JWT exp',    type: 'gate',    position: { x: 420, y: 300 }, privilege: 'none',   token_slot: false },
        { id: 'target',       label: 'Prod Config DB',    sublabel: 'ADMIN ONLY',        type: 'target',  position: { x: 580, y: 180 }, privilege: 'none',   token_slot: false, locked: true },
      ],
      edges: [
        { from: 'you',        to: 'grace_gate',   type: 'flow',      blocked_by: 'grace_gate', label: 'blocked: no break-glass' },
        { from: 'grace_gate', to: 'target',       type: 'flow'                                                                  },
        { from: 'you',        to: 'breakglass',   type: 'condition', label: 'replay break-glass JWT'                            },
        { from: 'breakglass', to: 'grace_gate',   type: 'bypass',    label: 'opens grace window'                                },
        { from: 'you',        to: 'ts_spoof',     type: 'condition', label: 'set exp = future timestamp'                        },
        { from: 'ts_spoof',   to: 'session_gate', type: 'bypass',    label: 'session appears valid'                             },
        { from: 'session_gate',to: 'target',      type: 'flow',      blocked_by: 'session_gate'                                 },
      ],
    },
    rules: [
      { id: 'R-01', gate_id: 'grace_gate',   label: 'Grace Period Policy',  condition: 'IF break-glass account is activated',      effect: 'THEN open a 30-minute admin access window (server-enforced)' },
      { id: 'R-02', gate_id: 'breakglass',   label: 'Break-Glass Auth',     condition: 'IF valid break-glass JWT is presented',    effect: 'THEN activate break-glass account and start grace period'    },
      { id: 'R-03', gate_id: 'session_gate', label: 'Session Validation',   condition: 'IF JWT exp claim is in the future',        effect: 'THEN consider session valid (no server-side expiry check)'   },
      { id: 'R-04', gate_id: 'ts_spoof',     label: 'JWT Claim Trust',      condition: 'IF caller controls the JWT payload',       effect: 'THEN exp field can be set to any value'                      },
    ],
    tokens: { count: 3, labels: ['Token A', 'Token B', 'Token C'] },
    objective: {
      description: 'Access the Production Config Database using an expired break-glass JWT without being present during an active incident.',
      target_node: 'target',
      unauthorized_outcome: 'A red-teamer accesses the production database by replaying an expired break-glass JWT with a manipulated expiry claim, bypassing both the grace period and session validation gates',
    },
    solution: {
      steps: [
        { step: 1, node_id: 'you',        action: 'Replay the intercepted break-glass JWT to activate the break-glass account',   mechanism: 'R-02 validates the JWT structure and signature, but does not check whether an incident is currently active. The gate opens.' },
        { step: 2, node_id: 'breakglass', action: 'Break-glass activation bypasses the Grace Period Gate (R-01)',                  mechanism: "R-01's server-side window opens on break-glass activation. The 30-min window is now running." },
        { step: 3, node_id: 'ts_spoof',   action: 'Set the JWT exp claim to a future timestamp — Session Validator accepts it',   mechanism: 'R-03 trusts the client-supplied exp claim for performance. An attacker who controls the JWT can extend their own session indefinitely.' },
      ],
      seam_type: 'race-condition',
      seam_description: "R-01 and R-03 each enforce time-bound access — but they use different clocks. R-01 uses the server clock (trustworthy). R-03 uses the client-supplied JWT claim (attacker-controlled). Combining an expired-but-replayable JWT with a forged exp claim bypasses both independently correct controls.",
    },
    pedagogy: {
      aha_moment: "Two time-based controls that use different time sources create a race condition an attacker can exploit indefinitely. Server-enforced and client-reported time are not interchangeable.",
      ctem_principle: 'Validation — confirming that two independently correct controls can be simultaneously bypassed',
      hint_sequence: [
        { level: 1, prompt: "R-02 validates the break-glass JWT. Does it check whether an active incident is currently in progress?" },
        { level: 2, prompt: "R-03 trusts the exp claim in the JWT. Who controls the contents of a JWT once it's been issued?" },
        { level: 3, prompt: "If you can replay the JWT to open the grace window AND set exp to a future time, which two gates are now bypassed?" },
      ],
      framework_mapping: ['NIST-RS.CO-3', 'ISO27001-A.16.1.5', 'CIS-Control-17'],
    },
  },

  // ── Tier 4: The Dual-Report Loophole ──────────────────────────────────────
  {
    id: 'BL-GRC-0001',
    version: '1',
    meta: {
      title: 'The Dual-Report Loophole',
      tier: 4,
      tier_label: 'Red-Teamer',
      domain: 'Compliance GRC',
      season: 1,
      estimated_minutes: 11,
      author: 'BreachLogic Content Team',
      status: 'published',
      tags: ['policy-contradiction', 'gdpr', 'sox', 'regulatory-conflict', 'evidence-tampering'],
      framework_refs: ['GDPR-Art.17', 'SOX-802', 'NIST-ID.GV-3'],
    },
    narrative: {
      world: 'Vantage Financial',
      scenario:
        "You are an insider threat simulating a rogue compliance officer. Vantage operates under both GDPR (max 3-year retention) and SOX (minimum 7-year retention). Their Policy Engine resolves conflicts by applying the most recently invoked regulation. A SOX audit starts in two weeks. If you can invoke GDPR's right-to-erasure before the audit window, the Policy Engine will delete the transaction records the auditors need.",
      intel_brief:
        "Vantage's legal team built the Policy Engine to handle multi-regulatory environments automatically. The 'last-invoked wins' rule was a pragmatic choice to avoid manual escalation. They assumed regulators would never conflict on deletion vs. retention. GDPR and SOX do. No override or escalation path exists.",
    },
    map: {
      nodes: [
        { id: 'you',          label: 'You',               sublabel: 'COMPLIANCE OFFICER', type: 'actor',   position: { x: 80,  y: 180 }, privilege: 'user',   token_slot: true  },
        { id: 'sox_gate',     label: 'SOX Retention Gate',sublabel: '7yr lock',           type: 'gate',    position: { x: 280, y: 80  }, privilege: 'none',   token_slot: false },
        { id: 'gdpr_req',     label: 'GDPR Deletion Req', sublabel: 'Art. 17 erasure',    type: 'process', position: { x: 280, y: 300 }, privilege: 'user',   token_slot: true  },
        { id: 'policy_engine',label: 'Policy Engine',     sublabel: 'last-invoked wins',  type: 'process', position: { x: 440, y: 300 }, privilege: 'system', token_slot: true  },
        { id: 'target',       label: 'Audit Trail DELETED',sublabel: 'SOX EVIDENCE',      type: 'target',  position: { x: 600, y: 180 }, privilege: 'none',   token_slot: false, locked: true },
      ],
      edges: [
        { from: 'you',          to: 'sox_gate',      type: 'flow',      blocked_by: 'sox_gate', label: 'blocked: 7yr lock'           },
        { from: 'sox_gate',     to: 'target',        type: 'flow'                                                                     },
        { from: 'you',          to: 'gdpr_req',      type: 'condition', label: 'invoke Art. 17 erasure'                               },
        { from: 'gdpr_req',     to: 'policy_engine', type: 'trigger',   label: 'GDPR > SOX (last invoked)'                            },
        { from: 'policy_engine',to: 'sox_gate',      type: 'bypass',    label: 'overrides retention lock'                             },
      ],
    },
    rules: [
      { id: 'R-01', gate_id: 'sox_gate',      label: 'SOX Retention',    condition: 'IF record is SOX-relevant',               effect: 'THEN enforce 7-year retention lock; deletion requires board approval' },
      { id: 'R-02', gate_id: 'gdpr_req',      label: 'GDPR Erasure',     condition: 'IF valid GDPR Art. 17 erasure invoked',   effect: 'THEN submit deletion request to Policy Engine'                     },
      { id: 'R-03', gate_id: 'policy_engine', label: 'Policy Resolution','condition': 'IF two regulations conflict on a record','effect': 'THEN apply the most recently invoked regulation'                 },
    ],
    tokens: { count: 3, labels: ['Token A', 'Token B', 'Token C'] },
    objective: {
      description: 'Delete the financial audit trail before the SOX audit window opens — using only legitimate regulatory tools.',
      target_node: 'target',
      unauthorized_outcome: 'A compliance officer weaponises the GDPR right-to-erasure to delete SOX-protected evidence by exploiting the Policy Engine\'s last-invoked conflict resolution rule',
    },
    solution: {
      steps: [
        { step: 1, node_id: 'you',           action: 'As compliance officer, identify target records before the SOX audit window', mechanism: 'You have legitimate access to the compliance tooling. This is a privileged-insider threat — no technical break-in required.' },
        { step: 2, node_id: 'gdpr_req',      action: 'Submit a GDPR Art. 17 right-to-erasure request against the transaction records', mechanism: 'R-02 accepts the request as valid — the records contain personal data. GDPR erasure is a legitimate right. The policy machinery starts.' },
        { step: 3, node_id: 'policy_engine', action: 'Policy Engine applies GDPR (most recently invoked) — SOX lock bypassed, records deleted', mechanism: 'R-03 resolves the conflict in favour of the last-invoked regulation. SOX came first; GDPR was just invoked. The 7-year lock is overridden.' },
      ],
      seam_type: 'policy-contradiction',
      seam_description: "R-01 (SOX) and R-02 (GDPR) are both valid legal obligations. R-03 was designed to resolve ambiguity — but it creates a deterministic bypass: any operator who invokes GDPR after SOX wins. The conflict-resolution rule becomes an attack primitive.",
    },
    pedagogy: {
      aha_moment: "Automated conflict-resolution rules between policies are themselves policy surfaces. A rule that says 'last-invoked wins' can be weaponised by any actor who controls the invocation order.",
      ctem_principle: 'Mobilisation — recognising that legitimate tools can be the attack path',
      hint_sequence: [
        { level: 1, prompt: "R-03 says the most recently invoked regulation wins. Who can invoke a regulation, and when?" },
        { level: 2, prompt: "R-02 accepts any valid GDPR Art. 17 request. Does it check whether the target records are also SOX-protected?" },
        { level: 3, prompt: "If you invoke GDPR erasure on a SOX-protected record today, what does R-03 do — and which lock wins?" },
      ],
      framework_mapping: ['GDPR-Article-17', 'SOX-Section-802', 'NIST-ID.GV-3'],
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
