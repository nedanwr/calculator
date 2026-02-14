interface ButtonOption<T extends string> {
  id: T;
  label: string;
}

interface ButtonGroupProps<T extends string> {
  options: ButtonOption<T>[];
  selected: T;
  onChange: (id: T) => void;
  label?: string;
  columns?: 1 | 2 | 3 | 4;
  descriptions?: Record<T, string>;
}

export function ButtonGroup<T extends string>({
  options,
  selected,
  onChange,
  label,
  columns = 3,
  descriptions,
}: ButtonGroupProps<T>) {
  const gridCols = {
    1: "flex gap-1.5",
    2: "grid grid-cols-2 gap-1.5",
    3: "grid grid-cols-3 gap-1.5",
    4: "grid grid-cols-4 gap-1.5",
  };

  return (
    <div className="pt-3 border-t border-sand">
      {label && (
        <label className="block text-xs font-medium text-slate mb-2 tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className={gridCols[columns]}>
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`
              py-2 px-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${
                selected === option.id
                  ? "bg-charcoal text-ivory"
                  : "bg-cream text-slate hover:text-charcoal border border-sand"
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
      {descriptions && descriptions[selected] && (
        <p className="text-xs text-slate mt-2">{descriptions[selected]}</p>
      )}
    </div>
  );
}
