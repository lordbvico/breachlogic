import Link from 'next/link'
import type { Puzzle } from '@/types/puzzle'
import { TIER_CONFIG, DOMAIN_ICONS } from '@/constants/theme'
import { Clock, ChevronRight, Zap } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  puzzle: Puzzle
  isToday?: boolean
  solved?: boolean
  compact?: boolean
  isCustom?: boolean
  /** ATQ points earned on this puzzle (only shown when solved) */
  atqEarned?: number
  /** Percentage score 0-100 (only shown when solved) */
  scorePct?: number
}

export default function DailyCard({ puzzle, isToday, solved, compact, isCustom, atqEarned, scorePct }: Props) {
  const { meta, narrative } = puzzle
  const tierCfg = TIER_CONFIG[meta.tier]
  const domainIcon = DOMAIN_ICONS[meta.domain] ?? '🔒'

  return (
    <Link
      href={`/puzzle/${puzzle.id}`}
      className={clsx(
        'group block rounded-xl border bg-white transition-all hover:shadow-md hover:border-brand-teal/40',
        isToday ? 'border-brand-teal/50 shadow-sm' : 'border-slate-200',
        solved && 'opacity-75',
        compact ? 'p-3' : 'p-5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Labels row */}
          <div className="flex items-center gap-2 mb-2">
            {isToday && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-navy text-white">
                Today
              </span>
            )}
            {isCustom && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-teal/15 text-brand-tealdk border border-brand-teal/30">
                Custom
              </span>
            )}
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: tierCfg.bgColor, color: tierCfg.color }}
            >
              {tierCfg.label}
            </span>
            <span className="text-[10px] text-slate-mid">{domainIcon} {meta.domain}</span>
          </div>

          {/* Title */}
          <h3 className={clsx('font-semibold text-brand-navy leading-tight', compact ? 'text-sm' : 'text-base')}>
            {meta.title}
          </h3>

          {!compact && (
            <p className="text-xs text-slate mt-1.5 leading-relaxed line-clamp-2">
              {narrative.scenario}
            </p>
          )}

          {/* Footer meta */}
          <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-mid">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{meta.estimated_minutes}m
            </span>
            {solved && atqEarned !== undefined && (
              <span className="flex items-center gap-1 text-brand-tealdk font-semibold">
                <Zap className="w-3 h-3" />
                +{atqEarned} ATQ
              </span>
            )}
            {solved && scorePct !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                  scorePct >= 80 ? 'bg-success-greenlite text-success-green' :
                  scorePct >= 50 ? 'bg-gate-amberlite text-gate-amberdk' :
                  'bg-slate-lite text-slate',
                )}
              >
                {scorePct}%
              </span>
            )}
            {!solved && meta.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-lite text-slate text-[10px]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={clsx(
          'flex-shrink-0 flex items-center justify-center rounded-lg',
          compact ? 'w-8 h-8' : 'w-10 h-10',
        )}
          style={{ background: solved ? '#EAF3DE' : tierCfg.bgColor }}
        >
          {solved ? (
            <span className="text-sm font-bold" style={{ color: '#3B6D11' }}>✓</span>
          ) : (
            <ChevronRight
              className={clsx('transition-transform group-hover:translate-x-0.5', compact ? 'w-4 h-4' : 'w-5 h-5')}
              style={{ color: tierCfg.color }}
            />
          )}
        </div>
      </div>
    </Link>
  )
}
