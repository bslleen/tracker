import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Goal } from '@/data/types'
import { TooltipProvider } from '@/components/ui'
import { GoalCard } from './GoalCard'

const goal: Goal = {
  id: 'goal-1',
  name: 'French',
  month: '2026-10',
  totalMinutes: 2400,
  chunkMinutes: 15,
  completedChunks: 50,
  carryMinutes: 5,
  status: 'active',
  hue: 12,
  createdAt: {} as Goal['createdAt'],
  updatedAt: {} as Goal['updatedAt'],
}

describe('GoalCard', () => {
  it('renders the goal name, progress, and a link to the detail page', () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <GoalCard goal={goal} />
        </TooltipProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('French')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/goals/goal-1')
    // 50 chunks of 160 (2400/15) = 31.25%, rounds to 31.
    expect(screen.getByText('31%')).toBeInTheDocument()
  })
})
