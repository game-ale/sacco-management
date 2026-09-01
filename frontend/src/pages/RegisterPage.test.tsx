import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from './RegisterPage'

vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    register: vi.fn(),
    isLoading: false,
    isAuthenticated: false,
  })),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration form', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Register Your SACCO')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Awash Cooperative')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('info@sacco.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('911 234 567')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Abebe Kebede')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin@sacco.com')).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText('••••••••').length).toBe(2)
    expect(screen.getByRole('button', { name: /Register SACCO/i })).toBeInTheDocument()
  })

  it('renders login link', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/Already registered\?/i)).toBeInTheDocument()
    expect(screen.getByText('Log in here')).toHaveAttribute('href', '/login')
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Register SACCO/i }))

    expect(await screen.findByText('SACCO name is required')).toBeInTheDocument()
    expect(await screen.findByText('Phone number is required')).toBeInTheDocument()
    expect(await screen.findByText('auth.nameRequired')).toBeInTheDocument()
    expect(await screen.findByText('Invalid admin email')).toBeInTheDocument()
    expect(await screen.findByText('auth.passwordMin')).toBeInTheDocument()
  })

  it('validates password minimum length', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInputs[0], 'short')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Register SACCO/i }))

    expect(await screen.findByText('auth.passwordMin')).toBeInTheDocument()
  })

  it('validates password confirmation', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInputs[0], 'password123')
    await user.type(passwordInputs[1], 'different')
    
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Register SACCO/i }))

    expect(await screen.findByText('auth.passwordMatch')).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockRegister = vi.fn().mockResolvedValue(undefined)

    const { useAuthStore } = await import('../stores/auth')
    vi.mocked(useAuthStore).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      getProfile: vi.fn(),
      setToken: vi.fn(),
    })

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText('e.g. Awash Cooperative'), 'Test SACCO')
    await user.type(screen.getByPlaceholderText('info@sacco.com'), 'info@test.com')
    await user.type(screen.getByPlaceholderText('911 234 567'), '911234567')
    await user.type(screen.getByPlaceholderText('Sub-city, Woreda, Building Name'), 'Test Address')
    
    await user.type(screen.getByPlaceholderText('Abebe Kebede'), 'Test Admin')
    await user.type(screen.getByPlaceholderText('admin@sacco.com'), 'admin@test.com')
    await user.type(screen.getByPlaceholderText('e.g. 1234567890'), '1234567890')
    await user.type(screen.getByPlaceholderText('e.g. Oromia'), 'Oromia')
    await user.type(screen.getByPlaceholderText('e.g. Shewa'), 'East Shewa')
    await user.type(screen.getByPlaceholderText('e.g. Adama'), 'Adama')
    
    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    await user.type(passwordInputs[0], 'password123')
    await user.type(passwordInputs[1], 'password123')
    
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Register SACCO/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled()
      
      const callArgs = mockRegister.mock.calls[0][0]
      expect(callArgs.sacco_name).toBe('Test SACCO')
      expect(callArgs.admin_name).toBe('Test Admin')
      expect(callArgs.admin_email).toBe('admin@test.com')
      expect(callArgs.password).toBe('password123')
      expect(callArgs.password_confirmation).toBe('password123')
      expect(callArgs.registration_number).toMatch(/^FCA-\d{6}$/)
      expect(callArgs.admin_username).toMatch(/^admin\d+$/)
    })
  })
})
