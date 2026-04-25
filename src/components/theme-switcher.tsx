import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "~/lib/utils";

import { useTheme } from "./theme-provider";

const options = [
  { id: "light" as const, icon: Sun },
  { id: "system" as const, icon: Monitor },
  { id: "dark" as const, icon: Moon }
];

const themeLabels = {
  light: "Light",
  system: "System",
  dark: "Dark"
} as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="tablist"
      aria-label="Theme selection"
      className="bg-secondary border-border flex items-center gap-1 rounded-xl border p-1 shadow-sm"
    >
      {options.map(({ id, icon: Icon }) => {
        const isSelected = theme === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            onClick={() => setTheme(id)}
            aria-selected={isSelected}
            aria-label={`${themeLabels[id]} theme`}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg transition-all duration-200",
              "focus-visible:ring-ring focus:outline-none focus-visible:ring-2",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
          >
            <Icon size={16} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
