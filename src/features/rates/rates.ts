import Decimal from 'decimal.js'
import type { ExchangeRates } from '../tax/money'

const RATES_URL = 'https://www.cbr-xml-daily.ru/daily_json.js'

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
  | { status: 'ready'; rates: ExchangeRates; date: string; error: null }
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

  return {
    rates: {
      RUB: new Decimal(1),
      USD: new Decimal(data.Valute.USD.Value),
      EUR: new Decimal(data.Valute.EUR.Value),
    },
    date: data.Date,
  }
}
