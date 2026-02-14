import { formatCurrencyPrecise } from "../lib/format";

interface PIBreakdownProps {
  principal: number;
  interest: number;
  principalPercent: number;
  interestPercent: number;
}

export function PIBreakdown({
  principal,
  interest,
  principalPercent,
  interestPercent,
}: PIBreakdownProps) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <div className="bg-cream rounded-xl p-3">
        <p className="text-xs text-slate uppercase tracking-wide">Principal</p>
        <p className="text-base font-serif text-charcoal">
          {formatCurrencyPrecise(principal)}
        </p>
        <p className="text-xs text-slate">{principalPercent.toFixed(0)}%</p>
      </div>
      <div className="bg-cream rounded-xl p-3">
        <p className="text-xs text-slate uppercase tracking-wide">Interest</p>
        <p className="text-base font-serif text-charcoal">
          {formatCurrencyPrecise(interest)}
        </p>
        <p className="text-xs text-slate">{interestPercent.toFixed(0)}%</p>
      </div>
    </div>
  );
}
