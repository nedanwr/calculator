import { DollarSign } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~/components/ui/select";
import { getAvailableCurrencies, type Currency } from "~/lib/currency";

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}

const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "INR"
];

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  disabled = false,
  hideLabel = false
}: CurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailableCurrencies()
      .then(setCurrencies)
      .finally(() => setLoading(false));
  }, []);

  const sortedCurrencies = useMemo(
    () =>
      [...currencies].sort((a, b) => {
        const aIsCommon = COMMON_CURRENCIES.includes(a.code);
        const bIsCommon = COMMON_CURRENCIES.includes(b.code);
        if (aIsCommon && !bIsCommon) return -1;
        if (!aIsCommon && bIsCommon) return 1;
        return a.code.localeCompare(b.code);
      }),
    [currencies]
  );

  const selectedCurrencyData = currencies.find(
    (c) => c.code === selectedCurrency
  );

  return (
    <div className="relative">
      {!hideLabel && (
        <label className="text-slate mb-1.5 block text-xs font-medium tracking-wide uppercase">
          Currency
        </label>
      )}
      <Select
        value={selectedCurrency}
        onValueChange={onCurrencyChange}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue>
            <span className="flex items-center gap-2">
              <DollarSign size={18} aria-hidden="true" />
              {loading
                ? "Loading..."
                : selectedCurrencyData
                  ? `${selectedCurrencyData.code} - ${selectedCurrencyData.name}`
                  : selectedCurrency}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortedCurrencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <span className="font-semibold">{currency.code}</span>
              <span className="ml-2 text-xs opacity-70">{currency.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
