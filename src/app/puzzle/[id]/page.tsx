import { notFound } from 'next/navigation'
import { getPuzzleById, PUZZLES } from '@/data/puzzles'
import PuzzleCanvas from '@/components/puzzle/PuzzleCanvas'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return PUZZLES.map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const puzzle = getPuzzleById(id)
  if (!puzzle) return { title: 'Puzzle not found' }
  return {
    title: `${puzzle.meta.title} — BreachLogic`,
    description: puzzle.narrative.scenario,
  }
}

export default async function PuzzlePage({ params }: Props) {
  const { id } = await params
  const puzzle = getPuzzleById(id)
  if (!puzzle) return notFound()

  return (
    // Escape the root layout's px-4 py-6 padding so the canvas fills the viewport
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
