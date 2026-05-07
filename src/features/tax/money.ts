import Decimal from 'decimal.js'

export type Currency = 'RUB' | 'USD' | 'EUR'

export type ExchangeRates = Record<Currency, Decimal>

export const CURRENCIES: Currency[] = ['RUB', 'USD', 'EUR']

export const CURRENCY_LABELS: Record<Currency, string> = {
  RUB: 'RUB',
  USD: 'USD',
  EUR: 'EUR',
}

export const CURRENCY_NAMES: Record<Currency, string> = {
  RUB: 'рубли',
  USD: 'доллары',
  EUR: 'евро',
}

export const ZERO = new Decimal(0)

export function parseMoney(value: string): Decimal | null {
  const normalized = value.replace(/\s/g, '').replace(',', '.')

  if (normalized.trim() === '') {
    return ZERO
  }

  if (!/^\d*(\.\d*)?$/.test(normalized)) {
    return null
  }

  return new Decimal(normalized || 0)
}

export function roundMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

export function convertCurrency(
  amount: Decimal,
  from: Currency,
  to: Currency,
  rates: ExchangeRates,
): Decimal {
  return amount.mul(rates[from]).div(rates[to])
}

export function formatMoney(value: Decimal, currency: Currency): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(roundMoney(value).toNumber())
}

export function formatPlainMoney(value: Decimal): string {
  if (value.isZero()) {
    return ''
  }

  const [integerPart, fractionPart = ''] = roundMoney(value).toFixed(2).split('.')
  const groupedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  if (!fractionPart || fractionPart === '00') {
    return groupedIntegerPart
  }

  return `${groupedIntegerPart},${fractionPart}`
}

export function formatMoneyInput(value: string): string {
  const normalized = value.replace(/\s/g, '').replace('.', ',')

  if (normalized === '') {
    return ''
  }

  if (!/^\d*(,\d*)?$/.test(normalized)) {
    return value
  }

  const [integerPart, fractionPart] = normalized.split(',')
  const groupedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  if (fractionPart === undefined) {
    return groupedIntegerPart
  }

  return `${groupedIntegerPart},${fractionPart}`
}

export function formatPercent(value: Decimal): string {
  return `${value.mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()}%`
}
