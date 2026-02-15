export type GracePeriodType = "none" | "no_payment" | "interest_only";

const BALANCE_EPSILON = 0.005;
const MAX_MONTHS_MULTIPLIER = 2;

export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  numPayments: number
): number {
  if (monthlyRate === 0) {
    return principal / numPayments;
  }
  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

export interface AmortizationRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalPrincipal: number;
  totalInterest: number;
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number,
  periodType: "monthly" | "yearly" = "yearly"
): AmortizationRow[] {
  if (principal <= 0 || years <= 0) return [];

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  const monthlyPayment = calculateMonthlyPayment(
    principal,
    monthlyRate,
    numPayments
  );

  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalPrincipal = 0;
  let totalInterest = 0;

  if (periodType === "monthly") {
    for (let month = 1; month <= numPayments; month++) {
      const interest = balance * monthlyRate;
      const principalPaid = monthlyPayment - interest;
      balance = Math.max(0, balance - principalPaid);
      totalPrincipal += principalPaid;
      totalInterest += interest;

      schedule.push({
        period: month,
        payment: monthlyPayment,
        principal: principalPaid,
        interest,
        balance,
        totalPrincipal,
        totalInterest
      });
    }
  } else {
    // Yearly summary
    for (let year = 1; year <= years; year++) {
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      let yearlyPayment = 0;

      for (let month = 1; month <= 12; month++) {
        const interest = balance * monthlyRate;
        const principalPaid = monthlyPayment - interest;
        balance = Math.max(0, balance - principalPaid);
        yearlyPrincipal += principalPaid;
        yearlyInterest += interest;
        yearlyPayment += monthlyPayment;
        totalPrincipal += principalPaid;
        totalInterest += interest;
      }

      schedule.push({
        period: year,
        payment: yearlyPayment,
        principal: yearlyPrincipal,
        interest: yearlyInterest,
        balance,
        totalPrincipal,
        totalInterest
      });
    }
  }

  return schedule;
}

export interface InvestmentGrowthRow {
  year: number;
  contributions: number;
  interest: number;
  balance: number;
}

export function generateInvestmentSchedule(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number
): InvestmentGrowthRow[] {
  const schedule: InvestmentGrowthRow[] = [];
  const monthlyRate = annualRate / 100 / 12;

  let balance = initial;
  let totalContributions = initial;

  // Add year 0 (starting point)
  schedule.push({
    year: 0,
    contributions: initial,
    interest: 0,
    balance: initial
  });

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      const interest = balance * monthlyRate;
      balance += interest + monthly;
      totalContributions += monthly;
    }

    schedule.push({
      year,
      contributions: totalContributions,
      interest: balance - totalContributions,
      balance
    });
  }

  return schedule;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export interface LoanWithGraceResult extends LoanResult {
  gracePayment: number;
  principalAfterGrace: number;
  graceInterest: number;
}

export interface BalloonLoanResult {
  monthlyPayment: number;
  balloonPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export interface BulletLoanResult {
  monthlyPayment: number;
  finalPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export interface MortgageResult {
  monthlyPrincipalInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  totalMonthly: number;
  loanAmount: number;
  totalCost: number;
}

export interface InvestmentResult {
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
}

export function calculateLoanPayment(
  principal: number,
  annualRate: number,
  years: number
): LoanResult {
  if (principal <= 0 || years <= 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0 };
  }

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  const monthlyPayment = calculateMonthlyPayment(
    principal,
    monthlyRate,
    numPayments
  );

  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - principal;

  return { monthlyPayment, totalPayment, totalInterest };
}

export function calculateLoanWithGracePeriod(
  principal: number,
  annualRate: number,
  years: number,
  gracePeriodMonths: number,
  gracePeriodType: GracePeriodType
): LoanWithGraceResult {
  if (principal <= 0 || years <= 0) {
    return {
      monthlyPayment: 0,
      gracePayment: 0,
      totalPayment: 0,
      totalInterest: 0,
      principalAfterGrace: 0,
      graceInterest: 0
    };
  }

  const monthlyRate = annualRate / 100 / 12;
  const monthlyInterest = principal * monthlyRate;

  if (gracePeriodType === "none" || gracePeriodMonths === 0) {
    const result = calculateLoanPayment(principal, annualRate, years);
    return {
      ...result,
      gracePayment: 0,
      principalAfterGrace: principal,
      graceInterest: 0
    };
  }

  let principalAfterGrace = principal;
  let gracePayment = 0;
  let totalGracePayments = 0;
  let graceInterest = 0;

  if (gracePeriodType === "no_payment") {
    principalAfterGrace =
      principal * Math.pow(1 + monthlyRate, gracePeriodMonths);
    graceInterest = principalAfterGrace - principal;
    gracePayment = 0;
    totalGracePayments = 0;
  } else if (gracePeriodType === "interest_only") {
    gracePayment = monthlyInterest;
    totalGracePayments = gracePayment * gracePeriodMonths;
    graceInterest = totalGracePayments;
    principalAfterGrace = principal;
  }

  const numPayments = years * 12;
  const monthlyPayment = calculateMonthlyPayment(
    principalAfterGrace,
    monthlyRate,
    numPayments
  );
  const totalRegularPayments = monthlyPayment * numPayments;

  const totalPayment = totalGracePayments + totalRegularPayments;
  const totalInterest = totalPayment - principal;

  return {
    monthlyPayment,
    gracePayment,
    totalPayment,
    totalInterest,
    principalAfterGrace,
    graceInterest
  };
}

export function calculateBalloonLoan(
  principal: number,
  annualRate: number,
  years: number
): BalloonLoanResult {
  if (principal <= 0 || years <= 0) {
    return {
      monthlyPayment: 0,
      balloonPayment: 0,
      totalPayment: 0,
      totalInterest: 0
    };
  }

  const monthlyRate = annualRate / 100 / 12;
  const numMonths = years * 12;

  // Interest-only payments during the term
  const monthlyPayment = principal * monthlyRate;
  const totalInterestPayments = monthlyPayment * numMonths;

  // Principal paid at maturity
  const balloonPayment = principal;

  const totalPayment = totalInterestPayments + balloonPayment;
  const totalInterest = totalInterestPayments;

  return {
    monthlyPayment,
    balloonPayment,
    totalPayment,
    totalInterest
  };
}

export function calculateBulletLoan(
  principal: number,
  annualRate: number,
  years: number
): BulletLoanResult {
  if (principal <= 0 || years <= 0) {
    return {
      monthlyPayment: 0,
      finalPayment: 0,
      totalPayment: 0,
      totalInterest: 0
    };
  }

  const monthlyRate = annualRate / 100 / 12;
  const numMonths = years * 12;

  // No monthly payments
  const monthlyPayment = 0;

  // Interest compounds, full amount due at maturity
  const finalPayment = principal * Math.pow(1 + monthlyRate, numMonths);
  const totalInterest = finalPayment - principal;

  return {
    monthlyPayment,
    finalPayment,
    totalPayment: finalPayment,
    totalInterest
  };
}

export function calculateMortgage(
  homePrice: number,
  downPayment: number,
  annualRate: number,
  years: number,
  annualPropertyTax: number,
  annualInsurance: number,
  monthlyHoa: number = 0
): MortgageResult {
  const loanAmount = homePrice - downPayment;
  const { monthlyPayment } = calculateLoanPayment(
    loanAmount,
    annualRate,
    years
  );
  const monthlyPropertyTax = annualPropertyTax / 12;
  const monthlyInsurance = annualInsurance / 12;

  const totalMonthly =
    monthlyPayment + monthlyPropertyTax + monthlyInsurance + monthlyHoa;

  return {
    monthlyPrincipalInterest: monthlyPayment,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyHoa,
    totalMonthly,
    loanAmount,
    totalCost: totalMonthly * years * 12
  };
}

export interface APRResult {
  apr: number;
  effectiveLoanAmount: number;
}

export function calculateAPR(
  loanAmount: number,
  annualRate: number,
  years: number,
  closingCosts: number = 0
): APRResult {
  if (loanAmount <= 0 || years <= 0) {
    return { apr: 0, effectiveLoanAmount: 0 };
  }

  const effectiveLoanAmount = loanAmount - closingCosts;
  if (effectiveLoanAmount <= 0) {
    return { apr: annualRate, effectiveLoanAmount };
  }

  const numPayments = years * 12;
  const monthlyPayment = calculateMonthlyPayment(
    loanAmount,
    annualRate / 100 / 12,
    numPayments
  );

  let lowRate = 0;
  let highRate = annualRate * 2;
  let apr = annualRate;

  for (let i = 0; i < 100; i++) {
    const midRate = (lowRate + highRate) / 2;
    const monthlyMidRate = midRate / 100 / 12;

    let presentValue = 0;
    for (let n = 1; n <= numPayments; n++) {
      presentValue += monthlyPayment / Math.pow(1 + monthlyMidRate, n);
    }

    if (Math.abs(presentValue - effectiveLoanAmount) < 0.01) {
      apr = midRate;
      break;
    }

    if (presentValue > effectiveLoanAmount) {
      lowRate = midRate;
    } else {
      highRate = midRate;
    }
    apr = midRate;
  }

  return { apr, effectiveLoanAmount };
}

export function calculateInvestment(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number
): InvestmentResult {
  const monthlyRate = annualRate / 100 / 12;
  const numMonths = years * 12;

  const fvInitial = initial * Math.pow(1 + monthlyRate, numMonths);

  let fvContributions = 0;
  if (monthlyRate > 0) {
    fvContributions =
      monthly * ((Math.pow(1 + monthlyRate, numMonths) - 1) / monthlyRate);
  } else {
    fvContributions = monthly * numMonths;
  }

  const futureValue = fvInitial + fvContributions;
  const totalContributions = initial + monthly * numMonths;
  const totalInterest = futureValue - totalContributions;

  return { futureValue, totalContributions, totalInterest };
}

// Extra payment types
export type ExtraPaymentType =
  | "none"
  | "extra_monthly"
  | "extra_yearly"
  | "biweekly";

export interface ExtraPaymentConfig {
  type: ExtraPaymentType;
  extraMonthly: number; // Extra $ per month
  extraYearlyAmount: number; // Extra $ once per year
  extraYearlyMonth: number; // Which month (1-12) to apply extra yearly payment
}

export interface ExtraPaymentResult {
  // Standard loan info
  standardMonthlyPayment: number;
  standardTotalPayment: number;
  standardTotalInterest: number;
  standardMonths: number;
  // With extra payments
  actualMonths: number;
  actualTotalPayment: number;
  actualTotalInterest: number;
  // Savings
  monthsSaved: number;
  interestSaved: number;
  // Effective monthly payment (for display)
  effectiveMonthlyPayment: number;
}

export function calculateLoanWithExtraPayments(
  principal: number,
  annualRate: number,
  years: number,
  extraPayment: ExtraPaymentConfig
): ExtraPaymentResult {
  if (principal <= 0 || years <= 0) {
    return {
      standardMonthlyPayment: 0,
      standardTotalPayment: 0,
      standardTotalInterest: 0,
      standardMonths: 0,
      actualMonths: 0,
      actualTotalPayment: 0,
      actualTotalInterest: 0,
      monthsSaved: 0,
      interestSaved: 0,
      effectiveMonthlyPayment: 0
    };
  }

  const monthlyRate = annualRate / 100 / 12;
  const standardNumPayments = years * 12;
  const standardMonthlyPayment = calculateMonthlyPayment(
    principal,
    monthlyRate,
    standardNumPayments
  );

  const standardTotalPayment = standardMonthlyPayment * standardNumPayments;
  const standardTotalInterest = standardTotalPayment - principal;

  // If no extra payments, return standard results
  if (extraPayment.type === "none") {
    return {
      standardMonthlyPayment,
      standardTotalPayment,
      standardTotalInterest,
      standardMonths: standardNumPayments,
      actualMonths: standardNumPayments,
      actualTotalPayment: standardTotalPayment,
      actualTotalInterest: standardTotalInterest,
      monthsSaved: 0,
      interestSaved: 0,
      effectiveMonthlyPayment: standardMonthlyPayment
    };
  }

  // Simulate loan with extra payments
  let balance = principal;
  let totalPaid = 0;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = standardNumPayments * MAX_MONTHS_MULTIPLIER;

  // For biweekly: 26 payments/year = effectively 13 monthly payments
  // Extra monthly amount for biweekly
  const biweeklyExtra =
    extraPayment.type === "biweekly" ? standardMonthlyPayment / 12 : 0;

  while (balance > BALANCE_EPSILON && months < maxMonths) {
    months++;

    // Calculate interest for this month
    const interest = balance * monthlyRate;
    totalInterest += interest;

    // Base payment (capped at balance + interest)
    const payment = Math.min(standardMonthlyPayment, balance + interest);

    // Determine nominal extra based on type
    let extra = 0;
    if (extraPayment.type === "extra_monthly") {
      extra = extraPayment.extraMonthly;
    } else if (extraPayment.type === "biweekly") {
      extra = biweeklyExtra;
    } else if (
      extraPayment.type === "extra_yearly" &&
      months % 12 === extraPayment.extraYearlyMonth % 12
    ) {
      extra = extraPayment.extraYearlyAmount;
    }

    // Principal from base payment
    const basePrincipal = Math.max(0, payment - interest);

    // Extra applied is constrained by remaining balance after base principal
    const extraApplied = Math.min(extra, Math.max(0, balance - basePrincipal));

    // Total principal payment and balance update
    const principalPayment = basePrincipal + extraApplied;
    balance = Math.max(0, balance - principalPayment);

    // Add payment and actual extra used to total paid
    totalPaid += payment + extraApplied;
  }

  const monthsSaved = standardNumPayments - months;
  const interestSaved = standardTotalInterest - totalInterest;

  // Calculate effective monthly payment (average), guard against division by zero
  const effectiveMonthlyPayment = months > 0 ? totalPaid / months : 0;

  return {
    standardMonthlyPayment,
    standardTotalPayment,
    standardTotalInterest,
    standardMonths: standardNumPayments,
    actualMonths: months,
    actualTotalPayment: totalPaid,
    actualTotalInterest: totalInterest,
    monthsSaved: Math.max(0, monthsSaved),
    interestSaved: Math.max(0, interestSaved),
    effectiveMonthlyPayment
  };
}

export function generateAmortizationScheduleWithExtra(
  principal: number,
  annualRate: number,
  years: number,
  extraPayment: ExtraPaymentConfig,
  periodType: "monthly" | "yearly" = "yearly"
): AmortizationRow[] {
  if (principal <= 0 || years <= 0) return [];

  const monthlyRate = annualRate / 100 / 12;
  const standardNumPayments = years * 12;
  const standardMonthlyPayment = calculateMonthlyPayment(
    principal,
    monthlyRate,
    standardNumPayments
  );

  // For biweekly: effectively 13 monthly payments per year
  const biweeklyExtra =
    extraPayment.type === "biweekly" ? standardMonthlyPayment / 12 : 0;

  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalPrincipal = 0;
  let totalInterest = 0;
  let month = 0;

  if (periodType === "monthly") {
    while (
      balance > BALANCE_EPSILON &&
      month < standardNumPayments * MAX_MONTHS_MULTIPLIER
    ) {
      month++;
      const interest = balance * monthlyRate;

      // Calculate extra for this month
      let extra = 0;
      if (extraPayment.type === "extra_monthly") {
        extra = extraPayment.extraMonthly;
      } else if (extraPayment.type === "biweekly") {
        extra = biweeklyExtra;
      } else if (
        extraPayment.type === "extra_yearly" &&
        month % 12 === extraPayment.extraYearlyMonth % 12
      ) {
        extra = extraPayment.extraYearlyAmount;
      }

      const basePrincipal = standardMonthlyPayment - interest;
      const totalPrincipalPayment = Math.min(basePrincipal + extra, balance);
      const actualPayment = interest + totalPrincipalPayment;

      balance = Math.max(0, balance - totalPrincipalPayment);
      totalPrincipal += totalPrincipalPayment;
      totalInterest += interest;

      schedule.push({
        period: month,
        payment: actualPayment,
        principal: totalPrincipalPayment,
        interest,
        balance,
        totalPrincipal,
        totalInterest
      });
    }
  } else {
    let year = 0;
    while (balance > BALANCE_EPSILON && year < years * MAX_MONTHS_MULTIPLIER) {
      year++;
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      let yearlyPayment = 0;

      for (let m = 1; m <= 12 && balance > BALANCE_EPSILON; m++) {
        month++;
        const interest = balance * monthlyRate;

        // Calculate extra for this month
        let extra = 0;
        if (extraPayment.type === "extra_monthly") {
          extra = extraPayment.extraMonthly;
        } else if (extraPayment.type === "biweekly") {
          extra = biweeklyExtra;
        } else if (
          extraPayment.type === "extra_yearly" &&
          m === extraPayment.extraYearlyMonth
        ) {
          extra = extraPayment.extraYearlyAmount;
        }

        const basePrincipal = standardMonthlyPayment - interest;
        const totalPrincipalPayment = Math.min(basePrincipal + extra, balance);
        const actualPayment = interest + totalPrincipalPayment;

        balance = Math.max(0, balance - totalPrincipalPayment);
        yearlyPrincipal += totalPrincipalPayment;
        yearlyInterest += interest;
        yearlyPayment += actualPayment;
        totalPrincipal += totalPrincipalPayment;
        totalInterest += interest;
      }

      if (yearlyPayment > 0) {
        schedule.push({
          period: year,
          payment: yearlyPayment,
          principal: yearlyPrincipal,
          interest: yearlyInterest,
          balance,
          totalPrincipal,
          totalInterest
        });
      }
    }
  }

  return schedule;
}
