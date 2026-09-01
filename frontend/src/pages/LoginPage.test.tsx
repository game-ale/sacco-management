import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './LoginPage'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn(),
    isLoading: false,
    isAuthenticated: false,
  })),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    render(<LoginPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText(/sign in to your sacco account/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('name@sacco.org')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders sign up link', () => {
    render(<LoginPage />, { wrapper: createWrapper() })

    expect(screen.getByText(/don't have a sacco/i)).toBeInTheDocument()
    expect(screen.getByText('Register here')).toHaveAttribute('href', '/register')
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()

    render(<LoginPage />, { wrapper: createWrapper() })

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Email or username is required')).toBeInTheDocument()
    expect(await screen.findByText('Password is required')).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn().mockResolvedValue(undefined)

    const { useAuthStore } = await import('../stores/auth')
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      logout: vi.fn(),
      getProfile: vi.fn(),
      register: vi.fn(),
      setToken: vi.fn(),
    })

    render(<LoginPage />, { wrapper: createWrapper() })

    await user.type(screen.getByPlaceholderText('name@sacco.org'), 'john@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockLogin).toHaveBeenCalledWith({
      login: 'john@example.com',
      password: 'password123',
    })
  })

  it('shows loading state', async () => {
    const { useAuthStore } = await import('../stores/auth')
    vi.mocked(useAuthStore).mockReturnValue({
      login: vi.fn(),
      isLoading: true,
      isAuthenticated: false,
      user: null,
      token: null,
      logout: vi.fn(),
      getProfile: vi.fn(),
      register: vi.fn(),
      setToken: vi.fn(),
    })

    render(<LoginPage />, { wrapper: createWrapper() })

    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled()
  })
})
