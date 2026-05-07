import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { calculateNdflTax, calculateUsnIncomeTax } from './tax'

describe('calculateNdflTax', () => {
  it('uses 13 percent up to 2.4 million rubles', () => {
    const result = calculateNdflTax(new Decimal(2_400_000))

    expect(result.tax.toNumber()).toBe(312_000)
    expect(result.netAnnualIncome.toNumber()).toBe(2_088_000)
  })

  it('taxes only the excess amount at higher rates', () => {
    const result = calculateNdflTax(new Decimal(6_000_000))

    expect(result.tax.toNumber()).toBe(882_000)
    expect(result.rows.map((row) => row.tax.toNumber())).toEqual([
      312_000,
      390_000,
      180_000,
    ])
  })

  it('handles income above 50 million rubles', () => {
    const result = calculateNdflTax(new Decimal(60_000_000))

    expect(result.tax.toNumber()).toBe(11_602_000)
  })
})

describe('calculateUsnIncomeTax', () => {
  it('uses 6 percent from income', () => {
    const result = calculateUsnIncomeTax(new Decimal(1_000_000))

    expect(result.tax.toNumber()).toBe(60_000)
    expect(result.netAnnualIncome.toNumber()).toBe(940_000)
  })
})
