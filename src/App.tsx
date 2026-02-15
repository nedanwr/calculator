import { DollarSign, Home, Percent, TrendingUp } from "lucide-react";
import { lazy, Suspense, useCallback, useRef, useState } from "react";

import { ErrorBoundary } from "~/components/error-boundary";
import { ThemeSwitcher } from "~/components/theme-switcher";
import { Toaster } from "~/components/ui/sonner";

const LoanCalculator = lazy(() =>
  import("./components/calculators/loan-calculator").then((m) => ({
    default: m.LoanCalculator
  }))
);
const MortgageCalculator = lazy(() =>
  import("./components/calculators/mortgage-calculator").then((m) => ({
    default: m.MortgageCalculator
  }))
);
const InvestmentCalculator = lazy(() =>
  import("./components/calculators/investment-calculator").then((m) => ({
    default: m.InvestmentCalculator
  }))
);
const CurrencyConverter = lazy(() =>
  import("./components/calculators/currency-converter").then((m) => ({
    default: m.CurrencyConverter
  }))
);

type CalculatorMode = "loan" | "mortgage" | "investment" | "currency";

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>;

const modes: { id: CalculatorMode; label: string; icon: LucideIcon }[] = [
  { id: "loan", label: "Loan", icon: Percent },
  { id: "mortgage", label: "Mortgage", icon: Home },
  { id: "investment", label: "Invest", icon: TrendingUp },
  { id: "currency", label: "Currency", icon: DollarSign }
];

interface ModeButtonProps {
  mode: { id: CalculatorMode; label: string; icon: LucideIcon };
  isPressed: boolean;
  onClick: () => void;
  variant: "desktop" | "mobile";
}

function ModeButton({ mode: m, isPressed, onClick, variant }: ModeButtonProps) {
  const baseStyles =
    "rounded-lg font-medium text-sm tracking-wide transition-all duration-300 ease-out";
  const variantStyles =
    variant === "desktop"
      ? "flex items-center gap-1.5 py-2 px-4"
      : "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3";
  const stateStyles = isPressed
    ? "bg-primary text-primary-foreground shadow-md"
    : "text-muted-foreground hover:text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isPressed}
      className={`${baseStyles} ${variantStyles} ${stateStyles}`}
    >
      <m.icon size={16} aria-hidden="true" />
      {m.label}
    </button>
  );
}

interface ModeSwitcherProps {
  currentMode: CalculatorMode;
  onModeChange: (mode: CalculatorMode) => void;
  variant: "desktop" | "mobile";
  className?: string;
}

function ModeSwitcher({
  currentMode,
  onModeChange,
  variant,
  className = ""
}: ModeSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Calculator type"
      className={`bg-secondary flex rounded-xl p-1 ${className}`}
    >
      {modes.map((m) => (
        <ModeButton
          key={m.id}
          mode={m}
          isPressed={currentMode === m.id}
          onClick={() => onModeChange(m.id)}
          variant={variant}
        />
      ))}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading...</div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<CalculatorMode>("loan");
  const mainRef = useRef<HTMLElement>(null);

  const handleModeChange = useCallback((newMode: CalculatorMode) => {
    setMode(newMode);
    mainRef.current?.focus();
  }, []);

  return (
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      <Toaster />
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:outline-none"
      >
        Skip to main content
      </a>
      {/* Subtle texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Header */}
      <header className="border-border relative flex shrink-0 items-center justify-between border-b px-6 py-4 lg:px-10">
        <div className="flex items-center gap-8">
          <h1 className="text-foreground font-serif text-2xl md:text-3xl">
            Finesse
          </h1>
          <ModeSwitcher
            currentMode={mode}
            onModeChange={handleModeChange}
            variant="desktop"
            className="hidden sm:flex"
          />
        </div>
        <ThemeSwitcher />
      </header>

      {/* Mobile Mode Switcher */}
      <div className="border-border relative shrink-0 border-b px-4 py-3 sm:hidden">
        <ModeSwitcher
          currentMode={mode}
          onModeChange={handleModeChange}
          variant="mobile"
        />
      </div>

      {/* Main Content - Lazy loaded calculators */}
      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none"
      >
        <div className="mx-auto max-w-[1600px] px-4 py-4 lg:h-full xl:px-8">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {mode === "loan" && <LoanCalculator />}
              {mode === "mortgage" && <MortgageCalculator />}
              {mode === "investment" && <InvestmentCalculator />}
              {mode === "currency" && (
                <div className="flex h-full items-center justify-center py-8">
                  <CurrencyConverter />
                </div>
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default App;
