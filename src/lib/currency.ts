export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRate {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CacheEntry extends ExchangeRate {
  fetchedAt: number;
}

let currenciesCache: Currency[] | null = null;
const exchangeRatesCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 1000 * 60 * 60;

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
const MAX_CURRENCIES = 500;
const MAX_RATE_VALUE = 1e9;

function isValidCurrencyCode(code: unknown): code is string {
  return typeof code === "string" && CURRENCY_CODE_PATTERN.test(code);
}

function isValidCurrencyName(name: unknown): name is string {
  return typeof name === "string" && name.length > 0 && name.length < 100;
}

function isValidRate(rate: unknown): rate is number {
  return (
    typeof rate === "number" &&
    isFinite(rate) &&
    rate > 0 &&
    rate < MAX_RATE_VALUE
  );
}

function validateCurrenciesResponse(data: unknown): Currency[] {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format");
  }

  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length > MAX_CURRENCIES) {
    throw new Error("Response contains too many currencies");
  }

  const currencies: Currency[] = [];
  for (const [code, name] of entries) {
    if (isValidCurrencyCode(code) && isValidCurrencyName(name)) {
      currencies.push({ code, name });
    }
  }

  if (currencies.length === 0) {
    throw new Error("No valid currencies found in response");
  }

  return currencies;
}

function validateExchangeRateResponse(
  data: unknown,
  expectedTo: string
): number {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid exchange rate response format");
  }

  const response = data as Record<string, unknown>;

  if (typeof response.amount !== "number" || response.amount !== 1) {
    throw new Error("Invalid amount in response");
  }

  if (!isValidCurrencyCode(response.base)) {
    throw new Error("Invalid base currency in response");
  }

  if (typeof response.date !== "string") {
    throw new Error("Invalid date in response");
  }

  const rates = response.rates;
  if (!rates || typeof rates !== "object") {
    throw new Error("Missing rates in response");
  }

  const rateValue = (rates as Record<string, unknown>)[expectedTo];
  if (!isValidRate(rateValue)) {
    throw new Error(`Invalid rate for ${expectedTo}`);
  }

  return rateValue;
}

export async function getAvailableCurrencies(): Promise<Currency[]> {
  if (currenciesCache) {
    return currenciesCache;
  }

  try {
    const response = await fetch("https://api.frankfurter.dev/v1/currencies");
    if (!response.ok) {
      throw new Error("Failed to fetch currencies");
    }
    const data = await response.json();
    currenciesCache = validateCurrenciesResponse(data);
    return currenciesCache;
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return [{ code: "USD", name: "United States Dollar" }];
  }
}

export async function getExchangeRate(
  from: string,
  to: string
): Promise<number> {
  if (from === to) {
    return 1;
  }

  const cacheKey = `${from}-${to}`;
  const cached = exchangeRatesCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
    return cached.rates[to];
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?amount=1&from=${from}&to=${to}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }
    const data = await response.json();
    const rate = validateExchangeRateResponse(data, to);

    const exchangeRate: ExchangeRate = {
      amount: 1,
      base: from,
      date: new Date().toISOString().split("T")[0],
      rates: { [to]: rate }
    };
    exchangeRatesCache.set(cacheKey, {
      ...exchangeRate,
      fetchedAt: Date.now()
    });
    return rate;
  } catch (error) {
    throw new Error(
      `Failed to get exchange rate from ${from} to ${to}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function convertAmount(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) {
    return amount;
  }

  const rate = await getExchangeRate(from, to);
  return amount * rate;
}

export async function convertCurrencyAmounts<T extends Record<string, number>>(
  amounts: T,
  from: string,
  to: string
): Promise<T> {
  if (from === to) {
    return amounts;
  }

  const rate = await getExchangeRate(from, to);
  const result: Record<string, number> = {};

  for (const [key, value] of Object.entries(amounts)) {
    result[key] = value * rate;
  }

  return result as T;
}
