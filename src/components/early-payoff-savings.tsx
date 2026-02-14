import { formatCurrency } from "../lib/format";

interface EarlyPayoffSavingsProps {
  monthsSaved: number;
  interestSaved: number;
  actualMonths: number;
  originalYears: number;
}

export function EarlyPayoffSavings({
  monthsSaved,
  interestSaved,
  actualMonths,
  originalYears,
}: EarlyPayoffSavingsProps) {
  if (monthsSaved <= 0) return null;

  const yearsSaved = Math.floor(monthsSaved / 12);
  const remainingMonthsSaved = monthsSaved % 12;
  const actualYears = Math.floor(actualMonths / 12);
  const remainingActualMonths = actualMonths % 12;

  const formatTimeSaved = () => {
    if (yearsSaved > 0 && remainingMonthsSaved > 0) {
      return `${yearsSaved} yr${yearsSaved !== 1 ? "s" : ""} ${remainingMonthsSaved} mo`;
    } else if (yearsSaved > 0) {
      return `${yearsSaved} yr${yearsSaved !== 1 ? "s" : ""}`;
    } else {
      return `${remainingMonthsSaved} mo`;
    }
  };

  const formatActualTerm = () => {
    if (remainingActualMonths > 0) {
      return `${actualYears} yr ${remainingActualMonths} mo`;
    }
    return `${actualYears} yr`;
  };

  return (
    <div className="bg-sage/20 rounded-xl p-4 mb-4 border border-sage/30">
      <h3 className="text-sm font-semibold text-charcoal mb-2">Early Payoff Savings</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate uppercase tracking-wide">Time Saved</p>
          <p className="text-base font-serif text-charcoal">{formatTimeSaved()}</p>
        </div>
        <div>
          <p className="text-xs text-slate uppercase tracking-wide">Interest Saved</p>
          <p className="text-base font-serif text-charcoal">{formatCurrency(interestSaved)}</p>
        </div>
      </div>
      <p className="text-xs text-slate mt-2">
        Payoff: {formatActualTerm()} (vs {originalYears} yr)
      </p>
    </div>
  );
}
