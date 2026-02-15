import { cn } from "~/lib/utils";

interface ToggleOption<T extends string> {
  id: T;
  label: string;
}

interface ToggleGroupProps<T extends string> {
  options: ToggleOption<T>[];
  selected: T;
  onChange: (id: T) => void;
  label?: string;
  columns?: 1 | 2 | 3 | 4;
  descriptions?: Record<T, string>;
  className?: string;
}

export function ToggleGroup<T extends string>({
  options,
  selected,
  onChange,
  label,
  columns = 3,
  descriptions,
  className
}: ToggleGroupProps<T>) {
  const gridCols = {
    1: "flex gap-1.5",
    2: "grid grid-cols-2 gap-1.5",
    3: "grid grid-cols-3 gap-1.5",
    4: "grid grid-cols-4 gap-1.5"
  };

  return (
    <div className={cn("border-sand border-t pt-3", className)}>
      {label && (
        <label className="text-slate mb-2 block text-xs font-medium tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className={gridCols[columns]}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-lg px-1.5 py-2 text-xs font-medium transition-all duration-200",
              "focus-visible:ring-terracotta focus:outline-none focus-visible:ring-2",
              selected === option.id
                ? "bg-charcoal text-ivory"
                : "bg-cream text-slate hover:text-charcoal border-sand border"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {descriptions && descriptions[selected] && (
        <p className="text-slate mt-2 text-xs">{descriptions[selected]}</p>
      )}
    </div>
  );
}
