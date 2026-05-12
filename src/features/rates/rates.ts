import Decimal from 'decimal.js'
import type { ExchangeRates } from '../tax/money'

const RATES_URL = 'https://www.cbr-xml-daily.ru/daily_json.js'
const RATES_CACHE_KEY = 'ru-tax-calculator:exchange-rates:v1'

type CbrDailyResponse = {
  Date: string
  PreviousDate: string
  Valute: {
    USD: { Value: number; Previous: number }
    EUR: { Value: number; Previous: number }
  }
}

export type RatesState =
  | { status: 'loading'; rates: null; date: null; error: null }
  | {
      status: 'ready'
      rates: ExchangeRates
      date: string
      source: 'network' | 'cache'
      error: null
    }
  | { status: 'error'; rates: null; date: null; error: string }

export async function fetchExchangeRates(): Promise<{
  rates: ExchangeRates
  date: string
}> {
  const response = await fetch(RATES_URL, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Не удалось загрузить курсы: ${response.status}`)
  }

  const data = (await response.json()) as CbrDailyResponse
  const result = {
    rates: {
      RUB: new Decimal(1),
      USD: new Decimal(data.Valute.USD.Value),
      EUR: new Decimal(data.Valute.EUR.Value),
    },
    date: data.Date,
  }

  saveCachedExchangeRates(result.rates, result.date)

  return result
}

export function loadCachedExchangeRates(): {
  rates: ExchangeRates
  date: string
} | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(RATES_CACHE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const cached = JSON.parse(rawValue) as {
      date?: unknown
      USD?: unknown
      EUR?: unknown
    }

    if (
      typeof cached.date !== 'string' ||
      typeof cached.USD !== 'string' ||
      typeof cached.EUR !== 'string'
    ) {
      return null
    }

    return {
      rates: {
        RUB: new Decimal(1),
        USD: new Decimal(cached.USD),
        EUR: new Decimal(cached.EUR),
      },
      date: cached.date,
    }
  } catch {
    return null
  }
}

function saveCachedExchangeRates(rates: ExchangeRates, date: string) {
  if (typeof window === 'undefined') {
    return
  }

  const cacheValue = {
    date,
    USD: rates.USD.toString(),
    EUR: rates.EUR.toString(),
  }

  window.localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cacheValue))
}
