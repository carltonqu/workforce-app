// Philippine Payroll Computation Engine
// Implements DOLE, BIR TRAIN Law, SSS, PhilHealth, Pag-IBIG 2024 rates

export interface PayrollInput {
  rateType: 'MONTHLY' | 'DAILY' | 'HOURLY';
  rate: number;
  periodType: 'WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY';
  periodStart: Date;
  periodEnd: Date;
  daysWorked: number;
  hoursWorked: number;
  lateMinutes: number;
  undertimeMinutes: number;
  absenceDays: number;
  regularOTHours: number;
  restDayOTHours: number;
  regularHolidayOTHours: number;
  specialHolidayOTHours: number;
  restDayRegularHolidayOTHours: number;
  restDaySpecialHolidayOTHours: number;
  nightDiffHours: number;
  regularHolidayWorkedHours: number;
  specialHolidayWorkedHours: number;
  regularHolidayRestDayWorkedHours: number;
  specialHolidayRestDayWorkedHours: number;
  regularHolidaysNotWorked: number;
  allowances: { name: string; amount: number; perDay?: boolean }[];
  otherDeductions: { name: string; amount: number }[];
}

export interface PayrollBreakdown {
  dailyRate: number;
  hourlyRate: number;
  basicPay: number;
  daysWorked: number;
  hoursWorked: number;
  lateMinutes: number;
  lateDeduction: number;
  undertimeMinutes: number;
  undertimeDeduction: number;
  absenceDays: number;
  absenceDeduction: number;
  regularOTPay: number;
  restDayOTPay: number;
  regularHolidayOTPay: number;
  specialHolidayOTPay: number;
  totalOTPay: number;
  nightDiffHours: number;
  nightDiffPay: number;
  regularHolidayPay: number;
  specialHolidayPay: number;
  totalHolidayPay: number;
  allowances: { name: string; amount: number }[];
  totalAllowances: number;
  grossPay: number;
  sssEmployee: number;
  sssEmployer: number;
  philhealthEmployee: number;
  philhealthEmployer: number;
  pagibigEmployee: number;
  pagibigEmployer: number;
  taxableIncome: number;
  withholdingTax: number;
  otherDeductions: { name: string; amount: number }[];
  totalOtherDeductions: number;
  netPay: number;
}

// ──────────────────────────────────────────────
// Government Contribution Helpers (monthly basis)
// ──────────────────────────────────────────────

export function computeSSS(monthlySalary: number): { employee: number; employer: number } {
  const msc = Math.min(Math.max(monthlySalary, 4000), 30000);
  return {
    employee: msc * 0.045,
    employer: msc * 0.095,
  };
}

export function computePhilHealth(monthlySalary: number): { employee: number; employer: number } {
  const basisMin = 10000;
  const basisMax = 100000;
  const basis = Math.min(Math.max(monthlySalary, basisMin), basisMax);
  const employeeShare = basis * 0.025;
  const employerShare = basis * 0.025;
  return {
    employee: employeeShare,
    employer: employerShare,
  };
}

export function computePagIbig(monthlySalary: number): { employee: number; employer: number } {
  const rate = monthlySalary <= 1500 ? 0.01 : 0.02;
  const employeeRaw = monthlySalary * rate;
  const employee = Math.min(employeeRaw, 100);
  const employer = monthlySalary * 0.02;
  return { employee, employer };
}

export function computeWithholdingTax(monthlyTaxableIncome: number): number {
  if (monthlyTaxableIncome <= 20833) {
    return 0;
  } else if (monthlyTaxableIncome <= 33332) {
    return (monthlyTaxableIncome - 20833) * 0.20;
  } else if (monthlyTaxableIncome <= 66666) {
    return 2500 + (monthlyTaxableIncome - 33333) * 0.25;
  } else if (monthlyTaxableIncome <= 166666) {
    return 10833.33 + (monthlyTaxableIncome - 66667) * 0.30;
  } else if (monthlyTaxableIncome <= 666666) {
    return 40833.33 + (monthlyTaxableIncome - 166667) * 0.32;
  } else {
    return 200833.33 + (monthlyTaxableIncome - 666667) * 0.35;
  }
}

// ──────────────────────────────────────────────
// Main Compute Function
// ──────────────────────────────────────────────

export function computePayroll(input: PayrollInput): PayrollBreakdown {
  const {
    rateType,
    rate,
    periodType,
    daysWorked,
    hoursWorked,
    lateMinutes,
    undertimeMinutes,
    absenceDays,
    regularOTHours,
    restDayOTHours,
    regularHolidayOTHours,
    specialHolidayOTHours,
    restDayRegularHolidayOTHours,
    restDaySpecialHolidayOTHours,
    nightDiffHours,
    regularHolidayWorkedHours,
    specialHolidayWorkedHours,
    regularHolidayRestDayWorkedHours,
    specialHolidayRestDayWorkedHours,
    allowances,
    otherDeductions,
  } = input;

  // ─── Derive daily / hourly rates ───
  let monthlyRate: number;
  let dailyRate: number;
  let hourlyRate: number;

  if (rateType === 'MONTHLY') {
    monthlyRate = rate;
    dailyRate = rate / 26;
    hourlyRate = dailyRate / 8;
  } else if (rateType === 'DAILY') {
    dailyRate = rate;
    monthlyRate = rate * 26;
    hourlyRate = rate / 8;
  } else {
    // HOURLY
    hourlyRate = rate;
    dailyRate = rate * 8;
    monthlyRate = dailyRate * 26;
  }

  // ─── Basic Pay ───
  const basicPay = dailyRate * daysWorked;

  // ─── Attendance Deductions ───
  const lateDeduction = (lateMinutes / 60) * hourlyRate;
  const undertimeDeduction = (undertimeMinutes / 60) * hourlyRate;
  const absenceDeduction = dailyRate * absenceDays;

  // ─── Overtime Pay ───
  const regularOTPay = hourlyRate * 1.25 * regularOTHours;
  const restDayOTPay = hourlyRate * 1.30 * restDayOTHours;
  const regularHolidayOTPay = hourlyRate * 2.00 * regularHolidayOTHours;
  const specialHolidayOTPay = hourlyRate * 1.30 * specialHolidayOTHours;
  const restDayRegularHolidayOTPay = hourlyRate * 2.60 * restDayRegularHolidayOTHours;
  const restDaySpecialHolidayOTPay = hourlyRate * 1.50 * restDaySpecialHolidayOTHours;
  const totalOTPay =
    regularOTPay +
    restDayOTPay +
    regularHolidayOTPay +
    specialHolidayOTPay +
    restDayRegularHolidayOTPay +
    restDaySpecialHolidayOTPay;

  // ─── Night Differential ───
  // +10% of hourly rate per ND hour
  const nightDiffPay = hourlyRate * 0.10 * nightDiffHours;

  // ─── Holiday Pay ───
  // Regular holiday WORKS: 200% for first 8h → extra 100% on top of basic
  // Special holiday WORKS: 130% for first 8h → extra 30% on top of basic
  // Regular + rest day works: 260% → extra 160%
  // Special + rest day works: 150% → extra 50%
  const regularHolidayPay = hourlyRate * 1.00 * Math.min(regularHolidayWorkedHours, 8); // extra 100% (200% total - basic 100%)
  const specialHolidayPay = hourlyRate * 0.30 * Math.min(specialHolidayWorkedHours, 8); // extra 30%
  const regularHolidayRestDayPay = hourlyRate * 1.60 * Math.min(regularHolidayRestDayWorkedHours, 8); // extra 160%
  const specialHolidayRestDayPay = hourlyRate * 0.50 * Math.min(specialHolidayRestDayWorkedHours, 8); // extra 50%
  const totalHolidayPay =
    regularHolidayPay +
    specialHolidayPay +
    regularHolidayRestDayPay +
    specialHolidayRestDayPay;

  // ─── Allowances ───
  const resolvedAllowances = allowances.map((a) => ({
    name: a.name,
    amount: a.perDay ? a.amount * daysWorked : a.amount,
  }));
  const totalAllowances = resolvedAllowances.reduce((sum, a) => sum + a.amount, 0);

  // ─── Gross Pay ───
  const grossPay =
    basicPay -
    lateDeduction -
    undertimeDeduction -
    absenceDeduction +
    totalOTPay +
    nightDiffPay +
    totalHolidayPay +
    totalAllowances;

  // ─── Government Deductions (monthly basis, then adjust for period) ───
  const periodDivisor = periodType === 'SEMI_MONTHLY' ? 2 : periodType === 'WEEKLY' ? 4 : 1;

  const sss = computeSSS(monthlyRate);
  const ph = computePhilHealth(monthlyRate);
  const pi = computePagIbig(monthlyRate);

  const sssEmployee = sss.employee / periodDivisor;
  const sssEmployer = sss.employer / periodDivisor;
  const philhealthEmployee = ph.employee / periodDivisor;
  const philhealthEmployer = ph.employer / periodDivisor;
  const pagibigEmployee = pi.employee / periodDivisor;
  const pagibigEmployer = pi.employer / periodDivisor;

  // ─── Taxable Income ───
  const taxableIncomePeriod =
    grossPay - sssEmployee - philhealthEmployee - pagibigEmployee;

  // Convert to monthly for tax bracket, then scale back
  const taxableIncomeMonthly = taxableIncomePeriod * periodDivisor;
  const monthlyTax = computeWithholdingTax(Math.max(taxableIncomeMonthly, 0));
  const withholdingTax = monthlyTax / periodDivisor;

  // ─── Other Deductions ───
  const totalOtherDeductions = otherDeductions.reduce((sum, d) => sum + d.amount, 0);

  // ─── Net Pay ───
  const netPay =
    grossPay -
    sssEmployee -
    philhealthEmployee -
    pagibigEmployee -
    withholdingTax -
    totalOtherDeductions;

  return {
    dailyRate,
    hourlyRate,
    basicPay,
    daysWorked,
    hoursWorked,
    lateMinutes,
    lateDeduction,
    undertimeMinutes,
    undertimeDeduction,
    absenceDays,
    absenceDeduction,
    regularOTPay,
    restDayOTPay,
    regularHolidayOTPay,
    specialHolidayOTPay,
    totalOTPay,
    nightDiffHours,
    nightDiffPay,
    regularHolidayPay,
    specialHolidayPay,
    totalHolidayPay,
    allowances: resolvedAllowances,
    totalAllowances,
    grossPay,
    sssEmployee,
    sssEmployer,
    philhealthEmployee,
    philhealthEmployer,
    pagibigEmployee,
    pagibigEmployer,
    taxableIncome: taxableIncomePeriod,
    withholdingTax,
    otherDeductions,
    totalOtherDeductions,
    netPay,
  };
}
