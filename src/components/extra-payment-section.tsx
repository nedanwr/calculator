import { InputField } from "./input-field";
import type { ExtraPaymentType } from "../lib/calculations";

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
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const EXTRA_PAYMENT_OPTIONS: { id: ExtraPaymentType; label: string }[] = [
  { id: "none", label: "None" },
  { id: "extra_monthly", label: "Monthly" },
  { id: "extra_yearly", label: "Yearly" },
  { id: "biweekly", label: "Biweekly" },
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
  selectId = "extra-yearly-month",
}: ExtraPaymentSectionProps) {
  return (
    <div className="pt-3 border-t border-sand">
      <label className="block text-xs font-medium text-slate mb-2 tracking-wide uppercase">
        Extra Payments
      </label>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {EXTRA_PAYMENT_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onExtraPaymentTypeChange(option.id)}
            className={`
              py-2 px-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${
                extraPaymentType === option.id
                  ? "bg-charcoal text-ivory"
                  : "bg-cream text-slate hover:text-charcoal border border-sand"
              }
            `}
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
            <label htmlFor={selectId} className="block text-xs font-medium text-slate mb-1.5 tracking-wide uppercase">
              Apply in Month
            </label>
            <select
              id={selectId}
              value={extraYearlyMonth}
              onChange={(e) => onExtraYearlyMonthChange(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-cream border-2 border-sand rounded-xl py-3 px-3 text-base font-medium text-charcoal focus:border-terracotta focus:bg-ivory transition-all duration-200"
            >
              {MONTHS.map((month, idx) => (
                <option key={month} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {extraPaymentType === "biweekly" && (
        <p className="text-xs text-slate mt-1">
          26 biweekly payments = 13 monthly payments/year
        </p>
      )}
    </div>
  );
}
