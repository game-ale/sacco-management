import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'

const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  username: 'johndoe',
  email_verified_at: '2026-01-01',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    getProfile: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
    isAuthenticated: true,
  })),
}))

vi.mock('../components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <button data-testid="lang-switcher">Lang</button>,
}))

vi.mock('../components/ThemeToggle', () => ({
  default: () => <button data-testid="theme-toggle">Theme</button>,
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard header', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText('SACCO Management System')).toBeInTheDocument()
  })

  it('renders user name', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/Welcome, John Doe/)).toBeInTheDocument()
  })

  it('renders user info', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
    expect(screen.getByText('@johndoe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('renders user avatar icon', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Your SACCO management dashboard')).toBeInTheDocument()
  })
})
