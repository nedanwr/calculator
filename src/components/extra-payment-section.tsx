import type { ExtraPaymentType } from "~/lib/calculations";
import { InputField } from "./input-field";

interface ExtraPaymentSectionProps {
  extraPaymentType: ExtraPaymentType;
  extraMonthly: number;
  extraYearlyAmount: number;
  extraYearlyMonth: number;
  onExtraPaymentTypeChange: (type: ExtraPaymentType) => void;
  onExtraMonthlyChange: (value: number) => void;
  onExtraYearlyAmountChange: (value: number) => void;
  onExtraYearlyMonthChange: (month: number) => void;
  selectId?: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const EXTRA_PAYMENT_OPTIONS: { id: ExtraPaymentType; label: string }[] = [
  { id: "none", label: "None" },
  { id: "extra_monthly", label: "Monthly" },
  { id: "extra_yearly", label: "Yearly" },
  { id: "biweekly", label: "Biweekly" }
];

export function ExtraPaymentSection({
  extraPaymentType,
  extraMonthly,
  extraYearlyAmount,
  extraYearlyMonth,
  onExtraPaymentTypeChange,
  onExtraMonthlyChange,
  onExtraYearlyAmountChange,
  onExtraYearlyMonthChange,
  selectId = "extra-yearly-month"
}: ExtraPaymentSectionProps) {
  return (
    <div className="border-sand border-t pt-3">
      <label className="text-slate mb-2 block text-xs font-medium tracking-wide uppercase">
        Extra Payments
      </label>
      <div className="mb-2 grid grid-cols-2 gap-1.5">
        {EXTRA_PAYMENT_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onExtraPaymentTypeChange(option.id)}
            className={`rounded-lg px-1.5 py-2 text-xs font-medium transition-all duration-200 ${
              extraPaymentType === option.id
                ? "bg-charcoal text-ivory"
                : "bg-cream text-slate hover:text-charcoal border-sand border"
            } `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {extraPaymentType === "extra_monthly" && (
        <div className="animate-fade-in">
          <InputField
            label="Extra per Month"
            value={extraMonthly}
            onChange={onExtraMonthlyChange}
            prefix="$"
          />
        </div>
      )}

      {extraPaymentType === "extra_yearly" && (
        <div className="animate-fade-in space-y-2">
          <InputField
            label="Extra per Year"
            value={extraYearlyAmount}
            onChange={onExtraYearlyAmountChange}
            prefix="$"
          />
          <div>
            <label
              htmlFor={selectId}
              className="text-slate mb-1.5 block text-xs font-medium tracking-wide uppercase"
            >
              Apply in Month
            </label>
            <select
              id={selectId}
              value={extraYearlyMonth}
              onChange={(e) =>
                onExtraYearlyMonthChange(parseInt(e.target.value, 10) || 1)
              }
              className="bg-cream border-sand text-charcoal focus:border-terracotta focus:bg-ivory w-full rounded-xl border-2 px-3 py-3 text-base font-medium transition-all duration-200"
            >
              {MONTHS.map((month, idx) => (
                <option key={month} value={idx + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {extraPaymentType === "biweekly" && (
        <p className="text-slate mt-1 text-xs">
          26 biweekly payments = 13 monthly payments/year
        </p>
      )}
    </div>
  );
}
