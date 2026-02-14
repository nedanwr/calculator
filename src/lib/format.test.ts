import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatWithCommas,
  parseFormattedNumber,
} from "./format";

describe("formatCurrency", () => {
  it("formats whole numbers without decimals", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
    expect(formatCurrency(1000000)).toBe("$1,000,000");
  });

  it("rounds decimals to whole numbers", () => {
    expect(formatCurrency(1000.5)).toBe("$1,001");
    expect(formatCurrency(1000.49)).toBe("$1,000");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("handles negative numbers", () => {
    expect(formatCurrency(-1000)).toBe("-$1,000");
  });

  it("handles small numbers", () => {
    expect(formatCurrency(1)).toBe("$1");
    expect(formatCurrency(10)).toBe("$10");
  });
});

describe("formatCurrencyPrecise", () => {
  it("formats numbers with two decimal places", () => {
    expect(formatCurrencyPrecise(1000)).toBe("$1,000.00");
    expect(formatCurrencyPrecise(1000.5)).toBe("$1,000.50");
  });

  it("supports different currency codes", () => {
    expect(formatCurrencyPrecise(1000, "EUR")).toBe("€1,000.00");
    expect(formatCurrencyPrecise(1000, "GBP")).toBe("£1,000.00");
    expect(formatCurrencyPrecise(1000, "JPY")).toMatch(/¥|JP/);
  });

  it("defaults to USD", () => {
    expect(formatCurrencyPrecise(1000)).toBe("$1,000.00");
    expect(formatCurrencyPrecise(1000, undefined)).toBe("$1,000.00");
  });
});

describe("formatWithCommas", () => {
  it("adds commas to large numbers", () => {
    expect(formatWithCommas("1000000")).toBe("1,000,000");
    expect(formatWithCommas("1000")).toBe("1,000");
  });

  it("preserves decimal places", () => {
    expect(formatWithCommas("1000.50")).toBe("1,000.50");
    expect(formatWithCommas("1000000.123")).toBe("1,000,000.123");
  });

  it("handles already formatted numbers", () => {
    expect(formatWithCommas("1,000,000")).toBe("1,000,000");
  });

  it("handles empty string", () => {
    expect(formatWithCommas("")).toBe("");
  });

  it("handles small numbers without commas", () => {
    expect(formatWithCommas("100")).toBe("100");
    expect(formatWithCommas("10")).toBe("10");
  });

  it("handles numbers starting with decimal", () => {
    expect(formatWithCommas(".5")).toBe(".5");
    expect(formatWithCommas(".123")).toBe(".123");
  });
});

describe("parseFormattedNumber", () => {
  it("parses numbers with commas", () => {
    expect(parseFormattedNumber("1,000,000")).toBe(1000000);
    expect(parseFormattedNumber("1,000")).toBe(1000);
  });

  it("parses decimal numbers", () => {
    expect(parseFormattedNumber("1000.50")).toBe(1000.5);
    expect(parseFormattedNumber("1,000.25")).toBe(1000.25);
  });

  it("returns 0 for invalid input", () => {
    expect(parseFormattedNumber("")).toBe(0);
    expect(parseFormattedNumber("abc")).toBe(0);
  });

  it("parses negative numbers", () => {
    expect(parseFormattedNumber("-1000")).toBe(-1000);
    expect(parseFormattedNumber("-1,000")).toBe(-1000);
  });

  it("handles whitespace", () => {
    expect(parseFormattedNumber("  1000  ")).toBe(1000);
  });
});