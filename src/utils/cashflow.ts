import type { Transaction } from '../types/finance';

export interface MonthlyCashflow {
  month: string; // YYYY-MM
  monthLabel: string; // e.g. "Sep 2026"
  inflow: number;
  outflow: number;
  net: number;
  savingsRate: number; // percentage (-100 to 100+)
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  previousMonthAmount?: number;
  monthOverMonthChange?: number; // delta in currency
  monthOverMonthPercent?: number; // delta percentage
}

export interface CashflowAnalytics {
  months: MonthlyCashflow[];
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  averageMonthlyInflow: number;
  averageMonthlyOutflow: number;
  averageMonthlyNet: number;
  overallSavingsRate: number;
  bestMonth: MonthlyCashflow | null;
  lowestMonth: MonthlyCashflow | null;
  selectedMonth: string;
  categoryExpenses: CategoryExpense[];
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatMonthLabel(monthStr: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr)) {
    return monthStr;
  }

  const [yearStr, monthNumStr] = monthStr.split('-');
  const monthIdx = parseInt(monthNumStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] ?? monthNumStr;

  return `${monthName} ${yearStr}`;
}

export function getPreviousMonth(monthStr: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr)) {
    return monthStr;
  }

  const [yearStr, monthNumStr] = monthStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthNumStr, 10);

  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getMonthWindow(
  endMonth: string,
  count: number = 6
): string[] {
  const result: string[] = [];
  let current = endMonth;

  for (let i = 0; i < count; i += 1) {
    result.unshift(current);
    current = getPreviousMonth(current);
  }

  return result;
}

export function calculateMonthlyCashflow(
  transactions: Transaction[],
  month: string
): MonthlyCashflow {
  const monthTxs = transactions.filter(
    (tx) =>
      typeof tx.date === 'string' && tx.date.startsWith(month)
  );

  let inflow = 0;
  let outflow = 0;

  for (const tx of monthTxs) {
    if (
      !Number.isFinite(tx.amount) ||
      tx.amount <= 0
    ) {
      continue;
    }

    if (tx.type === 'income') {
      inflow += tx.amount;
    } else if (tx.type === 'expense') {
      outflow += tx.amount;
    }
  }

  const net = inflow - outflow;
  let savingsRate = 0;

  if (inflow > 0) {
    savingsRate = ((inflow - outflow) / inflow) * 100;
  } else if (outflow > 0) {
    savingsRate = -100;
  }

  return {
    month,
    monthLabel: formatMonthLabel(month),
    inflow,
    outflow,
    net,
    savingsRate,
  };
}

export function calculateCategoryExpenses(
  transactions: Transaction[],
  month: string,
  previousMonth?: string
): CategoryExpense[] {
  const currentMonthExpenses = transactions.filter(
    (tx) =>
      tx.type === 'expense' &&
      typeof tx.date === 'string' &&
      tx.date.startsWith(month) &&
      Number.isFinite(tx.amount) &&
      tx.amount > 0
  );

  const prevMonthExpenses = previousMonth
    ? transactions.filter(
        (tx) =>
          tx.type === 'expense' &&
          typeof tx.date === 'string' &&
          tx.date.startsWith(previousMonth) &&
          Number.isFinite(tx.amount) &&
          tx.amount > 0
      )
    : [];

  const categoryMap = new Map<
    string,
    { category: string; amount: number; count: number }
  >();

  for (const tx of currentMonthExpenses) {
    const rawCategory = tx.category.trim();
    if (!rawCategory) {
      continue;
    }

    const key = rawCategory.toLowerCase();
    const existing = categoryMap.get(key);

    if (existing) {
      existing.amount += tx.amount;
      existing.count += 1;
    } else {
      categoryMap.set(key, {
        category: rawCategory,
        amount: tx.amount,
        count: 1,
      });
    }
  }

  const prevMap = new Map<string, number>();
  for (const tx of prevMonthExpenses) {
    const rawCategory = tx.category.trim();
    if (!rawCategory) {
      continue;
    }

    const key = rawCategory.toLowerCase();
    prevMap.set(key, (prevMap.get(key) ?? 0) + tx.amount);
  }

  const totalOutflow = Array.from(categoryMap.values()).reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const result: CategoryExpense[] = [];

  for (const [key, item] of categoryMap.entries()) {
    const percentage =
      totalOutflow > 0 ? (item.amount / totalOutflow) * 100 : 0;
    const prevAmount = prevMap.get(key);

    let change: number | undefined;
    let changePercent: number | undefined;

    if (previousMonth !== undefined) {
      const prevVal = prevAmount ?? 0;
      change = item.amount - prevVal;
      if (prevVal > 0) {
        changePercent = ((item.amount - prevVal) / prevVal) * 100;
      }
    }

    result.push({
      category: item.category,
      amount: item.amount,
      percentage,
      transactionCount: item.count,
      previousMonthAmount: prevAmount,
      monthOverMonthChange: change,
      monthOverMonthPercent: changePercent,
    });
  }

  // Sort descending by amount
  return result.sort((a, b) => b.amount - a.amount);
}

export function calculateCashflowAnalytics(
  transactions: Transaction[],
  targetMonth?: string,
  windowSize: number = 6
): CashflowAnalytics {
  const currentMonthStr =
    targetMonth || new Date().toISOString().slice(0, 7);

  const monthWindow = getMonthWindow(
    currentMonthStr,
    windowSize
  );

  const months = monthWindow.map((m) =>
    calculateMonthlyCashflow(transactions, m)
  );

  const totalInflow = months.reduce((s, m) => s + m.inflow, 0);
  const totalOutflow = months.reduce((s, m) => s + m.outflow, 0);
  const netCashflow = totalInflow - totalOutflow;

  const validMonthCount = months.length || 1;
  const averageMonthlyInflow = totalInflow / validMonthCount;
  const averageMonthlyOutflow = totalOutflow / validMonthCount;
  const averageMonthlyNet = netCashflow / validMonthCount;

  let overallSavingsRate = 0;
  if (totalInflow > 0) {
    overallSavingsRate =
      ((totalInflow - totalOutflow) / totalInflow) * 100;
  } else if (totalOutflow > 0) {
    overallSavingsRate = -100;
  }

  // Best month is month with highest net
  const nonZeroMonths = months.filter(
    (m) => m.inflow > 0 || m.outflow > 0
  );

  let bestMonth: MonthlyCashflow | null = null;
  let lowestMonth: MonthlyCashflow | null = null;

  if (nonZeroMonths.length > 0) {
    bestMonth = nonZeroMonths.reduce((best, cur) =>
      cur.net > best.net ? cur : best
    );
    lowestMonth = nonZeroMonths.reduce((low, cur) =>
      cur.net < low.net ? cur : low
    );
  }

  const prevMonth = getPreviousMonth(currentMonthStr);
  const categoryExpenses = calculateCategoryExpenses(
    transactions,
    currentMonthStr,
    prevMonth
  );

  return {
    months,
    totalInflow,
    totalOutflow,
    netCashflow,
    averageMonthlyInflow,
    averageMonthlyOutflow,
    averageMonthlyNet,
    overallSavingsRate,
    bestMonth,
    lowestMonth,
    selectedMonth: currentMonthStr,
    categoryExpenses,
  };
}
