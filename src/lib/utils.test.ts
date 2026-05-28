import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('p-2', 'text-sm', 'p-4')).toBe('text-sm p-4')
  })

  it('supports conditional classes from clsx input patterns', () => {
    expect(cn('base', { hidden: false, block: true }, ['mx-2', null, undefined])).toBe('base block mx-2')
  })
})
