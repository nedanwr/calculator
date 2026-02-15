export interface ResultCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  subtext?: string;
}

export function ResultCard({
  label,
  value,
  highlight,
  subtext
}: ResultCardProps) {
  return (
    <div
      className={`rounded-xl p-4 transition-all duration-300 ${highlight ? "bg-terracotta text-ivory" : "bg-cream text-charcoal"} `}
    >
      <p
        className={`mb-0.5 text-xs font-medium tracking-wide uppercase ${highlight ? "text-ivory/70" : "text-slate"}`}
      >
        {label}
      </p>
      <p
        className={`font-serif text-2xl ${highlight ? "text-ivory" : "text-charcoal"}`}
      >
        {value}
      </p>
      {subtext && (
        <p
          className={`mt-1 text-xs ${highlight ? "text-ivory/60" : "text-slate"}`}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
