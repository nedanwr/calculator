import { useId, useLayoutEffect, useRef, useState } from "react";

import { formatWithCommas, parseFormattedNumber } from "~/lib/format";

export interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  decimals?: number;
  id?: string;
  "aria-labelledby"?: string;
  allowNegative?: boolean;
}

export function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  decimals = 0,
  id,
  "aria-labelledby": ariaLabelledBy,
  allowNegative = false
}: InputFieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number>(0);

  const formatValue = (num: number): string => {
    const absValue = Math.abs(num);
    const str =
      decimals > 0 ? absValue.toString() : Math.floor(absValue).toString();
    const formatted = formatWithCommas(str);
    return num < 0 ? `-${formatted}` : formatted;
  };

  const [displayValue, setDisplayValue] = useState(() => formatValue(value));
  const [isFocused, setIsFocused] = useState(false);

  useLayoutEffect(() => {
    if (!isFocused) {
      const absValue = Math.abs(value);
      const str =
        decimals > 0 ? absValue.toString() : Math.floor(absValue).toString();
      const formatted = formatWithCommas(str);
      const formattedValue = value < 0 ? `-${formatted}` : formatted;
      if (formattedValue !== displayValue) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayValue(formattedValue);
      }
    }
  }, [value, isFocused, displayValue, decimals]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      input.setSelectionRange(cursorRef.current, cursorRef.current);
    }
  }, [displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const cursorPos = input.selectionStart || 0;

    const isNegative = allowNegative && rawValue.startsWith("-");

    let cleaned = rawValue.replace(/[^\d.]/g, "");

    const decimalIndex = cleaned.indexOf(".");
    if (decimalIndex !== -1) {
      cleaned =
        cleaned.slice(0, decimalIndex + 1) +
        cleaned.slice(decimalIndex + 1).replace(/\./g, "");
    }

    if (decimals === 0 && cleaned.includes(".")) {
      cleaned = cleaned.split(".")[0];
    } else if (decimals > 0 && cleaned.includes(".")) {
      const [intPart, decPart] = cleaned.split(".");
      cleaned = `${intPart}.${decPart.slice(0, decimals)}`;
    }

    const formatted = formatWithCommas(cleaned);
    const displayFormatted = isNegative ? `-${formatted}` : formatted;

    const charsToCount = allowNegative ? /[^\d.-]/g : /[^\d.]/g;
    const digitsBeforeCursor = rawValue
      .slice(0, cursorPos)
      .replace(charsToCount, "").length;

    let newCursor = 0;
    let digitCount = 0;
    for (
      let i = 0;
      i < displayFormatted.length && digitCount < digitsBeforeCursor;
      i++
    ) {
      newCursor = i + 1;
      if (/[\d.-]/.test(displayFormatted[i])) {
        digitCount++;
      }
    }
    cursorRef.current = newCursor;

    setDisplayValue(displayFormatted);

    const numericValue = parseFormattedNumber(displayFormatted);
    let constrained = numericValue;
    if (max !== undefined && numericValue > max) constrained = max;
    if (
      min !== undefined &&
      numericValue < min &&
      (!allowNegative || min !== 0)
    )
      constrained = min;
    onChange(constrained);
  };

  const handleBlur = () => {
    setIsFocused(false);
    let finalValue = value;
    if (min !== undefined && value < min && (!allowNegative || min !== 0)) {
      finalValue = min;
    }
    setDisplayValue(formatValue(finalValue));
    if (finalValue !== value) onChange(finalValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className="group">
      {label && (
        <label
          htmlFor={inputId}
          className="text-muted-foreground mb-1.5 block text-xs font-medium tracking-wide uppercase"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          id={inputId}
          aria-labelledby={ariaLabelledBy}
          className={`bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-card w-full rounded-xl border-2 py-3 text-base font-medium transition-all duration-200 ${prefix ? "pl-8" : "pl-3"} ${suffix ? "pr-12" : "pr-3"} `}
        />
        {suffix && (
          <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
