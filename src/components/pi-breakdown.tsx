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
    <div className="bg-secondary mb-4 rounded-xl p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Principal
          </p>
          <p className="text-foreground font-serif text-base">
            {formatCurrencyPrecise(principal)}
          </p>
          <p className="text-muted-foreground text-xs">
            {principalPercent.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Interest
          </p>
          <p className="text-foreground font-serif text-base">
            {formatCurrencyPrecise(interest)}
          </p>
          <p className="text-muted-foreground text-xs">
            {interestPercent.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
