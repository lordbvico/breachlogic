import { notFound } from 'next/navigation'
import { getPuzzleById, PUZZLES } from '@/data/puzzles'
import { createClient } from '@/lib/supabase/server'
import PuzzleCanvas from '@/components/puzzle/PuzzleCanvas'
import type { Metadata } from 'next'
import type { Puzzle } from '@/types/puzzle'

export const revalidate = 60

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return PUZZLES.map((p) => ({ id: p.id }))
}

async function resolvePuzzle(id: string): Promise<Puzzle | null> {
  try {
    const supabase = await createClient()
    const { data: rows } = await supabase
      .from('community_puzzles')
      .select('data')
      .eq('published', true)
      .filter('data->>id', 'eq', id)
      .order('updated_at', { ascending: false })
      .limit(1)
    if (rows?.[0]?.data) return rows[0].data as unknown as Puzzle
  } catch { /* fall through to built-in */ }
  return getPuzzleById(id) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const puzzle = await resolvePuzzle(id)
  if (!puzzle) return { title: 'Puzzle not found' }
  return {
    title: `${puzzle.meta.title} — BreachLogic`,
    description: puzzle.narrative.scenario,
  }
}

export default async function PuzzlePage({ params }: Props) {
  const { id } = await params
  const puzzle = await resolvePuzzle(id)
  if (!puzzle) return notFound()

  return (
    <div
      className="-mx-4 -mt-6 -mb-6"
      style={{ height: 'calc(100vh - 3.5rem)' }}
    >
      <div className="h-full rounded-none border-0 overflow-hidden">
        <PuzzleCanvas puzzle={puzzle} />
      </div>
    </div>
  )
}
