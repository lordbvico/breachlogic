'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Puzzle, RefreshCw, Shield, Check, X, Trash2, Upload,
  ChevronDown, ChevronUp, AlertCircle, Star, Globe, Lock, Loader2, Edit2,
  ExternalLink, Clock, CheckCircle, XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { TIER_CONFIG } from '@/constants/theme'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  username: string | null
  email: string | null
  is_admin: boolean
  atq_score: number
  streak: number
  last_played_at: string | null
  created_at: string
}

interface OfficialPuzzle {
  source: 'official'
  puzzle_id: string
  title: string
  tier: number
  domain: string
  data: unknown
  override_id: string | null
  hidden: boolean
}

interface CommunityPuzzleItem {
  source: 'community'
  id: string
  puzzle_id: string | null
  title: string
  published: boolean
  featured: boolean
  status: string
  created_at: string
  updated_at: string
  author_id: string
  profiles: { username: string | null; email: string | null } | null
  data: unknown
}

interface EditState {
  type: 'official' | 'community'
  id: string
  override_id: string | null
  jsonText: string
}

type Tab = 'users' | 'puzzles'

/** sessionStorage key used to hand a puzzle off to the PuzzleBuilder */
export const BUILDER_LOAD_KEY = 'bl_builder_load'

export interface BuilderHandoff {
  puzzle: unknown          // full Puzzle JSON
  rowId: string | null     // community_puzzles row UUID (null = new)
  puzzleDataId: string     // puzzle.id string (e.g. "BL-CUSTOM-...")
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPortal({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [officialPuzzles, setOfficialPuzzles] = useState<OfficialPuzzle[]>([])
  const [communityPuzzles, setCommunityPuzzles] = useState<CommunityPuzzleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json() as { users?: AdminUser[]; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load users')
      setUsers(json.users ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPuzzles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/puzzles')
      const json = await res.json() as { official?: OfficialPuzzle[]; community?: CommunityPuzzleItem[]; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load puzzles')
      setOfficialPuzzles(json.official ?? [])
      setCommunityPuzzles(json.community ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load puzzles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'users') fetchUsers()
    else fetchPuzzles()
  }, [tab, fetchUsers, fetchPuzzles])

  const totalPuzzles = officialPuzzles.length + communityPuzzles.length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
            <Shield className="w-4 h-4 text-brand-teal" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-brand-navy">Admin Portal</h1>
            <p className="text-xs text-slate-mid">{adminEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-mid">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-green/10 border border-success-green/30 text-success-green font-medium">
            <Check className="w-3 h-3" /> Admin
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total users" value={users.length || '—'} icon={Users} />
        <StatCard label="Total puzzles" value={totalPuzzles || '—'} icon={Puzzle} />
        <StatCard label="Community puzzles" value={communityPuzzles.length || '—'} icon={Globe} />
        <StatCard
          label="Pending review"
          value={communityPuzzles.filter((p) => p.status === 'pending_review').length || '—'}
          icon={Clock}
          highlight={communityPuzzles.some((p) => p.status === 'pending_review')}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {(['users', 'puzzles'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors capitalize',
                tab === t
                  ? 'text-brand-navy border-b-2 border-brand-navy -mb-px bg-white'
                  : 'text-slate hover:text-brand-navy hover:bg-slate-50',
              )}
            >
              {t === 'users' ? <Users className="w-4 h-4" /> : <Puzzle className="w-4 h-4" />}
              {t === 'users' ? `Users (${users.length})` : `Puzzles (${totalPuzzles})`}
            </button>
          ))}
          <div className="ml-auto flex items-center pr-4">
            <button
              onClick={() => tab === 'users' ? fetchUsers() : fetchPuzzles()}
              className="p-1.5 rounded-md text-slate-mid hover:text-brand-navy hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-5 py-3 bg-target-redlite border-b border-target-red/20 text-xs text-target-red">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading && !error ? (
          <div className="flex items-center justify-center py-16 text-slate-mid">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'users' && <UsersTab users={users} onRefresh={fetchUsers} />}
            {tab === 'puzzles' && (
              <PuzzlesTab
                officialPuzzles={officialPuzzles}
                communityPuzzles={communityPuzzles}
                onRefresh={fetchPuzzles}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ users, onRefresh }: { users: AdminUser[]; onRefresh: () => void }) {
  const [sortBy, setSortBy] = useState<'created_at' | 'atq_score' | 'streak'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [saving, setSaving] = useState<string | null>(null)

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const sorted = [...users].sort((a, b) => {
    const va = a[sortBy] ?? ''
    const vb = b[sortBy] ?? ''
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  async function toggleAdmin(user: AdminUser) {
    setSaving(user.id)
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: !user.is_admin }),
    })
    setSaving(null)
    onRefresh()
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3 opacity-30" />

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <Th>Email / Username</Th>
            <Th sortable onClick={() => toggleSort('atq_score')}>
              ATQ <SortIcon col="atq_score" />
            </Th>
            <Th sortable onClick={() => toggleSort('streak')}>
              Streak <SortIcon col="streak" />
            </Th>
            <Th sortable onClick={() => toggleSort('created_at')}>
              Joined <SortIcon col="created_at" />
            </Th>
            <Th>Admin</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((u) => (
            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3">
                <p className="font-medium text-brand-navy text-xs">{u.email ?? u.id.slice(0, 16) + '…'}</p>
                {u.username && <p className="text-[11px] text-slate-mid">@{u.username}</p>}
              </td>
              <td className="px-5 py-3 text-xs font-semibold text-brand-navy">{u.atq_score.toLocaleString()}</td>
              <td className="px-5 py-3 text-xs text-slate">{u.streak}🔥</td>
              <td className="px-5 py-3 text-xs text-slate-mid">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="px-5 py-3">
                <button
                  onClick={() => toggleAdmin(u)}
                  disabled={saving === u.id}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border',
                    u.is_admin
                      ? 'bg-success-green/10 border-success-green/30 text-success-green hover:bg-success-green/20'
                      : 'bg-slate-100 border-slate-200 text-slate-mid hover:bg-slate-200',
                  )}
                >
                  {saving === u.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : u.is_admin ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />
                  }
                  {u.is_admin ? 'Admin' : 'User'}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-mid">
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Puzzles Tab ───────────────────────────────────────────────────────────────

function PuzzlesTab({
  officialPuzzles,
  communityPuzzles,
  onRefresh,
}: {
  officialPuzzles: OfficialPuzzle[]
  communityPuzzles: CommunityPuzzleItem[]
  onRefresh: () => void
}) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(false)
  const [editing, setEditing] = useState<EditState | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function startEditOfficial(p: OfficialPuzzle) {
    setShowUpload(false)
    setEditing({
      type: 'official',
      id: p.puzzle_id,
      override_id: p.override_id,
      jsonText: JSON.stringify(p.data, null, 2),
    })
  }

  function startEditCommunity(p: CommunityPuzzleItem) {
    setShowUpload(false)
    setEditing({
      type: 'community',
      id: p.id,
      override_id: null,
      jsonText: JSON.stringify(p.data, null, 2),
    })
  }

  async function togglePublished(puzzle: CommunityPuzzleItem) {
    setSaving(puzzle.id)
    await fetch(`/api/admin/puzzles/${puzzle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !puzzle.published }),
    })
    setSaving(null)
    onRefresh()
  }

  async function toggleFeatured(puzzle: CommunityPuzzleItem) {
    setSaving(puzzle.id + '-feat')
    await fetch(`/api/admin/puzzles/${puzzle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !puzzle.featured }),
    })
    setSaving(null)
    onRefresh()
  }

  async function deletePuzzle(puzzle: CommunityPuzzleItem) {
    if (!confirm(`Delete "${puzzle.title}"? This cannot be undone.`)) return
    setDeleting(puzzle.id)
    await fetch(`/api/admin/puzzles/${puzzle.id}`, { method: 'DELETE' })
    setDeleting(null)
    onRefresh()
  }

  function openInBuilder(puzzle: CommunityPuzzleItem) {
    const puzzleData = puzzle.data as { id?: string } | null
    const handoff: BuilderHandoff = {
      puzzle:       puzzle.data,
      rowId:        puzzle.id,
      puzzleDataId: puzzleData?.id ?? puzzle.id,
    }
    sessionStorage.setItem(BUILDER_LOAD_KEY, JSON.stringify(handoff))
    router.push('/sandbox')
  }

  function openOfficialInBuilder(puzzle: OfficialPuzzle) {
    // data is already the override data if one exists, otherwise the original
    const handoff: BuilderHandoff = {
      puzzle:       puzzle.data,
      rowId:        puzzle.override_id,   // null if no override yet — builder will INSERT on publish
      puzzleDataId: puzzle.puzzle_id,     // keep canonical ID e.g. "BL-COMP-0001"
    }
    sessionStorage.setItem(BUILDER_LOAD_KEY, JSON.stringify(handoff))
    router.push('/sandbox')
  }

  async function deleteOfficialPuzzle(puzzle: OfficialPuzzle) {
    if (!confirm(`Hide "${puzzle.title}" from the puzzle library?\n\nYou can restore it at any time from this page.`)) return
    setSaving(puzzle.puzzle_id + '-hide')
    await fetch(`/api/admin/puzzles/official/${encodeURIComponent(puzzle.puzzle_id)}`, { method: 'DELETE' })
    setSaving(null)
    onRefresh()
  }

  async function restoreOfficialPuzzle(puzzle: OfficialPuzzle) {
    setSaving(puzzle.puzzle_id + '-hide')
    await fetch(`/api/admin/puzzles/official/${encodeURIComponent(puzzle.puzzle_id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    })
    setSaving(null)
    onRefresh()
  }

  async function approvePuzzle(puzzle: CommunityPuzzleItem) {
    setSaving(puzzle.id + '-approve')
    await fetch(`/api/admin/puzzles/${puzzle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        published: true,
        status: 'published',
        notify: { type: 'puzzle_approved' },
      }),
    })
    setSaving(null)
    onRefresh()
  }

  async function rejectPuzzle(puzzle: CommunityPuzzleItem) {
    const reason = prompt('Reason for rejection (optional — will be shown to the author):')
    if (reason === null) return // user pressed Cancel
    setSaving(puzzle.id + '-reject')
    await fetch(`/api/admin/puzzles/${puzzle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        published: false,
        status: 'rejected',
        notify: { type: 'puzzle_rejected', reason: reason || undefined },
      }),
    })
    setSaving(null)
    onRefresh()
  }

  async function changeTier(puzzle: CommunityPuzzleItem, newTier: number) {
    setSaving(puzzle.id + '-tier')
    const data = puzzle.data as Record<string, unknown>
    const meta = ((data.meta ?? {}) as Record<string, unknown>)
    const cfg  = TIER_CONFIG[newTier as keyof typeof TIER_CONFIG]
    const updatedData = {
      ...data,
      meta: { ...meta, tier: newTier, tier_label: cfg?.label ?? String(newTier) },
    }
    await fetch(`/api/admin/puzzles/${puzzle.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data: updatedData }),
    })
    setSaving(null)
    onRefresh()
  }

  const totalCount = officialPuzzles.length + communityPuzzles.length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <p className="text-xs text-slate-mid">
          {officialPuzzles.length} official · {communityPuzzles.length} community
        </p>
        <button
          onClick={() => { setShowUpload((v) => !v); setEditing(null) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-brand-navydk transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Puzzle JSON
        </button>
      </div>

      {showUpload && (
        <UploadPuzzleForm onDone={() => { setShowUpload(false); onRefresh() }} />
      )}

      {editing && (
        <EditPuzzleForm
          editing={editing}
          onDone={() => { setEditing(null); onRefresh() }}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* Pending Review section */}
      {communityPuzzles.some((p) => p.status === 'pending_review') && (
        <div className="border-b border-gate-amber/30 bg-gate-amberlite px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gate-amberdk" />
            <h3 className="text-sm font-semibold text-gate-amberdk">
              Pending Review ({communityPuzzles.filter((p) => p.status === 'pending_review').length})
            </h3>
            <p className="text-xs text-gate-amber ml-1">— puzzles submitted by users, awaiting your approval</p>
          </div>
          <div className="space-y-2">
            {communityPuzzles.filter((p) => p.status === 'pending_review').map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl border border-gate-amber/30 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-brand-navy truncate">{p.title}</p>
                  <p className="text-[10px] text-slate-mid mt-0.5">
                    By {p.profiles?.username ?? p.profiles?.email ?? 'Unknown'} ·{' '}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openInBuilder(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-brand-navy border border-brand-navy/30 hover:bg-brand-navy/5 transition-colors"
                    title="Preview in builder"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Preview
                  </button>
                  <button
                    onClick={() => approvePuzzle(p)}
                    disabled={saving === p.id + '-approve' || saving === p.id + '-reject'}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-success-green border border-success-green/30 bg-success-greenlite hover:bg-success-green/20 transition-colors disabled:opacity-60"
                  >
                    {saving === p.id + '-approve'
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <CheckCircle className="w-3 h-3" />
                    }
                    Approve
                  </button>
                  <button
                    onClick={() => rejectPuzzle(p)}
                    disabled={saving === p.id + '-approve' || saving === p.id + '-reject'}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-target-red border border-target-red/30 bg-target-redlite hover:bg-target-red/20 transition-colors disabled:opacity-60"
                  >
                    {saving === p.id + '-reject'
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <XCircle className="w-3 h-3" />
                    }
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <Th>Title / ID</Th>
              <Th>Source</Th>
              <Th>Tier</Th>
              <Th>Author</Th>
              <Th>Published</Th>
              <Th>Featured</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {/* Official puzzles */}
            {officialPuzzles.map((p) => (
              <tr key={p.puzzle_id} className={clsx('border-b border-slate-100 hover:bg-slate-50 transition-colors', editing?.id === p.puzzle_id && 'bg-brand-teallite', p.hidden && 'opacity-50')}>
                <td className="px-5 py-3">
                  <p className="font-medium text-brand-navy text-xs">{p.title}</p>
                  <p className="text-[10px] text-slate-mid font-mono">{p.puzzle_id}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-navy/10 border border-brand-navy/20 text-[10px] font-medium text-brand-navy w-fit">
                      {p.domain}
                    </span>
                    {p.override_id && !p.hidden && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gate-amberlite border border-gate-amber/30 text-[10px] font-medium text-gate-amberdk w-fit">
                        Overridden
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  {(() => {
                    const cfg = TIER_CONFIG[p.tier as keyof typeof TIER_CONFIG]
                    return (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: cfg?.bgColor, color: cfg?.color }}
                      >
                        T{p.tier} · {cfg?.label}
                      </span>
                    )
                  })()}
                </td>
                <td className="px-5 py-3 text-xs text-slate-mid">—</td>
                <td className="px-5 py-3">
                  {p.hidden ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-slate-100 border-slate-200 text-slate-mid">
                      <X className="w-3 h-3" /> Hidden
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-success-green/10 border-success-green/30 text-success-green">
                      <Globe className="w-3 h-3" /> Live
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-slate-mid">—</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!p.hidden && (
                      <button
                        onClick={() => openOfficialInBuilder(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-brand-navy border border-brand-navy/30 hover:bg-brand-navy/5 transition-colors"
                        title={p.override_id ? 'Edit override in visual builder' : 'Create override in visual builder'}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Edit in Builder
                      </button>
                    )}
                    {!p.hidden && (
                      <button
                        onClick={() => startEditOfficial(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-brand-teal border border-brand-teal/30 hover:bg-brand-teallite transition-colors"
                        title="Edit raw JSON"
                      >
                        <Edit2 className="w-3 h-3" />
                        JSON
                      </button>
                    )}
                    {p.hidden ? (
                      <button
                        onClick={() => restoreOfficialPuzzle(p)}
                        disabled={saving === p.puzzle_id + '-hide'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-success-green border border-success-green/30 hover:bg-success-greenlite transition-colors"
                      >
                        {saving === p.puzzle_id + '-hide' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteOfficialPuzzle(p)}
                        disabled={saving === p.puzzle_id + '-hide'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-target-red border border-target-red/30 hover:bg-target-redlite transition-colors"
                      >
                        {saving === p.puzzle_id + '-hide' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {/* Community puzzles */}
            {communityPuzzles.map((p) => (
              <tr key={p.id} className={clsx('border-b border-slate-100 hover:bg-slate-50 transition-colors', editing?.id === p.id && 'bg-brand-teallite')}>
                <td className="px-5 py-3">
                  <p className="font-medium text-brand-navy text-xs">{p.title}</p>
                  {p.puzzle_id
                    ? <p className="text-[10px] text-gate-amberdk font-mono">override of {p.puzzle_id}</p>
                    : <p className="text-[10px] text-slate-mid font-mono">{p.id.slice(0, 8)}…</p>
                  }
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-[10px] font-medium text-brand-tealdk w-fit">
                    Community
                  </span>
                </td>
                <td className="px-5 py-3">
                  <select
                    value={
                      ((p.data as Record<string, unknown>)?.meta as Record<string, unknown>)?.tier as number ?? 1
                    }
                    onChange={(e) => changeTier(p, Number(e.target.value))}
                    disabled={saving === p.id + '-tier'}
                    className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-teal/40 disabled:opacity-50"
                  >
                    {([1, 2, 3, 4, 5] as const).map((t) => (
                      <option key={t} value={t}>
                        T{t} · {TIER_CONFIG[t].label}
                      </option>
                    ))}
                  </select>
                  {saving === p.id + '-tier' && (
                    <Loader2 className="w-3 h-3 animate-spin text-brand-teal inline ml-1" />
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-slate">
                  {p.profiles?.username ?? p.profiles?.email ?? 'Unknown'}
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => togglePublished(p)}
                      disabled={saving === p.id}
                      className={clsx(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors w-fit',
                        p.published
                          ? 'bg-success-green/10 border-success-green/30 text-success-green hover:bg-success-green/20'
                          : 'bg-slate-100 border-slate-200 text-slate-mid hover:bg-slate-200',
                      )}
                    >
                      {saving === p.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : p.published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />
                      }
                      {p.published ? 'Live' : 'Draft'}
                    </button>
                    {p.status === 'pending_review' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gate-amberlite border border-gate-amber/30 text-[10px] font-medium text-gate-amberdk w-fit">
                        <Clock className="w-2.5 h-2.5" /> Pending
                      </span>
                    )}
                    {p.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-target-redlite border border-target-red/30 text-[10px] font-medium text-target-red w-fit">
                        <X className="w-2.5 h-2.5" /> Rejected
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleFeatured(p)}
                    disabled={saving === p.id + '-feat'}
                    className={clsx(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                      p.featured
                        ? 'bg-gate-amberlite border-gate-amber/40 text-gate-amberdk hover:bg-gate-amber/20'
                        : 'bg-slate-100 border-slate-200 text-slate-mid hover:bg-slate-200',
                    )}
                  >
                    {saving === p.id + '-feat'
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Star className={clsx('w-3 h-3', p.featured && 'fill-current')} />
                    }
                    {p.featured ? 'Featured' : 'Normal'}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => openInBuilder(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-brand-navy border border-brand-navy/30 hover:bg-brand-navy/5 transition-colors"
                      title="Open in visual puzzle builder"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Edit in Builder
                    </button>
                    <button
                      onClick={() => startEditCommunity(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-brand-teal border border-brand-teal/30 hover:bg-brand-teallite transition-colors"
                      title="Edit raw JSON"
                    >
                      <Edit2 className="w-3 h-3" />
                      JSON
                    </button>
                    <button
                      onClick={() => deletePuzzle(p)}
                      disabled={deleting === p.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-target-red border border-target-red/30 hover:bg-target-redlite transition-colors"
                    >
                      {deleting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {totalCount === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-mid">
                  No puzzles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Edit Puzzle Form ──────────────────────────────────────────────────────────

function EditPuzzleForm({
  editing,
  onDone,
  onCancel,
}: {
  editing: EditState
  onDone: () => void
  onCancel: () => void
}) {
  const [jsonText, setJsonText] = useState(editing.jsonText)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>
    } catch {
      setError('Invalid JSON — check syntax and try again.')
      return
    }

    const title = (parsed.meta as Record<string, unknown>)?.title as string | undefined
    if (!title) {
      setError('JSON must have a meta.title field.')
      return
    }

    setSaving(true)
    try {
      let url: string
      let method: string

      if (editing.type === 'official' && !editing.override_id) {
        // Create new override
        url = '/api/admin/puzzles'
        method = 'POST'
      } else {
        // Update existing: community puzzle or official override
        const targetId = editing.override_id ?? editing.id
        url = `/api/admin/puzzles/${targetId}`
        method = 'PATCH'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, data: parsed, published: true }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  const label = editing.type === 'official'
    ? `Editing official puzzle: ${editing.id}${editing.override_id ? ' (has override)' : ' — will create override'}`
    : `Editing community puzzle`

  return (
    <form onSubmit={handleSubmit} className="border-b border-slate-200 p-5 bg-slate-50 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-brand-navy">Edit Puzzle JSON</h3>
          <p className="text-[11px] text-slate-mid mt-0.5">{label}</p>
        </div>
        <button type="button" onClick={onCancel} className="text-xs text-slate-mid hover:text-slate transition-colors">
          Cancel
        </button>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider block mb-1.5">
          Puzzle JSON
        </label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={24}
          spellCheck={false}
          className="w-full font-mono text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 bg-white resize-y"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-target-red bg-target-redlite rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!jsonText.trim() || saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-brand-navydk transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-slate-mid hover:text-slate transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Upload Puzzle Form ────────────────────────────────────────────────────────

function UploadPuzzleForm({ onDone }: { onDone: () => void }) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setJsonText(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>
    } catch {
      setError('Invalid JSON — check syntax and try again.')
      return
    }

    const title = (parsed.meta as Record<string, unknown>)?.title as string | undefined
    if (!title) {
      setError('JSON must have meta.title field.')
      return
    }

    setSaving(true)
    const res = await fetch('/api/admin/puzzles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, data: parsed, published: true }),
    })
    const json = await res.json() as { error?: string }
    if (!res.ok) {
      setError(json.error ?? 'Upload failed')
      setSaving(false)
    } else {
      onDone()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-slate-200 p-5 bg-slate-50 space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-brand-navy">Upload Puzzle JSON</h3>
        <button type="button" onClick={onDone} className="ml-auto text-xs text-slate-mid hover:text-slate transition-colors">Cancel</button>
      </div>

      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Choose .json file
        </button>
        {jsonText && <span className="text-xs text-success-green">File loaded ({jsonText.length.toLocaleString()} chars)</span>}
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider block mb-1.5">
          Or paste JSON directly
        </label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={10}
          placeholder={'{\n  "id": "BL-COMMUNITY-001",\n  "meta": { "title": "My Puzzle", ... },\n  ...\n}'}
          className="w-full font-mono text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 bg-white resize-y"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-target-red bg-target-redlite rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!jsonText.trim() || saving}
        className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-brand-navydk transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {saving ? 'Uploading…' : 'Upload & publish'}
      </button>
    </form>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, highlight }: { label: string; value: number | string; icon: React.ElementType; highlight?: boolean }) {
  return (
    <div className={clsx(
      'rounded-xl border px-5 py-4',
      highlight ? 'bg-gate-amberlite border-gate-amber/40' : 'bg-white border-slate-200',
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={clsx('w-4 h-4', highlight ? 'text-gate-amberdk' : 'text-slate-mid')} />
        <span className={clsx('text-xs', highlight ? 'text-gate-amberdk font-medium' : 'text-slate-mid')}>{label}</span>
      </div>
      <p className={clsx('text-2xl font-semibold', highlight ? 'text-gate-amberdk' : 'text-brand-navy')}>{value}</p>
    </div>
  )
}

function Th({ children, sortable, onClick }: { children: React.ReactNode; sortable?: boolean; onClick?: () => void }) {
  return (
    <th
      className={clsx(
        'px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-mid',
        sortable && 'cursor-pointer hover:text-brand-navy select-none',
      )}
      onClick={onClick}
    >
      <span className="flex items-center gap-1">{children}</span>
    </th>
  )
}
