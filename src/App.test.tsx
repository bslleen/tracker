import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('shows the sign-in screen at / when signed out', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Continue with Google')).toBeInTheDocument()
  })

  it('renders the dashboard in demo mode, with no auth required', async () => {
    sessionStorage.setItem('chunks:demo-mode', 'true')
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })
})
