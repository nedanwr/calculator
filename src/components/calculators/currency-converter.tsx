import { ArrowRightLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { getExchangeRate } from "~/lib/currency";
import { formatCurrencyPrecise } from "~/lib/format";
import { CurrencySelector } from "~/components/currency-selector";
import { InputField } from "~/components/input-field";

interface ConversionResult {
  convertedAmount: number;
  rate: number;
  isLoading: boolean;
  error: string | null;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [amount, setAmount] = useState(100);
  const [result, setResult] = useState<ConversionResult>({
    convertedAmount: 0,
    rate: 1,
    isLoading: true,
    error: null
  });
  const requestIdRef = useRef(0);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const performConversion = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setResult((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const rate = await getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = rate * amount;

      if (currentRequestId === requestIdRef.current) {
        setResult({
          convertedAmount,
          rate,
          isLoading: false,
          error: null
        });
      }
    } catch {
      if (currentRequestId === requestIdRef.current) {
        setResult((prev) => ({
          ...prev,
          convertedAmount: 0,
          rate: 1,
          isLoading: false,
          error: "Failed to get exchange rate"
        }));
      }
    }
  }, [amount, fromCurrency, toCurrency]);

  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performConversion();
    }, 100);
    return () => clearTimeout(timer);
  }, [performConversion]);

  useEffect(() => {
    if (!result.isLoading && !result.error && liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      setTimeout(() => {
        if (liveRegionRef.current) {
          const message = `${formatMoney(amount, fromCurrency)} equals ${formatMoney(result.convertedAmount, toCurrency)} at rate ${result.rate.toFixed(4)}`;
          liveRegionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [
    result.convertedAmount,
    result.rate,
    result.isLoading,
    result.error,
    amount,
    fromCurrency,
    toCurrency
  ]);

  const canSwap = fromCurrency !== toCurrency;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <h2 className="text-charcoal font-serif text-xl">Currency Converter</h2>

      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-3">
          <label className="text-slate mb-1.5 block text-xs font-medium tracking-wide whitespace-nowrap uppercase">
            From
          </label>
          <CurrencySelector
            selectedCurrency={fromCurrency}
            onCurrencyChange={setFromCurrency}
            hideLabel
          />
          <InputField
            label="Amount"
            value={amount}
            onChange={setAmount}
            min={0}
            max={1000000000}
            decimals={2}
          />
        </div>

        {canSwap && (
          <button
            onClick={swapCurrencies}
            className="bg-terracotta text-ivory hover:bg-charcoal mt-8 shrink-0 rounded-lg p-2 transition-all"
            aria-label="Swap currencies"
          >
            <ArrowRightLeft size={16} />
          </button>
        )}

        <div className="flex-1 space-y-3">
          <label className="text-slate mb-1.5 block text-xs font-medium tracking-wide whitespace-nowrap uppercase">
            To
          </label>
          <CurrencySelector
            selectedCurrency={toCurrency}
            onCurrencyChange={setToCurrency}
            hideLabel
          />
        </div>
      </div>

      {result.isLoading && (
        <div className="bg-cream rounded-xl p-6 text-center">
          <p className="text-slate">Converting...</p>
        </div>
      )}

      {result.error && (
        <div className="bg-terracotta/10 border-terracotta/30 rounded-xl border p-6 text-center">
          <p className="text-terracotta">{result.error}</p>
        </div>
      )}

      {!result.isLoading && !result.error && (
        <div className="bg-terracotta rounded-2xl p-6">
          <p className="text-ivory/70 mb-2 text-xs tracking-wide uppercase">
            Converted Amount
          </p>
          <p className="text-ivory mb-2 font-serif text-4xl">
            {formatCurrencyPrecise(result.convertedAmount, toCurrency)}
          </p>
          <p className="text-ivory/80 text-sm">
            1 {fromCurrency} = {formatCurrencyPrecise(result.rate, toCurrency)}
          </p>
        </div>
      )}

      {!result.isLoading && !result.error && (
        <div className="bg-cream rounded-xl p-4">
          <h3 className="text-charcoal mb-2 text-sm font-semibold">
            Exchange Rate Details
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate">Rate</span>
              <span className="text-charcoal">
                1 {fromCurrency} = {result.rate.toFixed(6)} {toCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Inverse Rate</span>
              <span className="text-charcoal">
                1 {toCurrency} ={" "}
                {Number.isFinite(result.rate) && result.rate !== 0
                  ? `${(1 / result.rate).toFixed(6)} ${fromCurrency}`
                  : "N/A"}
              </span>
            </div>
            <div className="border-sand flex justify-between border-t pt-2">
              <span className="text-charcoal font-semibold">
                Original Amount
              </span>
              <span className="text-charcoal font-semibold">
                {formatCurrencyPrecise(amount, fromCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal font-semibold">
                Converted Amount
              </span>
              <span className="text-charcoal font-semibold">
                {formatCurrencyPrecise(result.convertedAmount, toCurrency)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
