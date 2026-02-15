import { Plus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";

import { AmortizationTable } from "~/components/amortization-table";
import { BalanceChart, MortgageCostChart } from "~/components/charts";
import { EarlyPayoffSavings } from "~/components/early-payoff-savings";
import { ExportControls } from "~/components/export-controls";
import { ExtraPaymentSection } from "~/components/extra-payment-section";
import { InputField } from "~/components/input-field";
import { PIBreakdown } from "~/components/pi-breakdown";
import { useTheme } from "~/components/theme-provider";
import { useFormattedInput } from "~/hooks/use-formatted-input";
import {
  calculateLoanPayment,
  calculateLoanWithExtraPayments,
  calculateMortgage,
  generateAmortizationSchedule,
  generateAmortizationScheduleWithExtra,
  type ExtraPaymentConfig,
  type ExtraPaymentType
} from "~/lib/calculations";
import { exportMortgageCSV, exportMortgageExcel } from "~/lib/export";
import { formatCurrency, formatCurrencyPrecise } from "~/lib/format";
import { printMortgage } from "~/lib/print";
import { generateUUID, sanitizeText } from "~/lib/utils";

type InputMode = "dollar" | "percent";
type Frequency = "monthly" | "yearly";

interface CustomCost {
  id: string;
  name: string;
  value: number;
  mode: InputMode;
  frequency: Frequency;
}

interface MortgageInputs {
  homePrice: number;
  downPaymentValue: number;
  downPaymentMode: InputMode;
  rate: number;
  years: number;
  propertyTaxValue: number;
  propertyTaxMode: InputMode;
  insurance: number;
  hoa: number;
  customCosts: CustomCost[];
  extraPaymentType: ExtraPaymentType;
  extraMonthly: number;
  extraYearlyAmount: number;
  extraYearlyMonth: number;
}

interface ToggleInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  decimals?: number;
}

function ToggleInput({
  label,
  value,
  onChange,
  mode,
  onModeChange,
  decimals = 0
}: ToggleInputProps) {
  const id = useId();
  const effectiveDecimals = mode === "percent" ? 2 : decimals;
  const { inputRef, displayValue, handleChange, handleBlur } =
    useFormattedInput(value, onChange, effectiveDecimals);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-muted-foreground block text-xs font-medium tracking-wide uppercase"
        >
          {label}
        </label>
        <div className="bg-accent flex rounded-lg p-0.5">
          <button
            onClick={() => onModeChange("dollar")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
              mode === "dollar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            $
          </button>
          <button
            onClick={() => onModeChange("percent")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
              mode === "percent"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            %
          </button>
        </div>
      </div>
      <div className="relative">
        {mode === "dollar" && (
          <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
            $
          </span>
        )}
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-card w-full rounded-xl border-2 py-3 text-base font-medium transition-all duration-200 ${mode === "dollar" ? "pr-3 pl-8" : "pr-8 pl-3"} `}
        />
        {mode === "percent" && (
          <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
            %
          </span>
        )}
      </div>
    </div>
  );
}

interface CustomCostInputProps {
  cost: CustomCost;
  homePrice: number;
  onChange: (cost: CustomCost) => void;
  onRemove: () => void;
}

function CustomCostInput({
  cost,
  homePrice,
  onChange,
  onRemove
}: CustomCostInputProps) {
  const effectiveDecimals = cost.mode === "percent" ? 2 : 0;
  const handleValueUpdate = useCallback(
    (newValue: number) => onChange({ ...cost, value: newValue }),
    [cost, onChange]
  );
  const { inputRef, displayValue, handleChange, handleBlur } =
    useFormattedInput(cost.value, handleValueUpdate, effectiveDecimals);

  const handleModeChange = (mode: InputMode) => {
    let newValue = cost.value;
    if (mode === "percent" && cost.mode === "dollar") {
      newValue = homePrice > 0 ? (cost.value / homePrice) * 100 : 0;
    } else if (mode === "dollar" && cost.mode === "percent") {
      newValue = (cost.value / 100) * homePrice;
    }
    onChange({ ...cost, mode, value: Math.round(newValue * 100) / 100 });
  };

  return (
    <div className="bg-secondary space-y-2 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={cost.name}
          onChange={(e) => onChange({ ...cost, name: e.target.value })}
          placeholder="Cost name..."
          aria-label="Cost name"
          className="border-border text-foreground placeholder:text-muted-foreground focus:border-ring flex-1 border-b bg-transparent py-1 text-sm focus:outline-none"
        />
        <button
          onClick={onRemove}
          aria-label={cost.name ? `Remove ${cost.name}` : "Remove cost"}
          title={cost.name ? `Remove ${cost.name}` : "Remove cost"}
          className="text-muted-foreground hover:text-destructive focus-visible:ring-destructive rounded p-1 transition-colors focus:outline-none focus-visible:ring-2"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {cost.mode === "dollar" && (
            <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-sm">
              $
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="0"
            className={`bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-ring w-full rounded-lg border py-2 text-sm font-medium focus:outline-none ${cost.mode === "dollar" ? "pr-2 pl-6" : "pr-6 pl-2"} `}
          />
          {cost.mode === "percent" && (
            <span className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-sm">
              %
            </span>
          )}
        </div>
        <div className="bg-accent flex rounded-md p-0.5">
          <button
            onClick={() => handleModeChange("dollar")}
            className={`focus-visible:ring-destructive rounded px-2 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 ${
              cost.mode === "dollar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            $
          </button>
          <button
            onClick={() => handleModeChange("percent")}
            className={`focus-visible:ring-destructive rounded px-2 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 ${
              cost.mode === "percent"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            %
          </button>
        </div>
        <div className="bg-accent flex rounded-md p-0.5">
          <button
            onClick={() =>
              cost.mode !== "percent" &&
              onChange({ ...cost, frequency: "monthly" })
            }
            disabled={cost.mode === "percent"}
            title={
              cost.mode === "percent"
                ? "Percent mode is always annual"
                : undefined
            }
            className={`focus-visible:ring-destructive rounded px-1.5 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 ${
              cost.mode === "percent"
                ? "text-muted-foreground cursor-not-allowed"
                : cost.frequency === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
            }`}
          >
            /mo
          </button>
          <button
            onClick={() =>
              cost.mode !== "percent" &&
              onChange({ ...cost, frequency: "yearly" })
            }
            disabled={cost.mode === "percent"}
            title={
              cost.mode === "percent"
                ? "Percent mode is always annual"
                : undefined
            }
            className={`focus-visible:ring-destructive rounded px-1.5 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 ${
              cost.mode === "percent"
                ? "bg-primary/50 text-primary-foreground/70 cursor-not-allowed"
                : cost.frequency === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
            }`}
          >
            /yr
          </button>
        </div>
      </div>
    </div>
  );
}

export function MortgageCalculator() {
  const { isDark } = useTheme();
  const [inputs, setInputs] = useState<MortgageInputs>({
    homePrice: 450000,
    downPaymentValue: 20,
    downPaymentMode: "percent",
    rate: 6.5,
    years: 30,
    propertyTaxValue: 1.2,
    propertyTaxMode: "percent",
    insurance: 1800,
    hoa: 0,
    customCosts: [],
    extraPaymentType: "none",
    extraMonthly: 200,
    extraYearlyAmount: 2000,
    extraYearlyMonth: 1
  });

  const downPaymentDollars = useMemo(() => {
    if (inputs.downPaymentMode === "percent") {
      return (inputs.downPaymentValue / 100) * inputs.homePrice;
    }
    return inputs.downPaymentValue;
  }, [inputs.downPaymentValue, inputs.downPaymentMode, inputs.homePrice]);

  const downPaymentPercent = useMemo(() => {
    if (inputs.downPaymentMode === "dollar") {
      return inputs.homePrice > 0
        ? (inputs.downPaymentValue / inputs.homePrice) * 100
        : 0;
    }
    return inputs.downPaymentValue;
  }, [inputs.downPaymentValue, inputs.downPaymentMode, inputs.homePrice]);

  const annualPropertyTax = useMemo(() => {
    if (inputs.propertyTaxMode === "percent") {
      return (inputs.propertyTaxValue / 100) * inputs.homePrice;
    }
    return inputs.propertyTaxValue;
  }, [inputs.propertyTaxValue, inputs.propertyTaxMode, inputs.homePrice]);

  const results = useMemo(
    () =>
      calculateMortgage(
        inputs.homePrice,
        downPaymentDollars,
        inputs.rate,
        inputs.years,
        annualPropertyTax,
        inputs.insurance,
        inputs.hoa
      ),
    [
      inputs.homePrice,
      downPaymentDollars,
      inputs.rate,
      inputs.years,
      annualPropertyTax,
      inputs.insurance,
      inputs.hoa
    ]
  );

  const loanDetails = useMemo(
    () => calculateLoanPayment(results.loanAmount, inputs.rate, inputs.years),
    [results.loanAmount, inputs.rate, inputs.years]
  );

  const extraPaymentConfig: ExtraPaymentConfig = useMemo(
    () => ({
      type: inputs.extraPaymentType,
      extraMonthly: inputs.extraMonthly,
      extraYearlyAmount: inputs.extraYearlyAmount,
      extraYearlyMonth: inputs.extraYearlyMonth
    }),
    [
      inputs.extraPaymentType,
      inputs.extraMonthly,
      inputs.extraYearlyAmount,
      inputs.extraYearlyMonth
    ]
  );

  const extraPaymentResults = useMemo(() => {
    if (inputs.extraPaymentType === "none") return null;
    return calculateLoanWithExtraPayments(
      results.loanAmount,
      inputs.rate,
      inputs.years,
      extraPaymentConfig
    );
  }, [
    results.loanAmount,
    inputs.rate,
    inputs.years,
    inputs.extraPaymentType,
    extraPaymentConfig
  ]);

  const hasExtraPayments =
    extraPaymentResults !== null && inputs.extraPaymentType !== "none";

  const firstMonthBreakdown = useMemo(() => {
    const monthlyRate = inputs.rate / 100 / 12;
    const firstMonthInterest = results.loanAmount * monthlyRate;
    const firstMonthPrincipal =
      results.monthlyPrincipalInterest - firstMonthInterest;

    return {
      interest: firstMonthInterest,
      principal: firstMonthPrincipal,
      interestPercent:
        results.monthlyPrincipalInterest > 0
          ? (firstMonthInterest / results.monthlyPrincipalInterest) * 100
          : 0,
      principalPercent:
        results.monthlyPrincipalInterest > 0
          ? (firstMonthPrincipal / results.monthlyPrincipalInterest) * 100
          : 0
    };
  }, [results.loanAmount, inputs.rate, results.monthlyPrincipalInterest]);

  const amortizationSchedule = useMemo(() => {
    if (inputs.extraPaymentType !== "none") {
      return generateAmortizationScheduleWithExtra(
        results.loanAmount,
        inputs.rate,
        inputs.years,
        extraPaymentConfig
      );
    }
    return generateAmortizationSchedule(
      results.loanAmount,
      inputs.rate,
      inputs.years
    );
  }, [
    results.loanAmount,
    inputs.rate,
    inputs.years,
    inputs.extraPaymentType,
    extraPaymentConfig
  ]);

  const actualTermYears =
    hasExtraPayments && extraPaymentResults
      ? extraPaymentResults.actualMonths / 12
      : inputs.years;

  const totalPropertyTax = annualPropertyTax * actualTermYears;
  const totalInsurance = inputs.insurance * actualTermYears;
  const totalHoa = inputs.hoa * 12 * actualTermYears;

  const customCostsMonthly = useMemo(() => {
    return inputs.customCosts.map((cost) => {
      let monthlyDollars: number;
      if (cost.mode === "percent") {
        monthlyDollars = ((cost.value / 100) * inputs.homePrice) / 12;
      } else {
        monthlyDollars =
          cost.frequency === "yearly" ? cost.value / 12 : cost.value;
      }
      return { ...cost, monthlyDollars };
    });
  }, [inputs.customCosts, inputs.homePrice]);

  const totalCustomCostsMonthly = customCostsMonthly.reduce(
    (sum, c) => sum + c.monthlyDollars,
    0
  );
  const totalCustomCosts = totalCustomCostsMonthly * 12 * actualTermYears;

  const customCostsForChart = customCostsMonthly.map((c) => ({
    name: c.name || "Other",
    value: c.monthlyDollars * 12 * actualTermYears
  }));

  const customCostsForExport = customCostsMonthly.map((c) => ({
    name: c.name || "Other",
    monthlyAmount: c.monthlyDollars
  }));
  const totalMonthlyWithExtras = results.totalMonthly + totalCustomCostsMonthly;
  const loanTotalPayment =
    hasExtraPayments && extraPaymentResults
      ? extraPaymentResults.actualTotalPayment
      : loanDetails.totalPayment;
  const totalCostOfOwnership =
    loanTotalPayment +
    totalPropertyTax +
    totalInsurance +
    totalHoa +
    totalCustomCosts +
    downPaymentDollars;

  const hasHoa = inputs.hoa > 0;
  const hasCustomCosts = inputs.customCosts.length > 0;

  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      setTimeout(() => {
        if (liveRegionRef.current) {
          const message = `Monthly payment ${formatCurrencyPrecise(results.totalMonthly)}, total cost ${formatCurrency(totalCostOfOwnership)}`;
          liveRegionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [results.totalMonthly, totalCostOfOwnership]);

  const addCustomCost = () => {
    const newCost: CustomCost = {
      id: generateUUID(),
      name: "",
      value: 0,
      mode: "dollar",
      frequency: "monthly"
    };
    setInputs((prev) => ({
      ...prev,
      customCosts: [...prev.customCosts, newCost]
    }));
  };

  const updateCustomCost = (updatedCost: CustomCost) => {
    const sanitizedCost = {
      ...updatedCost,
      name: sanitizeText(updatedCost.name)
    };
    setInputs((prev) => ({
      ...prev,
      customCosts: prev.customCosts.map((c) =>
        c.id === sanitizedCost.id ? sanitizedCost : c
      )
    }));
  };

  const removeCustomCost = (id: string) => {
    setInputs((prev) => ({
      ...prev,
      customCosts: prev.customCosts.filter((c) => c.id !== id)
    }));
  };

  const handleExportCSV = useCallback(() => {
    exportMortgageCSV({
      homePrice: inputs.homePrice,
      downPayment: downPaymentDollars,
      loanAmount: results.loanAmount,
      rate: inputs.rate,
      years: inputs.years,
      monthlyPI: results.monthlyPrincipalInterest,
      monthlyTax: results.monthlyPropertyTax,
      monthlyInsurance: results.monthlyInsurance,
      monthlyHOA: results.monthlyHoa,
      customCosts: customCostsForExport,
      totalMonthly: totalMonthlyWithExtras,
      totalCost: totalCostOfOwnership,
      totalInterest: loanDetails.totalInterest,
      schedule: amortizationSchedule
    });
  }, [
    inputs,
    results,
    downPaymentDollars,
    customCostsForExport,
    totalMonthlyWithExtras,
    totalCostOfOwnership,
    loanDetails.totalInterest,
    amortizationSchedule
  ]);

  const handleExportExcel = useCallback(() => {
    exportMortgageExcel({
      homePrice: inputs.homePrice,
      downPayment: downPaymentDollars,
      loanAmount: results.loanAmount,
      rate: inputs.rate,
      years: inputs.years,
      monthlyPI: results.monthlyPrincipalInterest,
      monthlyTax: results.monthlyPropertyTax,
      monthlyInsurance: results.monthlyInsurance,
      monthlyHOA: results.monthlyHoa,
      customCosts: customCostsForExport,
      totalMonthly: totalMonthlyWithExtras,
      totalCost: totalCostOfOwnership,
      totalInterest: loanDetails.totalInterest,
      schedule: amortizationSchedule
    });
  }, [
    inputs,
    results,
    downPaymentDollars,
    customCostsForExport,
    totalMonthlyWithExtras,
    totalCostOfOwnership,
    loanDetails.totalInterest,
    amortizationSchedule
  ]);

  const handlePrint = useCallback(() => {
    printMortgage(
      {
        homePrice: inputs.homePrice,
        downPayment: downPaymentDollars,
        loanAmount: results.loanAmount,
        rate: inputs.rate,
        years: inputs.years,
        monthlyPI: results.monthlyPrincipalInterest,
        monthlyTax: results.monthlyPropertyTax,
        monthlyInsurance: results.monthlyInsurance,
        monthlyHOA: results.monthlyHoa,
        customCosts: customCostsForExport,
        totalMonthly: totalMonthlyWithExtras,
        totalCost: totalCostOfOwnership,
        totalInterest: loanDetails.totalInterest,
        schedule: amortizationSchedule
      },
      isDark
    );
  }, [
    inputs,
    results,
    downPaymentDollars,
    customCostsForExport,
    totalMonthlyWithExtras,
    totalCostOfOwnership,
    loanDetails.totalInterest,
    amortizationSchedule,
    isDark
  ]);

  return (
    <div className="grid h-full gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {/* Column 1: Inputs */}
      <div className="space-y-4 lg:overflow-y-auto lg:pr-4 lg:pb-4">
        <h2 className="text-foreground text-base font-semibold">
          Property & Loan
        </h2>
        <div className="space-y-3">
          <InputField
            label="Home Price"
            value={inputs.homePrice}
            onChange={(homePrice) =>
              setInputs((prev) => ({ ...prev, homePrice }))
            }
            prefix="$"
          />
          <ToggleInput
            label="Down Payment"
            value={inputs.downPaymentValue}
            onChange={(downPaymentValue) =>
              setInputs((prev) => ({ ...prev, downPaymentValue }))
            }
            mode={inputs.downPaymentMode}
            onModeChange={(downPaymentMode) =>
              setInputs((prev) => {
                let newValue = prev.downPaymentValue;
                if (
                  downPaymentMode === "percent" &&
                  prev.downPaymentMode === "dollar"
                ) {
                  newValue =
                    prev.homePrice > 0
                      ? (prev.downPaymentValue / prev.homePrice) * 100
                      : 0;
                } else if (
                  downPaymentMode === "dollar" &&
                  prev.downPaymentMode === "percent"
                ) {
                  newValue = (prev.downPaymentValue / 100) * prev.homePrice;
                }
                return {
                  ...prev,
                  downPaymentMode,
                  downPaymentValue: Math.round(newValue * 100) / 100
                };
              })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Interest Rate"
              value={inputs.rate}
              onChange={(rate) => setInputs((prev) => ({ ...prev, rate }))}
              suffix="%"
              decimals={3}
              max={15}
            />
            <InputField
              label="Loan Term"
              value={inputs.years}
              onChange={(years) => setInputs((prev) => ({ ...prev, years }))}
              suffix="yrs"
              min={10}
              max={30}
            />
          </div>
        </div>

        <div className="pt-4">
          <h2 className="text-foreground mb-3 text-base font-semibold">
            Additional Costs
          </h2>
          <div className="space-y-3">
            <ToggleInput
              label="Property Tax / Year"
              value={inputs.propertyTaxValue}
              onChange={(propertyTaxValue) =>
                setInputs((prev) => ({ ...prev, propertyTaxValue }))
              }
              mode={inputs.propertyTaxMode}
              onModeChange={(propertyTaxMode) =>
                setInputs((prev) => {
                  let newValue = prev.propertyTaxValue;
                  if (
                    propertyTaxMode === "percent" &&
                    prev.propertyTaxMode === "dollar"
                  ) {
                    newValue =
                      prev.homePrice > 0
                        ? (prev.propertyTaxValue / prev.homePrice) * 100
                        : 0;
                  } else if (
                    propertyTaxMode === "dollar" &&
                    prev.propertyTaxMode === "percent"
                  ) {
                    newValue = (prev.propertyTaxValue / 100) * prev.homePrice;
                  }
                  return {
                    ...prev,
                    propertyTaxMode,
                    propertyTaxValue: Math.round(newValue * 100) / 100
                  };
                })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <InputField
                label="Insurance / Yr"
                value={inputs.insurance}
                onChange={(insurance) =>
                  setInputs((prev) => ({ ...prev, insurance }))
                }
                prefix="$"
              />
              <InputField
                label="HOA / Mo"
                value={inputs.hoa}
                onChange={(hoa) => setInputs((prev) => ({ ...prev, hoa }))}
                prefix="$"
              />
            </div>

            {inputs.customCosts.length > 0 && (
              <div className="space-y-2">
                {inputs.customCosts.map((cost) => (
                  <CustomCostInput
                    key={cost.id}
                    cost={cost}
                    homePrice={inputs.homePrice}
                    onChange={updateCustomCost}
                    onRemove={() => removeCustomCost(cost.id)}
                  />
                ))}
              </div>
            )}

            <button
              onClick={addCustomCost}
              className="text-destructive hover:destructive/80 flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Add other cost
            </button>
          </div>
        </div>

        <ExtraPaymentSection
          extraPaymentType={inputs.extraPaymentType}
          extraMonthly={inputs.extraMonthly}
          extraYearlyAmount={inputs.extraYearlyAmount}
          extraYearlyMonth={inputs.extraYearlyMonth}
          onExtraPaymentTypeChange={(type) =>
            setInputs((prev) => ({ ...prev, extraPaymentType: type }))
          }
          onExtraMonthlyChange={(value) =>
            setInputs((prev) => ({ ...prev, extraMonthly: value }))
          }
          onExtraYearlyAmountChange={(value) =>
            setInputs((prev) => ({ ...prev, extraYearlyAmount: value }))
          }
          onExtraYearlyMonthChange={(month) =>
            setInputs((prev) => ({ ...prev, extraYearlyMonth: month }))
          }
          selectId="mortgage-extra-yearly-month"
        />
      </div>

      {/* Column 2: Results */}
      <div className="lg:overflow-y-auto lg:pb-4">
        <h2 className="text-foreground mb-4 text-base font-semibold">
          Results
        </h2>

        <div className="bg-destructive mb-4 rounded-2xl p-5">
          <p className="text-primary-foreground/70 mb-1 text-xs tracking-wide uppercase">
            {hasCustomCosts ? "Total Monthly" : "Monthly Payment"}
          </p>
          <p className="text-primary-foreground font-serif text-3xl">
            {formatCurrencyPrecise(
              hasCustomCosts ? totalMonthlyWithExtras : results.totalMonthly
            )}
          </p>
          <p className="text-primary-foreground/60 mt-1 text-xs">
            P&I: {formatCurrencyPrecise(results.monthlyPrincipalInterest)}
          </p>
        </div>

        <PIBreakdown
          principal={firstMonthBreakdown.principal}
          interest={firstMonthBreakdown.interest}
          principalPercent={firstMonthBreakdown.principalPercent}
          interestPercent={firstMonthBreakdown.interestPercent}
        />

        <div className="bg-secondary mb-4 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs">Tax</p>
              <p className="text-foreground font-serif text-sm">
                {formatCurrencyPrecise(results.monthlyPropertyTax)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Insurance</p>
              <p className="text-foreground font-serif text-sm">
                {formatCurrencyPrecise(results.monthlyInsurance)}
              </p>
            </div>
            {hasHoa && (
              <div>
                <p className="text-muted-foreground text-xs">HOA</p>
                <p className="text-foreground font-serif text-sm">
                  {formatCurrencyPrecise(results.monthlyHoa)}
                </p>
              </div>
            )}
            {customCostsMonthly.map((cost) => (
              <div key={cost.id}>
                <p className="text-muted-foreground truncate text-xs">
                  {cost.name || "Other"}
                </p>
                <p className="text-foreground font-serif text-sm">
                  {formatCurrencyPrecise(cost.monthlyDollars)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {hasExtraPayments && extraPaymentResults && (
          <EarlyPayoffSavings
            monthsSaved={extraPaymentResults.monthsSaved}
            interestSaved={extraPaymentResults.interestSaved}
            actualMonths={extraPaymentResults.actualMonths}
            originalYears={inputs.years}
          />
        )}

        <div className="bg-secondary rounded-xl p-4">
          <h3 className="text-foreground mb-2 text-sm font-semibold">
            Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="text-foreground">
                {formatCurrency(results.loanAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Down Payment</span>
              <span className="text-foreground">
                {formatCurrency(downPaymentDollars)} (
                {downPaymentPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Term</span>
              <span className="text-foreground">
                {hasExtraPayments && extraPaymentResults ? (
                  <>
                    {Math.floor(extraPaymentResults.actualMonths / 12)} yr{" "}
                    {extraPaymentResults.actualMonths % 12} mo
                  </>
                ) : (
                  <>{inputs.years} yrs</>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Interest</span>
              <span className="text-foreground">
                {formatCurrency(
                  hasExtraPayments && extraPaymentResults
                    ? extraPaymentResults.actualTotalInterest
                    : loanDetails.totalInterest
                )}
              </span>
            </div>
            <div className="border-border flex justify-between border-t pt-2">
              <span className="text-foreground font-semibold">Total Cost</span>
              <span className="text-foreground font-semibold">
                {formatCurrency(totalCostOfOwnership)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Visualizations */}
      <div className="lg:col-span-2 lg:overflow-y-auto lg:pb-4 xl:col-span-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-base font-semibold">
            Visualizations
          </h2>
          <ExportControls
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onPrint={handlePrint}
          />
        </div>

        {amortizationSchedule.length > 0 && (
          <div className="space-y-4">
            <MortgageCostChart
              principal={results.loanAmount}
              interest={
                hasExtraPayments && extraPaymentResults
                  ? extraPaymentResults.actualTotalInterest
                  : loanDetails.totalInterest
              }
              tax={totalPropertyTax}
              insurance={totalInsurance}
              hoa={totalHoa}
              customCosts={customCostsForChart}
            />
            <BalanceChart
              schedule={amortizationSchedule}
              monthlyCosts={{
                tax: results.monthlyPropertyTax,
                insurance: results.monthlyInsurance,
                hoa: results.monthlyHoa,
                other: totalCustomCostsMonthly
              }}
            />
            <AmortizationTable schedule={amortizationSchedule} />
          </div>
        )}
      </div>
    </div>
  );
}
