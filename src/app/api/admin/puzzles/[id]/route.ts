import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json() as {
      title?: string
      data?: unknown
      published?: boolean
      featured?: boolean
    }
    const updates: { title?: string; data?: unknown; published?: boolean; featured?: boolean; updated_at: string } = {
      updated_at: new Date().toISOString(),
    }
    if (body.title !== undefined) updates.title = body.title
    if (body.data !== undefined) updates.data = body.data
    if (body.published !== undefined) updates.published = body.published
    if (body.featured !== undefined) updates.featured = body.featured

    const db = createAdminClient()
    const { error } = await db.from('community_puzzles').update(updates).eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const db = createAdminClient()
    const { error } = await db.from('community_puzzles').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
