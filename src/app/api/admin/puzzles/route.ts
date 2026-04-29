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

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const db = createAdminClient()
    const { data: communityData, error } = await db
      .from('community_puzzles')
      .select('id, title, published, featured, status, created_at, updated_at, author_id, data, profiles!author_id(username, email)')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Build override map: built-in puzzle_id -> community UUID
    const overrideMap = new Map<string, string>()
    for (const c of communityData ?? []) {
      const pId = (c.data as Record<string, unknown>)?.id as string | undefined
      if (pId) overrideMap.set(pId, c.id)
    }

    const official = PUZZLES.map((p) => {
      const ovId = overrideMap.get(p.id) ?? null
      const overrideRecord = ovId ? (communityData ?? []).find((c) => c.id === ovId) : null
      const hidden = overrideRecord
        ? (overrideRecord.data as Record<string, unknown>)?._hidden === true
        : false
      return {
        source: 'official' as const,
        puzzle_id: p.id,
        title: p.meta.title,
        tier: p.meta.tier,
        domain: p.meta.domain,
        data: overrideRecord ? overrideRecord.data : p,
        override_id: ovId,
        hidden,
      }
    })

    // Exclude hidden-sentinel rows from the community list (they're only for suppressing official puzzles)
    const community = (communityData ?? [])
      .filter((c) => (c.data as Record<string, unknown>)?._hidden !== true)
      .map((c) => ({
        source: 'community' as const,
        id: c.id,
        puzzle_id: (c.data as Record<string, unknown>)?.id as string | null ?? null,
        title: c.title,
        published: c.published,
        featured: c.featured,
        status: c.status ?? 'draft',
        created_at: c.created_at,
        updated_at: c.updated_at,
        author_id: c.author_id,
        profiles: c.profiles as unknown as { username: string | null; email: string | null } | null,
        data: c.data,
      }))

    return NextResponse.json({ official, community })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json() as { title: string; data: unknown; published?: boolean; featured?: boolean }
    if (!body.title || !body.data) {
      return NextResponse.json({ error: 'title and data are required' }, { status: 400 })
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('community_puzzles')
      .insert({
        author_id: admin.id,
        title: body.title,
        data: body.data,
        published: body.published ?? true,
        featured: body.featured ?? false,
      })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ id: data.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
