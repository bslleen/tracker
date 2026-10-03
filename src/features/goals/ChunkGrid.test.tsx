import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChunkGrid } from './ChunkGrid'

describe('ChunkGrid', () => {
  it('renders the DOM grid and its aria-label', () => {
    render(<ChunkGrid total={48} completed={12} chunkMinutes={15} label="French" />)
    expect(screen.getByRole('img', { name: 'French: 12 of 48 chunks completed' })).toBeInTheDocument()
  })

  it('renders as an interactive grid with gridcells when interactive', () => {
    render(<ChunkGrid total={10} completed={3} chunkMinutes={15} interactive />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell')).toHaveLength(10)
  })

  it('renders the simplified mini variant for size="sm"', () => {
    render(<ChunkGrid total={20} completed={5} chunkMinutes={15} size="sm" />)
    expect(screen.getByRole('img', { name: '5 of 20 chunks completed' })).toBeInTheDocument()
  })

  it('switches to the canvas renderer above the DOM threshold', () => {
    const { container } = render(<ChunkGrid total={2000} completed={100} chunkMinutes={15} />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(container.querySelectorAll('[role="gridcell"]')).toHaveLength(0)
  })
})
