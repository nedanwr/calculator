import { useEffect, useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useTheme } from "~/components/theme-provider";
import type { AmortizationRow, InvestmentGrowthRow } from "~/lib/calculations";
import { formatCurrency } from "~/lib/format";

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

function useChartColors() {
  const { isDark } = useTheme();

  return useMemo(
    () => ({
      principal: isDark ? "#f5f2ed" : "#2d2a26",
      interest: isDark ? "#e07a5f" : "#c45d3e",
      balance: "#7a9a7a",
      contributions: isDark ? "#f5f2ed" : "#2d2a26",
      growth: isDark ? "#e07a5f" : "#c45d3e",
      tax: "#6b8e6b",
      insurance: "#8b7355",
      hoa: "#d97b5d",
      other: "#9cb89c",
      text: isDark ? "#7a756e" : "#a09a90",
      axis: isDark ? "#444040" : "#e0dbd3",
      tooltip: {
        bg: isDark ? "#1a1917" : "#faf8f5",
        border: isDark ? "#444040" : "#e0dbd3",
        text: isDark ? "#f5f2ed" : "#2d2a26"
      }
    }),
    [isDark]
  );
}

type ChartColors = ReturnType<typeof useChartColors>;

function getTooltipProps(COLORS: ChartColors) {
  return {
    contentStyle: {
      backgroundColor: COLORS.tooltip.bg,
      border: `1px solid ${COLORS.tooltip.border}`,
      borderRadius: "8px",
      color: COLORS.tooltip.text,
      fontSize: "12px"
    },
    itemStyle: {
      color: COLORS.tooltip.text
    },
    labelStyle: {
      color: COLORS.tooltip.text
    }
  };
}

type ChartView = "balance" | "payments";

interface MonthlyCosts {
  tax?: number;
  insurance?: number;
  hoa?: number;
  other?: number;
}

interface BalanceChartProps {
  schedule: AmortizationRow[];
  periodLabel?: string;
  monthlyCosts?: MonthlyCosts;
}

export function BalanceChart({
  schedule,
  periodLabel = "Year",
  monthlyCosts
}: BalanceChartProps) {
  const [view, setView] = useState<ChartView>("balance");
  const COLORS = useChartColors();
  const reducedMotion = useReducedMotion();
  const gradientId = useId();
  const principalGradientId = `principal${gradientId}`;
  const interestGradientId = `interest${gradientId}`;

  if (schedule.length === 0) return null;

  const hasMonthlyCosts =
    monthlyCosts &&
    ((monthlyCosts.tax && monthlyCosts.tax > 0) ||
      (monthlyCosts.insurance && monthlyCosts.insurance > 0) ||
      (monthlyCosts.hoa && monthlyCosts.hoa > 0) ||
      (monthlyCosts.other && monthlyCosts.other > 0));

  const balanceData = schedule.map((row) => ({
    period: row.period,
    principal: row.totalPrincipal,
    interest: row.totalInterest
  }));

  const paymentsData = schedule.map((row) => {
    const monthsPerPeriod = periodLabel === "Year" ? 12 : 1;
    const periodsElapsed = row.period;

    const result: Record<string, number> = {
      period: row.period,
      principal: row.totalPrincipal,
      interest: row.totalInterest
    };

    if (hasMonthlyCosts) {
      if (monthlyCosts.tax)
        result["tax"] = monthlyCosts.tax * monthsPerPeriod * periodsElapsed;
      if (monthlyCosts.insurance)
        result["insurance"] =
          monthlyCosts.insurance * monthsPerPeriod * periodsElapsed;
      if (monthlyCosts.hoa)
        result["hoa"] = monthlyCosts.hoa * monthsPerPeriod * periodsElapsed;
      if (monthlyCosts.other)
        result["other"] = monthlyCosts.other * monthsPerPeriod * periodsElapsed;
    }

    return result;
  });

  const paymentLines = [
    { key: "principal", name: "Principal", color: COLORS.principal },
    { key: "interest", name: "Interest", color: COLORS.interest }
  ];

  if (hasMonthlyCosts) {
    if (monthlyCosts?.tax)
      paymentLines.push({
        key: "tax",
        name: "Property Tax",
        color: COLORS.tax
      });
    if (monthlyCosts?.insurance)
      paymentLines.push({
        key: "insurance",
        name: "Insurance",
        color: COLORS.insurance
      });
    if (monthlyCosts?.hoa)
      paymentLines.push({ key: "hoa", name: "HOA", color: COLORS.hoa });
    if (monthlyCosts?.other)
      paymentLines.push({ key: "other", name: "Other", color: COLORS.other });
  }

  return (
    <div className="bg-secondary rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">
          {view === "balance" ? "Principal & Interest" : "All Payments"}
        </h3>
        <div
          role="group"
          aria-label="Chart view"
          className="bg-accent flex rounded-lg p-0.5"
        >
          <button
            type="button"
            onClick={() => setView("balance")}
            aria-pressed={view === "balance"}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
              view === "balance"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Balance
          </button>
          <button
            type="button"
            onClick={() => setView("payments")}
            aria-pressed={view === "payments"}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
              view === "payments"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Payments
          </button>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {view === "balance" ? (
            <AreaChart
              data={balanceData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={principalGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={COLORS.principal}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.principal}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient
                  id={interestGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={COLORS.interest}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.interest}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: COLORS.text }}
                tickLine={false}
                axisLine={{ stroke: COLORS.axis }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: COLORS.text }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(label) => `${periodLabel} ${label}`}
                {...getTooltipProps(COLORS)}
              />
              <Area
                type="monotone"
                dataKey="principal"
                stroke={COLORS.principal}
                strokeWidth={2}
                fill={`url(#${principalGradientId})`}
                name="Principal Paid"
                isAnimationActive={!reducedMotion}
              />
              <Area
                type="monotone"
                dataKey="interest"
                stroke={COLORS.interest}
                strokeWidth={2}
                fill={`url(#${interestGradientId})`}
                name="Interest Paid"
                isAnimationActive={!reducedMotion}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={paymentsData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: COLORS.text }}
                tickLine={false}
                axisLine={{ stroke: COLORS.axis }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: COLORS.text }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(label) => `${periodLabel} ${label}`}
                {...getTooltipProps(COLORS)}
              />
              {paymentLines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={false}
                  name={line.name}
                  isAnimationActive={!reducedMotion}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {view === "balance" ? (
          <>
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS.principal }}
              />
              <span className="text-muted-foreground text-xs">Principal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS.interest }}
              />
              <span className="text-muted-foreground text-xs">Interest</span>
            </div>
          </>
        ) : (
          paymentLines.map((line) => (
            <div key={line.key} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              <span className="text-muted-foreground text-xs">{line.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface PaymentBreakdownChartProps {
  principal: number;
  interest: number;
}

export function PaymentBreakdownChart({
  principal,
  interest
}: PaymentBreakdownChartProps) {
  const COLORS = useChartColors();
  const reducedMotion = useReducedMotion();
  const total = principal + interest;
  if (total === 0) return null;

  const data = [
    { name: "Principal", value: principal, color: COLORS.principal },
    { name: "Interest", value: interest, color: COLORS.interest }
  ];

  const principalPercent = ((principal / total) * 100).toFixed(0);
  const interestPercent = ((interest / total) * 100).toFixed(0);

  return (
    <div className="bg-secondary rounded-2xl p-4">
      <h3 className="text-foreground mb-3 text-sm font-semibold">
        Total Payment Breakdown
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={!reducedMotion}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              {...getTooltipProps(COLORS)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.principal }}
          />
          <span className="text-muted-foreground text-xs">
            Principal ({principalPercent}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.interest }}
          />
          <span className="text-muted-foreground text-xs">
            Interest ({interestPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}

interface InvestmentGrowthChartProps {
  schedule: InvestmentGrowthRow[];
}

export function InvestmentGrowthChart({
  schedule
}: InvestmentGrowthChartProps) {
  const COLORS = useChartColors();
  const reducedMotion = useReducedMotion();
  const gradientId = useId();
  const totalGradientId = `total${gradientId}`;
  const contribGradientId = `contrib${gradientId}`;
  if (schedule.length === 0) return null;

  const data = schedule.map((row) => ({
    year: row.year,
    contributions: row.contributions,
    total: row.balance
  }));

  return (
    <div className="bg-secondary rounded-2xl p-4">
      <h3 className="text-foreground mb-3 text-sm font-semibold">
        Growth Over Time
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={totalGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.growth} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.growth} stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id={contribGradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={COLORS.contributions}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={COLORS.contributions}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: COLORS.text }}
              tickLine={false}
              axisLine={{ stroke: COLORS.axis }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: COLORS.text }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              labelFormatter={(label) => `Year ${label}`}
              {...getTooltipProps(COLORS)}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke={COLORS.growth}
              strokeWidth={2}
              fill={`url(#${totalGradientId})`}
              name="Total Value"
              isAnimationActive={!reducedMotion}
            />
            <Area
              type="monotone"
              dataKey="contributions"
              stroke={COLORS.contributions}
              strokeWidth={2}
              fill={`url(#${contribGradientId})`}
              name="Contributions"
              isAnimationActive={!reducedMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.growth }}
          />
          <span className="text-muted-foreground text-xs">Total Value</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.contributions }}
          />
          <span className="text-muted-foreground text-xs">Contributions</span>
        </div>
      </div>
    </div>
  );
}

interface InvestmentBreakdownChartProps {
  contributions: number;
  interest: number;
}

export function InvestmentBreakdownChart({
  contributions,
  interest
}: InvestmentBreakdownChartProps) {
  const COLORS = useChartColors();
  const reducedMotion = useReducedMotion();
  const total = contributions + interest;
  if (total === 0) return null;

  const data = [
    {
      name: "Contributions",
      value: contributions,
      color: COLORS.contributions
    },
    { name: "Interest Earned", value: interest, color: COLORS.growth }
  ];

  const contribPercent = ((contributions / total) * 100).toFixed(0);
  const interestPercent = ((interest / total) * 100).toFixed(0);

  return (
    <div className="bg-secondary rounded-2xl p-4">
      <h3 className="text-foreground mb-3 text-sm font-semibold">
        Final Value Breakdown
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={!reducedMotion}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              {...getTooltipProps(COLORS)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.contributions }}
          />
          <span className="text-muted-foreground text-xs">
            Contributions ({contribPercent}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.growth }}
          />
          <span className="text-muted-foreground text-xs">
            Interest ({interestPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}

interface InvestmentStackedChartProps {
  schedule: InvestmentGrowthRow[];
}

export function InvestmentStackedChart({
  schedule
}: InvestmentStackedChartProps) {
  const COLORS = useChartColors();
  const reducedMotion = useReducedMotion();
  const gradientId = useId();
  const contribStackGradientId = `contribStack${gradientId}`;
  const interestStackGradientId = `interestStack${gradientId}`;
  if (schedule.length === 0) return null;

  const data = schedule.map((row) => ({
    year: row.year,
    contributions: row.contributions,
    interest: row.interest
  }));

  return (
    <div className="bg-secondary rounded-2xl p-4">
      <h3 className="text-foreground mb-3 text-sm font-semibold">
        Contributions vs Interest
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={contribStackGradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={COLORS.contributions}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={COLORS.contributions}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient
                id={interestStackGradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={COLORS.growth} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.growth} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: COLORS.text }}
              tickLine={false}
              axisLine={{ stroke: COLORS.axis }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: COLORS.text }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              labelFormatter={(label) => `Year ${label}`}
              {...getTooltipProps(COLORS)}
            />
            <Area
              type="monotone"
              dataKey="contributions"
              stackId="1"
              stroke={COLORS.contributions}
              strokeWidth={2}
              fill={`url(#${contribStackGradientId})`}
              name="Contributions"
              isAnimationActive={!reducedMotion}
            />
            <Area
              type="monotone"
              dataKey="interest"
              stackId="1"
              stroke={COLORS.growth}
              strokeWidth={2}
              fill={`url(#${interestStackGradientId})`}
              name="Interest"
              isAnimationActive={!reducedMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.contributions }}
          />
          <span className="text-muted-foreground text-xs">Contributions</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS.growth }}
          />
          <span className="text-muted-foreground text-xs">Interest</span>
        </div>
      </div>
    </div>
  );
}

interface CustomCostItem {
  name: string;
  value: number;
}

interface MortgageCostChartProps {
  principal: number;
  interest: number;
  tax: number;
  insurance: number;
  hoa?: number;
  customCosts?: CustomCostItem[];
}

const CUSTOM_COST_COLORS = [
  "#9cb89c",
  "#b8a88a",
  "#a89090",
  "#8aa8b8",
  "#b8a0c0",
  "#c0b890"
];

export function MortgageCostChart({
  principal,
  interest,
  tax,
  insurance,
  hoa = 0,
  customCosts = []
}: MortgageCostChartProps) {
  const COLORS = useChartColors();
  const reducedMotion = useReducedMotion();
  const customCostsTotal = customCosts.reduce((sum, c) => sum + c.value, 0);
  const total = principal + interest + tax + insurance + hoa + customCostsTotal;
  if (total === 0) return null;

  const data = [
    { name: "Principal", value: principal, color: COLORS.principal },
    { name: "Interest", value: interest, color: COLORS.interest },
    { name: "Property Tax", value: tax, color: COLORS.tax },
    { name: "Insurance", value: insurance, color: COLORS.insurance },
    ...(hoa > 0 ? [{ name: "HOA", value: hoa, color: COLORS.hoa }] : []),
    ...customCosts
      .filter((c) => c.value > 0)
      .map((c, idx) => ({
        name: c.name || "Other",
        value: c.value,
        color: CUSTOM_COST_COLORS[idx % CUSTOM_COST_COLORS.length]
      }))
  ];

  return (
    <div className="bg-secondary rounded-2xl p-4">
      <h3 className="text-foreground mb-3 text-sm font-semibold">
        Total Cost Breakdown
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={!reducedMotion}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              {...getTooltipProps(COLORS)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center gap-1.5"
          >
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground text-xs">
              {item.name} ({((item.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
