import Decimal from 'decimal.js'

export type TaxRegime = 'ndfl' | 'usn-income'

export type TaxBracketResult = {
  label: string
  taxableIncome: Decimal
  rate: Decimal
  tax: Decimal
}

export type TaxCalculation = {
  regime: TaxRegime
  grossAnnualIncome: Decimal
  tax: Decimal
  netAnnualIncome: Decimal
  netMonthlyIncome: Decimal
  effectiveRate: Decimal
  rows: TaxBracketResult[]
  notes: string[]
}

type TaxBracket = {
  from: Decimal
  to: Decimal | null
  rate: Decimal
  label: string
}

const ZERO = new Decimal(0)

export const NDFL_BRACKETS_2025: TaxBracket[] = [
  {
    from: new Decimal(0),
    to: new Decimal(2_400_000),
    rate: new Decimal(0.13),
    label: 'до 2,4 млн ₽',
  },
  {
    from: new Decimal(2_400_000),
    to: new Decimal(5_000_000),
    rate: new Decimal(0.15),
    label: 'свыше 2,4 до 5 млн ₽',
  },
  {
    from: new Decimal(5_000_000),
    to: new Decimal(20_000_000),
    rate: new Decimal(0.18),
    label: 'свыше 5 до 20 млн ₽',
  },
  {
    from: new Decimal(20_000_000),
    to: new Decimal(50_000_000),
    rate: new Decimal(0.2),
    label: 'свыше 20 до 50 млн ₽',
  },
  {
    from: new Decimal(50_000_000),
    to: null,
    rate: new Decimal(0.22),
    label: 'свыше 50 млн ₽',
  },
]

export function calculateTax(
  grossAnnualIncome: Decimal,
  regime: TaxRegime,
): TaxCalculation {
  const income = Decimal.max(grossAnnualIncome, ZERO)

  if (regime === 'usn-income') {
    return calculateUsnIncomeTax(income)
  }

  return calculateNdflTax(income)
}

export function calculateNdflTax(grossAnnualIncome: Decimal): TaxCalculation {
  const income = Decimal.max(grossAnnualIncome, ZERO)
  const rows = NDFL_BRACKETS_2025.map((bracket) => {
    const upper = bracket.to ?? income
    const taxableIncome = Decimal.max(
      Decimal.min(income, upper).minus(bracket.from),
      ZERO,
    )
    const tax = taxableIncome.mul(bracket.rate)

    return {
      label: bracket.label,
      taxableIncome,
      rate: bracket.rate,
      tax,
    }
  }).filter((row) => row.taxableIncome.gt(0))

  const tax = rows.reduce((sum, row) => sum.plus(row.tax), ZERO)
  const netAnnualIncome = income.minus(tax)

  return {
    regime: 'ndfl',
    grossAnnualIncome: income,
    tax,
    netAnnualIncome,
    netMonthlyIncome: netAnnualIncome.div(12),
    effectiveRate: income.gt(0) ? tax.div(income) : ZERO,
    rows,
    notes: [
      'Расчет для налогового резидента РФ и основной налоговой базы.',
      'Повышенные ставки применяются только к части дохода выше порога.',
      'Вычеты, льготы и особые категории доходов не учитываются.',
    ],
  }
}

export function calculateUsnIncomeTax(grossAnnualIncome: Decimal): TaxCalculation {
  const income = Decimal.max(grossAnnualIncome, ZERO)
  const rate = new Decimal(0.06)
  const tax = income.mul(rate)
  const netAnnualIncome = income.minus(tax)

  return {
    regime: 'usn-income',
    grossAnnualIncome: income,
    tax,
    netAnnualIncome,
    netMonthlyIncome: netAnnualIncome.div(12),
    effectiveRate: income.gt(0) ? tax.div(income) : ZERO,
    rows: [
      {
        label: 'УСН "Доходы"',
        taxableIncome: income,
        rate,
        tax,
      },
    ],
    notes: [
      'Расчет для УСН с объектом "Доходы" и базовой ставкой 6%.',
      'Страховые взносы ИП, региональные ставки, лимиты и НДС не учитываются.',
      'Фактический налог может быть ниже или выше из-за условий конкретного ИП.',
    ],
  }
}
