import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from './auth'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock the API
vi.mock('../lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import api from '../lib/api'

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    })
  })

  it('has initial state', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('sets token', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setToken('test-token')
    })

    expect(result.current.token).toBe('test-token')
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token')
  })

  it('logs in user', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@example.com', username: 'john', email_verified_at: null, created_at: '2026-01-01', updated_at: '2026-01-01' }
    vi.mocked(api.post).mockResolvedValue({
      data: {
        user: mockUser,
        access_token: 'token-123',
      },
    })

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login({ login: 'john@example.com', password: 'password' })
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'token-123')
  })

  it('logs out user', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'Logged out' } })

    const { result } = renderHook(() => useAuthStore())

    // First set authenticated state
    act(() => {
      useAuthStore.setState({
        user: { id: 1, name: 'John', email: 'john@example.com', username: 'john', email_verified_at: null, created_at: '2026-01-01', updated_at: '2026-01-01' },
        token: 'token-123',
        isAuthenticated: true,
      })
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
  })

  it('fetches user profile', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@example.com', username: 'john', email_verified_at: null, created_at: '2026-01-01', updated_at: '2026-01-01' }
    vi.mocked(api.get).mockResolvedValue({ data: { data: mockUser } })

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.getProfile()
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('handles login error', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useAuthStore())

    await expect(
      act(async () => {
        await result.current.login({ login: 'wrong@example.com', password: 'wrong' })
      })
    ).rejects.toThrow('Invalid credentials')

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
