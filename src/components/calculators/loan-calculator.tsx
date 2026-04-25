import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AmortizationTable } from "~/components/amortization-table";
import { BalanceChart, PaymentBreakdownChart } from "~/components/charts";
import { EarlyPayoffSavings } from "~/components/early-payoff-savings";
import { ExportControls } from "~/components/export-controls";
import { ExtraPaymentSection } from "~/components/extra-payment-section";
import { InputField } from "~/components/input-field";
import { PIBreakdown } from "~/components/pi-breakdown";
import { useTheme } from "~/components/theme-provider";
import { ToggleGroup } from "~/components/toggle-group";
import {
  calculateBalloonLoan,
  calculateBulletLoan,
  calculateLoanWithExtraPayments,
  calculateLoanWithGracePeriod,
  generateAmortizationSchedule,
  generateAmortizationScheduleWithExtra,
  type ExtraPaymentConfig,
  type ExtraPaymentType,
  type GracePeriodType
} from "~/lib/calculations";
import { exportLoanCSV, exportLoanExcel } from "~/lib/export";
import { formatCurrency, formatCurrencyPrecise } from "~/lib/format";
import { printLoan } from "~/lib/print";

type RepaymentType = "standard" | "balloon" | "bullet";

interface LoanInputs {
  principal: number;
  rate: number;
  years: number;
  repaymentType: RepaymentType;
  gracePeriodMonths: number;
  gracePeriodType: GracePeriodType;
  extraPaymentType: ExtraPaymentType;
  extraMonthly: number;
  extraYearlyAmount: number;
  extraYearlyMonth: number;
}

const graceOptions: { id: GracePeriodType; label: string }[] = [
  { id: "none", label: "None" },
  { id: "interest_only", label: "Interest Only" },
  { id: "no_payment", label: "Full Deferral" }
];

const repaymentOptions: { id: RepaymentType; label: string }[] = [
  { id: "standard", label: "Amortized" },
  { id: "balloon", label: "Interest Only" },
  { id: "bullet", label: "Bullet" }
];

const repaymentDescriptions: Record<RepaymentType, string> = {
  standard: "",
  balloon: "Interest only, principal at maturity.",
  bullet: "Everything due at maturity."
};

export function LoanCalculator() {
  const { isDark } = useTheme();
  const [inputs, setInputs] = useState<LoanInputs>({
    principal: 25000,
    rate: 7.5,
    years: 5,
    repaymentType: "standard",
    gracePeriodMonths: 0,
    gracePeriodType: "none",
    extraPaymentType: "none",
    extraMonthly: 100,
    extraYearlyAmount: 1000,
    extraYearlyMonth: 1
  });

  const standardResults = useMemo(
    () =>
      calculateLoanWithGracePeriod(
        inputs.principal,
        inputs.rate,
        inputs.years,
        inputs.gracePeriodMonths,
        inputs.gracePeriodType
      ),
    [
      inputs.principal,
      inputs.rate,
      inputs.years,
      inputs.gracePeriodMonths,
      inputs.gracePeriodType
    ]
  );

  const balloonResults = useMemo(
    () => calculateBalloonLoan(inputs.principal, inputs.rate, inputs.years),
    [inputs.principal, inputs.rate, inputs.years]
  );

  const bulletResults = useMemo(
    () => calculateBulletLoan(inputs.principal, inputs.rate, inputs.years),
    [inputs.principal, inputs.rate, inputs.years]
  );

  const isBalloon = inputs.repaymentType === "balloon";
  const isBullet = inputs.repaymentType === "bullet";
  const results = isBullet
    ? bulletResults
    : isBalloon
      ? balloonResults
      : standardResults;
  const hasGracePeriod =
    inputs.repaymentType === "standard" &&
    inputs.gracePeriodType !== "none" &&
    inputs.gracePeriodMonths > 0;

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
    if (
      inputs.repaymentType !== "standard" ||
      inputs.gracePeriodType !== "none"
    ) {
      return null;
    }
    return calculateLoanWithExtraPayments(
      inputs.principal,
      inputs.rate,
      inputs.years,
      extraPaymentConfig
    );
  }, [
    inputs.principal,
    inputs.rate,
    inputs.years,
    inputs.repaymentType,
    inputs.gracePeriodType,
    extraPaymentConfig
  ]);

  const hasExtraPayments =
    extraPaymentResults !== null && inputs.extraPaymentType !== "none";

  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total =
      hasExtraPayments && extraPaymentResults
        ? extraPaymentResults.actualTotalPayment
        : results.totalPayment;

    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      setTimeout(() => {
        if (liveRegionRef.current) {
          const message = isBullet
            ? `Bullet loan: Payment at maturity ${formatCurrency(bulletResults.finalPayment)}`
            : isBalloon
              ? `Interest only loan: Monthly interest ${formatCurrencyPrecise(results.monthlyPayment)}, balloon payment ${formatCurrency(balloonResults.balloonPayment)}`
              : `Monthly payment ${formatCurrencyPrecise(results.monthlyPayment)}, total ${formatCurrency(total)}`;
          liveRegionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [
    results.monthlyPayment,
    results.totalPayment,
    isBullet,
    isBalloon,
    bulletResults,
    balloonResults,
    hasExtraPayments,
    extraPaymentResults
  ]);

  const amortizationSchedule = useMemo(() => {
    if (inputs.repaymentType !== "standard") return [];
    const effectivePrincipal = hasGracePeriod
      ? standardResults.principalAfterGrace
      : inputs.principal;

    if (!hasGracePeriod && inputs.extraPaymentType !== "none") {
      return generateAmortizationScheduleWithExtra(
        effectivePrincipal,
        inputs.rate,
        inputs.years,
        extraPaymentConfig
      );
    }

    return generateAmortizationSchedule(
      effectivePrincipal,
      inputs.rate,
      inputs.years
    );
  }, [
    inputs.principal,
    inputs.rate,
    inputs.years,
    inputs.repaymentType,
    inputs.extraPaymentType,
    standardResults.principalAfterGrace,
    hasGracePeriod,
    extraPaymentConfig
  ]);

  const firstMonthBreakdown = useMemo(() => {
    if (inputs.repaymentType !== "standard") return null;

    const effectivePrincipal = hasGracePeriod
      ? standardResults.principalAfterGrace
      : inputs.principal;
    const monthlyRate = inputs.rate / 100 / 12;
    const monthlyPayment = standardResults.monthlyPayment;
    const rawFirstMonthInterest = effectivePrincipal * monthlyRate;

    const firstMonthInterest = Math.min(rawFirstMonthInterest, monthlyPayment);
    const firstMonthPrincipal = Math.max(
      monthlyPayment - firstMonthInterest,
      0
    );

    const interestPercent =
      monthlyPayment > 0 ? (firstMonthInterest / monthlyPayment) * 100 : 0;
    const principalPercent =
      monthlyPayment > 0 ? (firstMonthPrincipal / monthlyPayment) * 100 : 0;

    return {
      interest: firstMonthInterest,
      principal: firstMonthPrincipal,
      interestPercent,
      principalPercent
    };
  }, [
    inputs.principal,
    inputs.rate,
    inputs.repaymentType,
    standardResults,
    hasGracePeriod
  ]);

  const handleExportCSV = useCallback(() => {
    const repaymentLabels = {
      standard: "Amortized",
      balloon: "Interest Only",
      bullet: "Bullet"
    };
    exportLoanCSV({
      principal: inputs.principal,
      rate: inputs.rate,
      years: inputs.years,
      repaymentType: repaymentLabels[inputs.repaymentType],
      monthlyPayment:
        hasExtraPayments && extraPaymentResults
          ? extraPaymentResults.effectiveMonthlyPayment
          : results.monthlyPayment,
      totalPayment:
        hasExtraPayments && extraPaymentResults
          ? extraPaymentResults.actualTotalPayment
          : results.totalPayment,
      totalInterest:
        hasExtraPayments && extraPaymentResults
          ? extraPaymentResults.actualTotalInterest
          : results.totalInterest,
      schedule: amortizationSchedule
    });
  }, [
    inputs,
    results,
    amortizationSchedule,
    hasExtraPayments,
    extraPaymentResults
  ]);

  const handleExportExcel = useCallback(() => {
    const repaymentLabels = {
      standard: "Amortized",
      balloon: "Interest Only",
      bullet: "Bullet"
    };
    exportLoanExcel({
      principal: inputs.principal,
      rate: inputs.rate,
      years: inputs.years,
      repaymentType: repaymentLabels[inputs.repaymentType],
      monthlyPayment:
        hasExtraPayments && extraPaymentResults
          ? extraPaymentResults.effectiveMonthlyPayment
          : results.monthlyPayment,
      totalPayment:
        hasExtraPayments && extraPaymentResults
          ? extraPaymentResults.actualTotalPayment
          : results.totalPayment,
      totalInterest:
        hasExtraPayments && extraPaymentResults
          ? extraPaymentResults.actualTotalInterest
          : results.totalInterest,
      schedule: amortizationSchedule
    });
  }, [
    inputs,
    results,
    amortizationSchedule,
    hasExtraPayments,
    extraPaymentResults
  ]);

  const handlePrint = useCallback(() => {
    const repaymentLabels = {
      standard: "Amortized",
      balloon: "Interest Only",
      bullet: "Bullet"
    };
    const graceLabels: Record<GracePeriodType, string> = {
      none: "None",
      interest_only: "Interest Only",
      no_payment: "Full Deferral"
    };
    const gracePeriod =
      inputs.gracePeriodType !== "none"
        ? {
            type: graceLabels[inputs.gracePeriodType],
            months: inputs.gracePeriodMonths
          }
        : undefined;
    printLoan(
      {
        principal: inputs.principal,
        rate: inputs.rate,
        years: inputs.years,
        repaymentType: repaymentLabels[inputs.repaymentType],
        ...(gracePeriod ? { gracePeriod } : {}),
        monthlyPayment:
          hasExtraPayments && extraPaymentResults
            ? extraPaymentResults.effectiveMonthlyPayment
            : results.monthlyPayment,
        totalPayment:
          hasExtraPayments && extraPaymentResults
            ? extraPaymentResults.actualTotalPayment
            : results.totalPayment,
        totalInterest:
          hasExtraPayments && extraPaymentResults
            ? extraPaymentResults.actualTotalInterest
            : results.totalInterest,
        schedule: amortizationSchedule
      },
      isDark
    );
  }, [
    inputs,
    results,
    amortizationSchedule,
    hasExtraPayments,
    extraPaymentResults,
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
          Loan Details
        </h2>
        <div className="space-y-3">
          <InputField
            label="Loan Amount"
            value={inputs.principal}
            onChange={(principal) =>
              setInputs((prev) => ({ ...prev, principal }))
            }
            prefix="$"
          />
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Interest Rate"
              value={inputs.rate}
              onChange={(rate) => setInputs((prev) => ({ ...prev, rate }))}
              suffix="%"
              decimals={2}
              max={30}
            />
            <InputField
              label="Loan Term"
              value={inputs.years}
              onChange={(years) => setInputs((prev) => ({ ...prev, years }))}
              suffix="yrs"
              min={1}
              max={100}
            />
          </div>
        </div>

        <ToggleGroup
          label="Repayment Type"
          options={repaymentOptions}
          selected={inputs.repaymentType}
          onChange={(id) =>
            setInputs((prev) => ({
              ...prev,
              repaymentType: id,
              ...(id !== "standard" && {
                gracePeriodType: "none" as GracePeriodType,
                gracePeriodMonths: 0
              })
            }))
          }
          columns={3}
          descriptions={repaymentDescriptions}
        />

        {inputs.repaymentType === "standard" && (
          <>
            <ToggleGroup
              label="Grace Period"
              options={graceOptions}
              selected={inputs.gracePeriodType}
              onChange={(id) =>
                setInputs((prev) => ({
                  ...prev,
                  gracePeriodType: id,
                  gracePeriodMonths:
                    id === "none" ? 0 : prev.gracePeriodMonths || 6
                }))
              }
              columns={3}
            />
            {inputs.gracePeriodType !== "none" && (
              <div className="animate-fade-in">
                <InputField
                  label="Grace Period"
                  value={inputs.gracePeriodMonths}
                  onChange={(gracePeriodMonths) =>
                    setInputs((prev) => ({ ...prev, gracePeriodMonths }))
                  }
                  suffix="mo"
                  min={1}
                  max={24}
                />
              </div>
            )}
          </>
        )}

        {inputs.repaymentType === "standard" &&
          inputs.gracePeriodType === "none" && (
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
              selectId="loan-extra-yearly-month"
            />
          )}
      </div>

      {/* Column 2: Results */}
      <div className="lg:overflow-y-auto lg:pb-4">
        <h2 className="text-foreground mb-4 text-base font-semibold">
          Results
        </h2>

        {isBullet ? (
          <div className="bg-destructive mb-4 rounded-2xl p-5">
            <p className="text-primary-foreground/70 mb-1 text-xs tracking-wide uppercase">
              Payment at Maturity
            </p>
            <p className="text-primary-foreground font-serif text-3xl">
              {formatCurrency(bulletResults.finalPayment)}
            </p>
            <p className="text-primary-foreground/60 mt-1 text-xs">
              After {inputs.years} years
            </p>
          </div>
        ) : (
          <div className="bg-destructive mb-4 rounded-2xl p-5">
            <p className="text-primary-foreground/70 mb-1 text-xs tracking-wide uppercase">
              {isBalloon ? "Monthly Interest" : "Monthly Payment"}
            </p>
            <p className="text-primary-foreground font-serif text-3xl">
              {formatCurrencyPrecise(results.monthlyPayment)}
            </p>
            {hasGracePeriod && (
              <p className="text-primary-foreground/60 mt-1 text-xs">
                After {inputs.gracePeriodMonths}mo grace
              </p>
            )}
          </div>
        )}

        {firstMonthBreakdown && inputs.repaymentType === "standard" && (
          <PIBreakdown
            principal={firstMonthBreakdown.principal}
            interest={firstMonthBreakdown.interest}
            principalPercent={firstMonthBreakdown.principalPercent}
            interestPercent={firstMonthBreakdown.interestPercent}
          />
        )}

        {isBalloon && (
          <div className="bg-secondary mb-4 rounded-xl p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Principal at Maturity
            </p>
            <p className="text-foreground font-serif text-xl">
              {formatCurrency(balloonResults.balloonPayment)}
            </p>
          </div>
        )}

        {isBullet && (
          <div className="bg-secondary mb-4 rounded-xl p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Compounded Interest
            </p>
            <p className="text-foreground font-serif text-xl">
              {formatCurrency(bulletResults.totalInterest)}
            </p>
          </div>
        )}

        {hasGracePeriod && inputs.gracePeriodType === "interest_only" && (
          <div className="bg-secondary mb-4 rounded-xl p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              During Grace
            </p>
            <p className="text-foreground font-serif text-xl">
              {formatCurrencyPrecise(standardResults.gracePayment)}/mo
            </p>
          </div>
        )}

        {hasGracePeriod && inputs.gracePeriodType === "no_payment" && (
          <div className="bg-secondary mb-4 rounded-xl p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Balance After Grace
            </p>
            <p className="text-foreground font-serif text-xl">
              {formatCurrency(standardResults.principalAfterGrace)}
            </p>
            <p className="text-muted-foreground text-xs">
              +{formatCurrency(standardResults.graceInterest)} interest
            </p>
          </div>
        )}

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
              <span className="text-muted-foreground">Principal</span>
              <span className="text-foreground">
                {formatCurrency(inputs.principal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="text-foreground">{inputs.rate}% APR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Term</span>
              <span className="text-foreground">
                {hasExtraPayments && extraPaymentResults ? (
                  <>
                    {Math.floor(extraPaymentResults.actualMonths / 12)} yr{" "}
                    {extraPaymentResults.actualMonths % 12} mo
                    <span className="text-muted-foreground ml-1">
                      (vs {inputs.years} yr)
                    </span>
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
                    : results.totalInterest
                )}
              </span>
            </div>
            <div className="border-border flex justify-between border-t pt-2">
              <span className="text-foreground font-semibold">Total Paid</span>
              <span className="text-foreground font-semibold">
                {formatCurrency(
                  hasExtraPayments && extraPaymentResults
                    ? extraPaymentResults.actualTotalPayment
                    : results.totalPayment
                )}
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

        {inputs.repaymentType === "standard" &&
        amortizationSchedule.length > 0 ? (
          <div className="space-y-4">
            <PaymentBreakdownChart
              principal={inputs.principal}
              interest={results.totalInterest}
            />
            <BalanceChart schedule={amortizationSchedule} />
            <AmortizationTable schedule={amortizationSchedule} />
          </div>
        ) : (
          <div className="bg-secondary rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              {isBalloon
                ? "Interest-only loans have no amortization schedule."
                : "Bullet loans have no payment schedule."}
            </p>
            <div className="mt-4">
              <PaymentBreakdownChart
                principal={inputs.principal}
                interest={results.totalInterest}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
