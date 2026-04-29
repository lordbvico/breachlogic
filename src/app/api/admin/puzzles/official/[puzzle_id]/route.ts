import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { PUZZLES } from '@/data/puzzles'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

/** Find the community_puzzles override row for an official puzzle by its data.id */
async function findOverride(db: ReturnType<typeof createAdminClient>, puzzle_id: string) {
  const { data } = await db
    .from('community_puzzles')
    .select('id, data')
    .filter('data->>id', 'eq', puzzle_id)
    .maybeSingle()
  return data ?? null
}

/** DELETE — hide an official puzzle (creates/updates hidden override) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ puzzle_id: string }> },
) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { puzzle_id } = await params
    const puzzle = PUZZLES.find((p) => p.id === puzzle_id)
    if (!puzzle) return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 })

    const db = createAdminClient()
    const existing = await findOverride(db, puzzle_id)

    if (existing) {
      // Update existing override to mark hidden
      const existingData = existing.data as Record<string, unknown>
      await db
        .from('community_puzzles')
        .update({ data: { ...existingData, _hidden: true }, published: false, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      // Create a minimal hidden override
      await db.from('community_puzzles').insert({
        author_id: admin.id,
        title: puzzle.meta.title,
        data: { _hidden: true, id: puzzle_id },
        published: false,
        featured: false,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/** PATCH { restore: true } — un-hide an official puzzle */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ puzzle_id: string }> },
) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { puzzle_id } = await params
    const body = await request.json() as { restore?: boolean }
    if (!body.restore) return NextResponse.json({ error: 'No action specified' }, { status: 400 })

    const db = createAdminClient()
    const existing = await findOverride(db, puzzle_id)
    if (!existing) return NextResponse.json({ error: 'No override found' }, { status: 404 })

    const existingData = existing.data as Record<string, unknown>
    const { _hidden: _removed, ...dataWithoutHidden } = existingData

    // If the override only contained the hidden sentinel (no real edits), delete it entirely
    const isOnlySentinel = Object.keys(dataWithoutHidden).length <= 1 // just `id`
    if (isOnlySentinel) {
      await db.from('community_puzzles').delete().eq('id', existing.id)
    } else {
      await db
        .from('community_puzzles')
        .update({ data: dataWithoutHidden, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
