import { formatCurrencyPrecise } from "~/lib/format";

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
  interestPercent
}: PIBreakdownProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      <div className="bg-cream rounded-xl p-3">
        <p className="text-slate text-xs tracking-wide uppercase">Principal</p>
        <p className="text-charcoal font-serif text-base">
          {formatCurrencyPrecise(principal)}
        </p>
        <p className="text-slate text-xs">{principalPercent.toFixed(0)}%</p>
      </div>
      <div className="bg-cream rounded-xl p-3">
        <p className="text-slate text-xs tracking-wide uppercase">Interest</p>
        <p className="text-charcoal font-serif text-base">
          {formatCurrencyPrecise(interest)}
        </p>
        <p className="text-slate text-xs">{interestPercent.toFixed(0)}%</p>
      </div>
    </div>
  );
}
