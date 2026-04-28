// BreachLogic Design Tokens
// Single source of truth for brand colors, used in both Tailwind and inline styles

export const COLORS = {
  brand: {
    navy:      '#1A237E',
    navyDark:  '#0D1B6E',
    teal:      '#00BCD4',
    tealDark:  '#0097A7',
    tealLight: '#E0F7FA',
  },
  gate: {
    amber:      '#BA7517',
    amberLight: '#FAEEDA',
    amberDark:  '#633806',
    warn:       '#E65100',
    warnLight:  '#FFF3E0',
  },
  target: {
    red:      '#A32D2D',
    redLight: '#FCEBEB',
    redDark:  '#501313',
  },
  success: {
    green:      '#3B6D11',
    greenLight: '#EAF3DE',
  },
  slate: {
    dark:    '#37474F',
    mid:     '#90A4AE',
    light:   '#ECEFF1',
    white:   '#FFFFFF',
  },
  node: {
    actor:   { bg: '#E3F2FD', border: '#1A237E', text: '#0C447C' },
    gate:    { bg: '#FAEEDA', border: '#BA7517', text: '#633806' },
    process: { bg: '#E0F7FA', border: '#0097A7', text: '#085041' },
    target:  { bg: '#FCEBEB', border: '#A32D2D', text: '#501313' },
    system:  { bg: '#ECEFF1', border: '#37474F', text: '#37474F' },
  },
} as const

export const TIER_CONFIG: Record<number, {
  label: string
  color: string
  bgColor: string
  description: string
}> = {
  1: { label: 'Scout',       color: '#3B6D11', bgColor: '#EAF3DE', description: 'Single missing clause' },
  2: { label: 'Analyst',     color: '#0097A7', bgColor: '#E0F7FA', description: 'Two-step contradiction' },
  3: { label: 'Auditor',     color: '#1A237E', bgColor: '#E3F2FD', description: 'Privilege escalation' },
  4: { label: 'Red-Teamer',  color: '#BA7517', bgColor: '#FAEEDA', description: 'Race condition' },
  5: { label: 'Grandmaster', color: '#A32D2D', bgColor: '#FCEBEB', description: 'AI logic chain' },
}

export const DOMAIN_ICONS: Record<string, string> = {
  'Cloud IAM':          '🔑',
  'AI Agents':          '🤖',
  'Financial Controls': '💳',
  'Supply Chain':       '🔗',
  'Incident Response':  '🚨',
  'Compliance GRC':     '📋',
  'Network':            '🌐',
  'Identity':           '🪪',
}

export const SEAM_TYPE_LABELS: Record<string, string> = {
  'missing-clause':       'Missing Clause',
  'policy-contradiction': 'Policy Contradiction',
  'privilege-escalation': 'Privilege Escalation',
  'race-condition':       'Race Condition',
  'ai-logic-chain':       'AI Logic Chain',
  'scope-confusion':      'Scope Confusion',
  'delegation-chain':     'Delegation Chain',
}

export const RANK_CONFIG: Record<string, {
  min: number
  max: number
  color: string
  bgColor: string
}> = {
  'Scout':       { min: 0,   max: 199,  color: '#3B6D11', bgColor: '#EAF3DE' },
  'Analyst':     { min: 200, max: 399,  color: '#0097A7', bgColor: '#E0F7FA' },
  'Auditor':     { min: 400, max: 599,  color: '#1A237E', bgColor: '#E3F2FD' },
  'Red-Teamer':  { min: 600, max: 799,  color: '#BA7517', bgColor: '#FAEEDA' },
  'Grandmaster': { min: 800, max: 1000, color: '#A32D2D', bgColor: '#FCEBEB' },
}
