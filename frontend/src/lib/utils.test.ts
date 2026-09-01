import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('p-4', 'bg-red-500')
    expect(result).toBe('p-4 bg-red-500')
  })

  it('handles conditional classes', () => {
    const isTrue = false;
    const result = cn('p-4', isTrue && 'bg-red-500', 'text-white')
    expect(result).toBe('p-4 text-white')
  })

  it('handles undefined and null', () => {
    const result = cn('p-4', undefined, null, 'text-white')
    expect(result).toBe('p-4 text-white')
  })

  it('deduplicates Tailwind classes', () => {
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })

  it('handles empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })
})
