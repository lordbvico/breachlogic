import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminPortal from './AdminPortal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — BreachLogic',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, username, email')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/home')

  return <AdminPortal adminEmail={profile.email ?? user.email ?? ''} />
}
