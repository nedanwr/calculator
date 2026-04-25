import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  InvestmentBreakdownChart,
  InvestmentGrowthChart,
  InvestmentStackedChart
} from "~/components/charts";
import { ExportControls } from "~/components/export-controls";
import { InputField } from "~/components/input-field";
import { useTheme } from "~/components/theme-provider";
import {
  calculateInvestment,
  generateInvestmentSchedule
} from "~/lib/calculations";
import { exportInvestmentCSV, exportInvestmentExcel } from "~/lib/export";
import { formatCurrency } from "~/lib/format";
import { printInvestment } from "~/lib/print";

type ContributionFrequency = "monthly" | "yearly";

interface InvestmentInputs {
  initial: number;
  contribution: number;
  contributionFrequency: ContributionFrequency;
  rate: number;
  years: number;
  inflation: number;
  adjustForInflation: boolean;
}

export function InvestmentCalculator() {
  const { isDark } = useTheme();
  const [inputs, setInputs] = useState<InvestmentInputs>({
    initial: 10000,
    contribution: 500,
    contributionFrequency: "monthly",
    rate: 8,
    years: 20,
    inflation: 3,
    adjustForInflation: false
  });

  const monthlyContribution =
    inputs.contributionFrequency === "yearly"
      ? inputs.contribution / 12
      : inputs.contribution;

  const effectiveRate = inputs.adjustForInflation
    ? inputs.rate - inputs.inflation
    : inputs.rate;

  const results = useMemo(
    () =>
      calculateInvestment(
        inputs.initial,
        monthlyContribution,
        effectiveRate,
        inputs.years
      ),
    [inputs.initial, monthlyContribution, effectiveRate, inputs.years]
  );

  const growthMultiple =
    results.totalContributions > 0
      ? (results.futureValue / results.totalContributions).toFixed(2)
      : "0";

  const percentFromInterest =
    results.futureValue > 0
      ? ((results.totalInterest / results.futureValue) * 100).toFixed(1)
      : "0";

  const milestones = useMemo(() => {
    const points: { year: number; value: number }[] = [];
    const checkYears = [
      5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250
    ].filter((y) => y <= inputs.years);

    for (const year of checkYears) {
      const result = calculateInvestment(
        inputs.initial,
        monthlyContribution,
        effectiveRate,
        year
      );
      points.push({ year, value: result.futureValue });
    }

    const hasFinalYear = checkYears.includes(inputs.years);
    if (!hasFinalYear && inputs.years > 0) {
      points.push({ year: inputs.years, value: results.futureValue });
    }

    if (points.length > 4) {
      const lastPoint = points[points.length - 1];
      const isFinalYearLast = lastPoint.year === inputs.years;
      if (isFinalYearLast) {
        return [...points.slice(0, 3), lastPoint];
      }
      return points.slice(0, 4);
    }

    return points;
  }, [
    inputs.initial,
    monthlyContribution,
    effectiveRate,
    inputs.years,
    results.futureValue
  ]);

  const investmentSchedule = useMemo(() => {
    return generateInvestmentSchedule(
      inputs.initial,
      monthlyContribution,
      effectiveRate,
      inputs.years
    );
  }, [inputs.initial, monthlyContribution, effectiveRate, inputs.years]);

  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      setTimeout(() => {
        if (liveRegionRef.current) {
          const message = `Future value ${formatCurrency(results.futureValue)}, total contributions ${formatCurrency(results.totalContributions)}, interest earned ${formatCurrency(results.totalInterest)}`;
          liveRegionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [results.futureValue, results.totalContributions, results.totalInterest]);

  const handleExportCSV = useCallback(() => {
    exportInvestmentCSV({
      initial: inputs.initial,
      monthly: monthlyContribution,
      rate: effectiveRate,
      years: inputs.years,
      futureValue: results.futureValue,
      totalContributions: results.totalContributions,
      totalInterest: results.totalInterest,
      schedule: investmentSchedule
    });
  }, [inputs, monthlyContribution, effectiveRate, results, investmentSchedule]);

  const handleExportExcel = useCallback(() => {
    exportInvestmentExcel({
      initial: inputs.initial,
      monthly: monthlyContribution,
      rate: effectiveRate,
      years: inputs.years,
      futureValue: results.futureValue,
      totalContributions: results.totalContributions,
      totalInterest: results.totalInterest,
      schedule: investmentSchedule
    });
  }, [inputs, monthlyContribution, effectiveRate, results, investmentSchedule]);

  const handlePrint = useCallback(() => {
    printInvestment(
      {
        initial: inputs.initial,
        monthly: monthlyContribution,
        rate: effectiveRate,
        years: inputs.years,
        futureValue: results.futureValue,
        totalContributions: results.totalContributions,
        totalInterest: results.totalInterest,
        schedule: investmentSchedule
      },
      isDark
    );
  }, [
    inputs,
    monthlyContribution,
    effectiveRate,
    results,
    investmentSchedule,
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
          Investment Details
        </h2>
        <div className="space-y-3">
          <InputField
            label="Initial Investment"
            value={inputs.initial}
            onChange={(initial) => setInputs((prev) => ({ ...prev, initial }))}
            prefix="$"
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span
                id="contribution-label"
                className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              >
                Contribution
              </span>
              <div
                role="group"
                aria-labelledby="contribution-label"
                className="bg-accent flex rounded-lg p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={inputs.contributionFrequency === "monthly"}
                  onClick={() =>
                    setInputs((prev) => ({
                      ...prev,
                      contributionFrequency: "monthly"
                    }))
                  }
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition-all ${
                    inputs.contributionFrequency === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  aria-pressed={inputs.contributionFrequency === "yearly"}
                  onClick={() =>
                    setInputs((prev) => ({
                      ...prev,
                      contributionFrequency: "yearly"
                    }))
                  }
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition-all ${
                    inputs.contributionFrequency === "yearly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
            <InputField
              label=""
              value={inputs.contribution}
              onChange={(contribution) =>
                setInputs((prev) => ({ ...prev, contribution }))
              }
              prefix="$"
              id="contribution-input"
              aria-labelledby="contribution-label"
              allowNegative
            />
          </div>
        </div>

        <div className="pt-4">
          <h2 className="text-foreground mb-3 text-base font-semibold">
            Growth Assumptions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Expected Return"
              value={inputs.rate}
              onChange={(rate) => setInputs((prev) => ({ ...prev, rate }))}
              suffix="%"
              decimals={2}
              max={50}
            />
            <InputField
              label="Time Horizon"
              value={inputs.years}
              onChange={(years) => setInputs((prev) => ({ ...prev, years }))}
              suffix="yrs"
              min={1}
              max={250}
            />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {inputs.rate}% annual return, compounded monthly.
          </p>
        </div>

        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span
              id="inflation-toggle-label"
              className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
            >
              Inflation Adjustment
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={inputs.adjustForInflation}
              aria-labelledby="inflation-toggle-label"
              onClick={() =>
                setInputs((prev) => ({
                  ...prev,
                  adjustForInflation: !prev.adjustForInflation
                }))
              }
              className={`relative h-5 w-10 rounded-full transition-colors ${
                inputs.adjustForInflation ? "bg-destructive" : "bg-accent"
              }`}
            >
              <span
                aria-hidden="true"
                className={`bg-card absolute top-0.5 left-0.5 h-4 w-4 rounded-full shadow transition-transform ${
                  inputs.adjustForInflation ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {inputs.adjustForInflation && (
            <div className="animate-fade-in">
              <InputField
                label="Expected Inflation"
                value={inputs.inflation}
                onChange={(inflation) =>
                  setInputs((prev) => ({ ...prev, inflation }))
                }
                suffix="%"
                decimals={2}
                max={20}
              />
              <p className="text-muted-foreground mt-2 text-xs">
                Real return: {effectiveRate.toFixed(2)}% ({inputs.rate}% -{" "}
                {inputs.inflation}%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Results */}
      <div className="lg:overflow-y-auto lg:pb-4">
        <h2 className="text-foreground mb-4 text-base font-semibold">
          Results
        </h2>

        <div className="bg-destructive mb-4 rounded-2xl p-5">
          <p className="text-primary-foreground/70 mb-1 text-xs tracking-wide uppercase">
            Future Value {inputs.adjustForInflation && "(Real)"}
          </p>
          <p className="text-primary-foreground font-serif text-3xl">
            {formatCurrency(results.futureValue)}
          </p>
          <p className="text-primary-foreground/60 mt-1 text-xs">
            {growthMultiple}x your contributions
          </p>
        </div>

        <div className="bg-secondary mb-4 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                Contributions
              </p>
              <p className="text-foreground font-serif text-base">
                {formatCurrency(results.totalContributions)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                Interest Earned
              </p>
              <p className="text-foreground font-serif text-base">
                {formatCurrency(results.totalInterest)}
              </p>
            </div>
          </div>
        </div>

        {milestones.length > 1 && (
          <div className="bg-secondary mb-4 rounded-xl p-4">
            <h3 className="text-foreground mb-2 text-sm font-semibold">
              Milestones
            </h3>
            <div className="space-y-1.5 text-sm">
              {milestones.map((milestone) => (
                <div
                  key={milestone.year}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">
                    Year {milestone.year}
                  </span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(milestone.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-secondary rounded-xl p-4">
          <h3 className="text-foreground mb-2 text-sm font-semibold">
            Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial</span>
              <span className="text-foreground">
                {formatCurrency(inputs.initial)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {inputs.contributionFrequency === "yearly"
                  ? "Yearly"
                  : "Monthly"}
              </span>
              <span className="text-foreground">
                {formatCurrency(inputs.contribution)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Contributed</span>
              <span className="text-foreground">
                {formatCurrency(results.totalContributions)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Interest ({percentFromInterest}%)
              </span>
              <span className="text-foreground">
                {formatCurrency(results.totalInterest)}
              </span>
            </div>
            <div className="border-border flex justify-between border-t pt-2">
              <span className="text-foreground font-semibold">
                Future Value
              </span>
              <span className="text-foreground font-semibold">
                {formatCurrency(results.futureValue)}
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

        {investmentSchedule.length > 0 && (
          <div className="space-y-4">
            <InvestmentBreakdownChart
              contributions={results.totalContributions}
              interest={results.totalInterest}
            />
            <InvestmentStackedChart schedule={investmentSchedule} />
            <InvestmentGrowthChart schedule={investmentSchedule} />
          </div>
        )}
      </div>
    </div>
  );
}
