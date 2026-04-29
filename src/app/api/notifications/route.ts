import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get('unread') === 'true'

    let query = supabase
      .from('notifications')
      .select('id, type, message, puzzle_id, puzzle_title, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ notifications: data ?? [] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
