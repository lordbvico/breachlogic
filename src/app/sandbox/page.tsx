import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PuzzleBuilder from '@/components/sandbox/PuzzleBuilder'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sandbox — BreachLogic',
  description: 'Build your own logic puzzles with the BreachLogic puzzle builder.',
}

export default async function SandboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    // Escape root layout padding — same technique as puzzle canvas
    <div className="-mx-4 -mt-6 -mb-6" style={{ height: 'calc(100vh - 3.5rem)' }}>
      <div className="h-full overflow-hidden">
        <PuzzleBuilder userId={user.id} />
      </div>
    </div>
  )
}
