import { describe, expect, it } from "vitest";

import {
  calculateBalloonLoan,
  calculateBulletLoan,
  calculateInvestment,
  calculateLoanPayment,
  calculateLoanWithExtraPayments,
  calculateLoanWithGracePeriod,
  calculateMortgage,
  generateAmortizationSchedule,
  generateAmortizationScheduleWithExtra,
  generateInvestmentSchedule
} from "./calculations";

describe("calculateLoanPayment", () => {
  it("returns zeros for invalid inputs", () => {
    expect(calculateLoanPayment(0, 5, 30)).toEqual({
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0
    });
    expect(calculateLoanPayment(100000, 5, 0)).toEqual({
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0
    });
    expect(calculateLoanPayment(-100000, 5, 30)).toEqual({
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0
    });
  });

  it("calculates standard loan correctly", () => {
    const result = calculateLoanPayment(100000, 6, 30);
    expect(result.monthlyPayment).toBeCloseTo(599.55, 2);
    expect(result.totalPayment).toBeCloseTo(215838.19, 0);
    expect(result.totalInterest).toBeCloseTo(115838.19, 0);
  });

  it("handles zero interest rate", () => {
    const result = calculateLoanPayment(120000, 0, 10);
    expect(result.monthlyPayment).toBe(1000);
    expect(result.totalPayment).toBe(120000);
    expect(result.totalInterest).toBe(0);
  });

  it("calculates short-term loan correctly", () => {
    const result = calculateLoanPayment(10000, 5, 1);
    expect(result.monthlyPayment).toBeCloseTo(856.07, 2);
    expect(result.totalPayment).toBeCloseTo(10272.9, 0);
    expect(result.totalInterest).toBeCloseTo(272.9, 0);
  });
});

describe("calculateLoanWithGracePeriod", () => {
  it("returns zeros for invalid inputs", () => {
    const result = calculateLoanWithGracePeriod(0, 5, 30, 6, "none");
    expect(result.monthlyPayment).toBe(0);
    expect(result.totalPayment).toBe(0);
  });

  it("handles no grace period", () => {
    const result = calculateLoanWithGracePeriod(100000, 6, 30, 0, "none");
    const standard = calculateLoanPayment(100000, 6, 30);
    expect(result.monthlyPayment).toBeCloseTo(standard.monthlyPayment, 2);
    expect(result.gracePayment).toBe(0);
    expect(result.graceInterest).toBe(0);
  });

  it("calculates interest-only grace period", () => {
    const result = calculateLoanWithGracePeriod(
      100000,
      6,
      30,
      6,
      "interest_only"
    );
    expect(result.gracePayment).toBeCloseTo(500, 2);
    expect(result.graceInterest).toBeCloseTo(3000, 2);
    expect(result.principalAfterGrace).toBe(100000);
  });

  it("calculates no-payment grace period", () => {
    const result = calculateLoanWithGracePeriod(100000, 6, 30, 6, "no_payment");
    expect(result.gracePayment).toBe(0);
    expect(result.principalAfterGrace).toBeGreaterThan(100000);
    expect(result.graceInterest).toBeGreaterThan(0);
  });
});

describe("calculateBalloonLoan", () => {
  it("returns zeros for invalid inputs", () => {
    const result = calculateBalloonLoan(0, 5, 30);
    expect(result.monthlyPayment).toBe(0);
    expect(result.balloonPayment).toBe(0);
  });

  it("calculates balloon loan correctly", () => {
    const result = calculateBalloonLoan(100000, 6, 5);
    expect(result.monthlyPayment).toBeCloseTo(500, 2);
    expect(result.balloonPayment).toBe(100000);
    expect(result.totalInterest).toBeCloseTo(30000, 0);
  });
});

describe("calculateBulletLoan", () => {
  it("returns zeros for invalid inputs", () => {
    const result = calculateBulletLoan(0, 5, 30);
    expect(result.monthlyPayment).toBe(0);
    expect(result.finalPayment).toBe(0);
  });

  it("calculates bullet loan correctly", () => {
    const result = calculateBulletLoan(100000, 6, 5);
    expect(result.monthlyPayment).toBe(0);
    expect(result.finalPayment).toBeCloseTo(134885.02, 2);
    expect(result.totalInterest).toBeCloseTo(34885.02, 2);
  });
});

describe("calculateMortgage", () => {
  it("calculates mortgage with all components", () => {
    const result = calculateMortgage(500000, 100000, 4, 30, 6000, 2400, 200);
    expect(result.loanAmount).toBe(400000);
    expect(result.monthlyPrincipalInterest).toBeCloseTo(1909.66, 2);
    expect(result.monthlyPropertyTax).toBe(500);
    expect(result.monthlyInsurance).toBe(200);
    expect(result.monthlyHoa).toBe(200);
    expect(result.totalMonthly).toBeCloseTo(2809.66, 2);
  });

  it("handles zero down payment", () => {
    const result = calculateMortgage(500000, 0, 4, 30, 6000, 2400);
    expect(result.loanAmount).toBe(500000);
  });
});

describe("calculateInvestment", () => {
  it("calculates investment growth correctly", () => {
    const result = calculateInvestment(10000, 500, 7, 10);
    expect(result.totalContributions).toBe(70000);
    expect(result.futureValue).toBeGreaterThan(70000);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  it("handles zero interest rate", () => {
    const result = calculateInvestment(10000, 500, 0, 10);
    expect(result.totalContributions).toBe(70000);
    expect(result.futureValue).toBe(70000);
    expect(result.totalInterest).toBe(0);
  });

  it("handles zero initial investment", () => {
    const result = calculateInvestment(0, 500, 7, 10);
    expect(result.totalContributions).toBe(60000);
    expect(result.futureValue).toBeGreaterThan(60000);
  });
});

describe("calculateLoanWithExtraPayments", () => {
  it("returns zeros for invalid inputs", () => {
    const result = calculateLoanWithExtraPayments(0, 5, 30, {
      type: "none",
      extraMonthly: 0,
      extraYearlyAmount: 0,
      extraYearlyMonth: 1
    });
    expect(result.standardMonthlyPayment).toBe(0);
    expect(result.actualMonths).toBe(0);
  });

  it("returns standard results with no extra payments", () => {
    const result = calculateLoanWithExtraPayments(100000, 6, 30, {
      type: "none",
      extraMonthly: 0,
      extraYearlyAmount: 0,
      extraYearlyMonth: 1
    });
    expect(result.monthsSaved).toBe(0);
    expect(result.interestSaved).toBe(0);
    expect(result.actualMonths).toBe(360);
  });

  it("calculates extra monthly payments correctly", () => {
    const result = calculateLoanWithExtraPayments(100000, 6, 30, {
      type: "extra_monthly",
      extraMonthly: 200,
      extraYearlyAmount: 0,
      extraYearlyMonth: 1
    });
    expect(result.actualMonths).toBeLessThan(360);
    expect(result.monthsSaved).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
  });

  it("calculates biweekly payments correctly", () => {
    const result = calculateLoanWithExtraPayments(100000, 6, 30, {
      type: "biweekly",
      extraMonthly: 0,
      extraYearlyAmount: 0,
      extraYearlyMonth: 1
    });
    expect(result.actualMonths).toBeLessThan(360);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });

  it("calculates extra yearly payments correctly", () => {
    const result = calculateLoanWithExtraPayments(100000, 6, 30, {
      type: "extra_yearly",
      extraMonthly: 0,
      extraYearlyAmount: 1000,
      extraYearlyMonth: 1
    });
    expect(result.actualMonths).toBeLessThan(360);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });
});

describe("generateAmortizationSchedule", () => {
  it("returns empty array for invalid inputs", () => {
    expect(generateAmortizationSchedule(0, 5, 30)).toEqual([]);
    expect(generateAmortizationSchedule(100000, 5, 0)).toEqual([]);
  });

  it("generates monthly schedule with correct number of rows", () => {
    const schedule = generateAmortizationSchedule(100000, 6, 1, "monthly");
    expect(schedule.length).toBe(12);
  });

  it("generates yearly schedule with correct number of rows", () => {
    const schedule = generateAmortizationSchedule(100000, 6, 5, "yearly");
    expect(schedule.length).toBe(5);
  });

  it("balance reaches zero at end of term", () => {
    const schedule = generateAmortizationSchedule(100000, 6, 1, "monthly");
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 2);
  });

  it("total principal equals loan amount", () => {
    const schedule = generateAmortizationSchedule(100000, 6, 5, "yearly");
    const lastRow = schedule[schedule.length - 1];
    expect(lastRow.totalPrincipal).toBeCloseTo(100000, 0);
  });
});

describe("generateInvestmentSchedule", () => {
  it("generates correct number of years", () => {
    const schedule = generateInvestmentSchedule(10000, 500, 7, 10);
    expect(schedule.length).toBe(11);
    expect(schedule[0].year).toBe(0);
    expect(schedule[schedule.length - 1].year).toBe(10);
  });

  it("initial year shows only initial investment", () => {
    const schedule = generateInvestmentSchedule(10000, 500, 7, 10);
    expect(schedule[0].contributions).toBe(10000);
    expect(schedule[0].balance).toBe(10000);
    expect(schedule[0].interest).toBe(0);
  });

  it("balance grows over time", () => {
    const schedule = generateInvestmentSchedule(10000, 500, 7, 10);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].balance).toBeGreaterThan(schedule[i - 1].balance);
    }
  });
});

describe("generateAmortizationScheduleWithExtra", () => {
  it("returns empty array for invalid inputs", () => {
    const result = generateAmortizationScheduleWithExtra(0, 5, 30, {
      type: "none",
      extraMonthly: 0,
      extraYearlyAmount: 0,
      extraYearlyMonth: 1
    });
    expect(result).toEqual([]);
  });

  it("generates shorter schedule with extra payments", () => {
    const standard = generateAmortizationSchedule(100000, 6, 30, "yearly");
    const extra = generateAmortizationScheduleWithExtra(
      100000,
      6,
      30,
      {
        type: "extra_monthly",
        extraMonthly: 200,
        extraYearlyAmount: 0,
        extraYearlyMonth: 1
      },
      "yearly"
    );
    expect(extra.length).toBeLessThan(standard.length);
  });
});

describe("Edge cases and precision", () => {
  it("handles very small loan amounts", () => {
    const result = calculateLoanPayment(1000, 5, 1);
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.monthlyPayment).toBeLessThan(1000);
  });

  it("handles very high interest rates", () => {
    const result = calculateLoanPayment(10000, 50, 1);
    expect(result.monthlyPayment).toBeGreaterThan(400);
    expect(result.totalInterest).toBeGreaterThan(2000);
  });

  it("handles very long loan terms", () => {
    const result = calculateLoanPayment(100000, 5, 50);
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.totalInterest).toBeGreaterThan(result.totalPayment * 0.5);
  });

  it("calculates correctly with decimal interest rate", () => {
    const result = calculateLoanPayment(100000, 5.5, 30);
    expect(result.monthlyPayment).toBeCloseTo(567.79, 2);
  });
});
