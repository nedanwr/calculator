import { useState } from "react";

import type { AmortizationRow } from "~/lib/calculations";
import { formatCurrency } from "~/lib/format";

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  periodLabel?: string;
}

export function AmortizationTable({
  schedule,
  periodLabel = "Year"
}: AmortizationTableProps) {
  const [expanded, setExpanded] = useState(false);
  const displayRows = expanded ? schedule : schedule.slice(0, 5);
  const hasMore = schedule.length > 5;

  if (schedule.length === 0) return null;

  return (
    <div className="bg-secondary overflow-hidden rounded-2xl p-4">
      <h3 className="text-foreground mb-3 text-sm font-semibold">
        Amortization Schedule
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b-2">
              <th className="text-muted-foreground px-2 py-2 text-left font-medium">
                {periodLabel}
              </th>
              <th className="text-muted-foreground px-2 py-2 text-right font-medium">
                Principal
              </th>
              <th className="text-muted-foreground px-2 py-2 text-right font-medium">
                Interest
              </th>
              <th className="text-muted-foreground px-2 py-2 text-right font-medium">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr key={row.period} className="border-border/50 border-b">
                <td className="text-foreground px-2 py-2">{row.period}</td>
                <td className="text-foreground px-2 py-2 text-right">
                  {formatCurrency(row.principal)}
                </td>
                <td className="text-muted-foreground px-2 py-2 text-right">
                  {formatCurrency(row.interest)}
                </td>
                <td className="text-foreground px-2 py-2 text-right font-medium">
                  {formatCurrency(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-destructive hover:destructive/80 mt-3 text-sm font-medium transition-colors"
        >
          {expanded
            ? "Show less"
            : `Show all ${schedule.length} ${periodLabel.toLowerCase()}s`}
        </button>
      )}
    </div>
  );
}
