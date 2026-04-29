import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Flame, Zap, Medal } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leaderboard — BreachLogic',
  description: 'Top BreachLogic players ranked by ATQ score.',
}

export const revalidate = 60

function playerLabel(username: string | null, id: string) {
  if (username) return username
  return `Player#${id.slice(-4).toUpperCase()}`
}

function rankIcon(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/leaderboard')

  const { data: rows } = await supabase
    .from('profiles')
    .select('id, username, atq_score, streak, last_played_at')
    .order('atq_score', { ascending: false })
    .limit(50)

  const players = rows ?? []
  const myRank = players.findIndex((p) => p.id === user.id) + 1
  const myEntry = players.find((p) => p.id === user.id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-navy flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5 text-brand-teal" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Leaderboard</h1>
          <p className="text-sm text-slate-mid">Top {players.length} players by ATQ score</p>
        </div>
      </div>

      {/* My rank callout (if not in top 3) */}
      {myRank > 3 && myEntry && (
        <div className="flex items-center gap-4 rounded-xl bg-brand-teallite border border-brand-teal/30 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-xs font-bold text-brand-teal flex-shrink-0">
            {playerLabel(myEntry.username, myEntry.id).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-navy truncate">
              You · {playerLabel(myEntry.username, myEntry.id)}
            </p>
            <p className="text-[11px] text-slate-mid">Rank #{myRank}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-gate-amber" />
              <span className="text-xs font-semibold text-brand-navy">{myEntry.streak}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-brand-teal" />
              <span className="text-xs font-semibold text-brand-teal">{(myEntry.atq_score).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {players.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-mid">
            No players yet. Be the first to solve a puzzle!
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-mid w-12">Rank</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-mid">Player</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-mid">ATQ</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-mid">Streak</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-mid hidden sm:table-cell">Last active</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => {
                const rank = i + 1
                const isMe = player.id === user.id
                const medal = rankIcon(rank)
                const label = playerLabel(player.username, player.id)
                const initial = label.charAt(0).toUpperCase()
                const lastActive = player.last_played_at
                  ? new Date(player.last_played_at).toLocaleDateString()
                  : '—'

                return (
                  <tr
                    key={player.id}
                    className={`border-b border-slate-100 last:border-0 transition-colors ${
                      isMe ? 'bg-brand-teallite' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {medal ? (
                          <span className="text-base">{medal}</span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-mid w-5 text-center">{rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                          isMe
                            ? 'bg-brand-teal/20 border border-brand-teal/40 text-brand-teal'
                            : 'bg-slate-100 border border-slate-200 text-slate'
                        }`}>
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-medium truncate ${isMe ? 'text-brand-teal' : 'text-brand-navy'}`}>
                            {label}
                            {isMe && <span className="ml-1.5 text-[10px] text-brand-teal/70">(you)</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-brand-navy">{(player.atq_score).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-slate">{player.streak}🔥</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="text-[11px] text-slate-mid">{lastActive}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-mid">
        Leaderboard refreshes every 60 seconds · ATQ scores reflect completed puzzles only
      </p>
    </div>
  )
}
