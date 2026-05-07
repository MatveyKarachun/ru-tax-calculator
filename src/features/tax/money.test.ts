import { describe, expect, it } from 'vitest'
import { formatMoneyInput } from './money'

describe('formatMoneyInput', () => {
  it('adds group separators while typing integer values', () => {
    expect(formatMoneyInput('1000')).toBe('1 000')
    expect(formatMoneyInput('1234567')).toBe('1 234 567')
    expect(formatMoneyInput('1 234 567')).toBe('1 234 567')
  })

  it('keeps decimal input editable', () => {
    expect(formatMoneyInput('1234,')).toBe('1 234,')
    expect(formatMoneyInput('1234,56')).toBe('1 234,56')
    expect(formatMoneyInput('1234.56')).toBe('1 234,56')
  })
})
