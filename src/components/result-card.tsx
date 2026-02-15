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
      className={`rounded-xl p-4 transition-all duration-300 ${highlight ? "bg-destructive text-primary-foreground" : "bg-secondary text-foreground"} `}
    >
      <p
        className={`mb-0.5 text-xs font-medium tracking-wide uppercase ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <p
        className={`font-serif text-2xl ${highlight ? "text-primary-foreground" : "text-foreground"}`}
      >
        {value}
      </p>
      {subtext && (
        <p
          className={`mt-1 text-xs ${highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
