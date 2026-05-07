import Decimal from 'decimal.js'
import { useEffect, useMemo, useState } from 'react'
import { fetchExchangeRates, type RatesState } from './features/rates/rates'
import {
  CURRENCIES,
  CURRENCY_LABELS,
  convertCurrency,
  formatMoneyInput,
  formatMoney,
  formatPercent,
  formatPlainMoney,
  parseMoney,
  type Currency,
  type ExchangeRates,
} from './features/tax/money'
import {
  calculateTax,
  type TaxCalculation,
  type TaxRegime,
} from './features/tax/tax'

type Period = 'annual' | 'monthly'
type FieldKey = `${Period}:${Currency}`

const TAX_REGIMES: Array<{ id: TaxRegime; label: string }> = [
  { id: 'ndfl', label: 'НДФЛ РФ' },
  { id: 'usn-income', label: 'ИП 6%' },
]

const PERIODS: Array<{ id: Period; label: string; helper: string }> = [
  { id: 'annual', label: 'За год', helper: 'годовой доход до налогов' },
  { id: 'monthly', label: 'В месяц', helper: 'средний месяц до налогов' },
]

function App() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <main>
        <TaxPage />
      </main>
    </div>
  )
}

function TaxPage() {
  const [ratesState, setRatesState] = useState<RatesState>({
    status: 'loading',
    rates: null,
    date: null,
    error: null,
  })
  const [annualRubIncome, setAnnualRubIncome] = useState(new Decimal(3_600_000))
  const [activeField, setActiveField] = useState<FieldKey | null>(null)
  const [rawInput, setRawInput] = useState('')
  const [regime, setRegime] = useState<TaxRegime>('ndfl')

  const loadRates = async () => {
    setRatesState({ status: 'loading', rates: null, date: null, error: null })

    try {
      const { rates, date } = await fetchExchangeRates()
      setRatesState({ status: 'ready', rates, date, error: null })
    } catch (error) {
      setRatesState({
        status: 'error',
        rates: null,
        date: null,
        error: error instanceof Error ? error.message : 'Курсы не загрузились',
      })
    }
  }

  useEffect(() => {
    void loadRates()
  }, [])

  const calculation = useMemo(
    () => calculateTax(annualRubIncome, regime),
    [annualRubIncome, regime],
  )

  const rates = ratesState.rates

  const updateIncome = (
    period: Period,
    currency: Currency,
    value: string,
    currentRates: ExchangeRates | null,
  ) => {
    const key: FieldKey = `${period}:${currency}`
    const formattedValue = formatMoneyInput(value)

    setActiveField(key)
    setRawInput(formattedValue)

    const parsed = parseMoney(formattedValue)
    if (!parsed) {
      return
    }

    if (currency !== 'RUB' && !currentRates) {
      return
    }

    const periodAnnualValue =
      period === 'monthly' ? parsed.mul(12) : parsed
    const nextAnnualRub =
      currency === 'RUB'
        ? periodAnnualValue
        : convertCurrency(periodAnnualValue, currency, 'RUB', currentRates!)

    setAnnualRubIncome(nextAnnualRub)
  }

  const fieldValue = (
    period: Period,
    currency: Currency,
    currentRates: ExchangeRates | null,
  ) => {
    const key: FieldKey = `${period}:${currency}`
    if (activeField === key) {
      return rawInput
    }

    if (currency !== 'RUB' && !currentRates) {
      return ''
    }

    const annualValue =
      currency === 'RUB'
        ? annualRubIncome
        : convertCurrency(annualRubIncome, 'RUB', currency, currentRates!)
    const displayValue = period === 'monthly' ? annualValue.div(12) : annualValue

    return formatPlainMoney(displayValue)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Приложение
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
            Калькулятор налогов
          </h1>
        </div>
        <RatesStatus state={ratesState} onRefresh={loadRates} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold tracking-normal">
                Доход до налогов
              </h2>
              <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-1">
                {TAX_REGIMES.map((item) => (
                  <button
                    className={`h-9 rounded px-3 text-sm font-semibold transition ${
                      regime === item.id
                        ? 'bg-teal-700 text-white'
                        : 'text-zinc-600 hover:bg-white hover:text-zinc-950'
                    }`}
                    key={item.id}
                    onClick={() => setRegime(item.id)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-[10rem_repeat(3,minmax(0,1fr))] gap-3 border-b border-zinc-200 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  <span>Период</span>
                  {CURRENCIES.map((currency) => (
                    <span key={currency}>{CURRENCY_LABELS[currency]}</span>
                  ))}
                </div>
                <div className="space-y-3 pt-3">
                  {PERIODS.map((period) => (
                    <div
                      className="grid grid-cols-[10rem_repeat(3,minmax(0,1fr))] gap-3"
                      key={period.id}
                    >
                      <label className="flex flex-col justify-center">
                        <span className="font-semibold text-zinc-950">
                          {period.label}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {period.helper}
                        </span>
                      </label>
                      {CURRENCIES.map((currency) => (
                        <input
                          className="h-12 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition placeholder:text-zinc-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:bg-zinc-100 disabled:text-zinc-400"
                          disabled={currency !== 'RUB' && !rates}
                          inputMode="decimal"
                          key={`${period.id}:${currency}`}
                          onBlur={() => {
                            setActiveField(null)
                            setRawInput('')
                          }}
                          onChange={(event) =>
                            updateIncome(
                              period.id,
                              currency,
                              event.target.value,
                              rates,
                            )
                          }
                          placeholder={currency === 'RUB' ? '0' : 'курс'}
                          value={fieldValue(period.id, currency, rates)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <TaxExplanation calculation={calculation} />
        </div>

        <ResultPanel calculation={calculation} rates={rates} />
      </div>
    </section>
  )
}

function RatesStatus({
  onRefresh,
  state,
}: {
  onRefresh: () => void
  state: RatesState
}) {
  const text =
    state.status === 'ready'
      ? `Курс ЦБ: ${new Date(state.date).toLocaleDateString('ru-RU')}`
      : state.status === 'loading'
        ? 'Курс загружается'
        : state.error
  const ratesText =
    state.status === 'ready'
      ? `1 USD = ${formatExchangeRate(state.rates.USD)} · 1 EUR = ${formatExchangeRate(state.rates.EUR)}`
      : null

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            state.status === 'ready'
              ? 'bg-teal-600'
              : state.status === 'loading'
                ? 'bg-amber-500'
                : 'bg-red-500'
          }`}
        />
        <div className="min-w-0">
          <div className="truncate text-zinc-700">{text}</div>
          {ratesText ? (
            <div className="mt-0.5 whitespace-nowrap text-xs font-medium text-zinc-500">
              {ratesText}
            </div>
          ) : null}
        </div>
      </div>
      <button
        className="h-8 rounded-md border border-zinc-200 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:ml-auto"
        onClick={onRefresh}
        type="button"
      >
        Обновить
      </button>
    </div>
  )
}

function formatExchangeRate(value: Decimal): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value.toNumber())
}

function ResultPanel({
  calculation,
  rates,
}: {
  calculation: TaxCalculation
  rates: ExchangeRates | null
}) {
  return (
    <aside className="space-y-3">
      <MetricCard
        accent="teal"
        label="Чистый доход за год"
        rates={rates}
        value={calculation.netAnnualIncome}
      />
      <MetricCard
        accent="zinc"
        label="В среднем за месяц"
        rates={rates}
        value={calculation.netMonthlyIncome}
      />
      <MetricCard
        accent="amber"
        label="Налоги за год"
        rates={rates}
        value={calculation.tax}
      />
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm text-zinc-500">Эффективная ставка</div>
        <div className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
          {formatPercent(calculation.effectiveRate)}
        </div>
      </div>
    </aside>
  )
}

function MetricCard({
  accent,
  label,
  rates,
  value,
}: {
  accent: 'amber' | 'teal' | 'zinc'
  label: string
  rates: ExchangeRates | null
  value: Decimal
}) {
  const accentClass = {
    amber: 'border-amber-300',
    teal: 'border-teal-300',
    zinc: 'border-zinc-300',
  }[accent]

  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm ${accentClass}`}>
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
        {formatMoney(value, 'RUB')}
      </div>
      {rates ? (
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-500">
          <span>{formatMoney(convertCurrency(value, 'RUB', 'USD', rates), 'USD')}</span>
          <span>{formatMoney(convertCurrency(value, 'RUB', 'EUR', rates), 'EUR')}</span>
        </div>
      ) : null}
    </div>
  )
}

function TaxExplanation({ calculation }: { calculation: TaxCalculation }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold tracking-normal">Расчет налога</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <th className="py-3 pr-4 font-semibold">Диапазон</th>
              <th className="py-3 pr-4 font-semibold">База</th>
              <th className="py-3 pr-4 font-semibold">Ставка</th>
              <th className="py-3 font-semibold">Налог</th>
            </tr>
          </thead>
          <tbody>
            {calculation.rows.map((row) => (
              <tr className="border-b border-zinc-100" key={row.label}>
                <td className="py-3 pr-4 text-zinc-700">{row.label}</td>
                <td className="py-3 pr-4 text-zinc-950">
                  {formatMoney(row.taxableIncome, 'RUB')}
                </td>
                <td className="py-3 pr-4 text-zinc-950">
                  {formatPercent(row.rate)}
                </td>
                <td className="py-3 font-semibold text-zinc-950">
                  {formatMoney(row.tax, 'RUB')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 grid gap-2 text-sm leading-6 text-zinc-600">
        {calculation.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </section>
  )
}

export default App
