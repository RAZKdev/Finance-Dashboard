import type {
  Budget,
  BudgetRealization,
  BudgetStatus,
  MonthlyBudgetSummary,
  Transaction,
} from '../types/finance';

export const BUDGET_STORAGE_KEY =
  'finance-dashboard-budgets-v1';

export interface BudgetValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BudgetMutationResult {
  success: boolean;
  budgets: Budget[];
  errors: string[];
}

export function isValidMonthFormat(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

export function validateBudget(
  budget: Budget
): BudgetValidationResult {
  const errors: string[] = [];

  if (typeof budget.id !== 'string' || !budget.id.trim()) {
    errors.push('Budget id is required.');
  }

  if (typeof budget.category !== 'string' || !budget.category.trim()) {
    errors.push('Category is required.');
  }

  if (typeof budget.limit !== 'number' || !Number.isFinite(budget.limit) || budget.limit <= 0) {
    errors.push('Budget limit must be a number greater than 0.');
  }

  if (typeof budget.month !== 'string' || !isValidMonthFormat(budget.month)) {
    errors.push('Month must be in YYYY-MM format.');
  }

  if (typeof budget.createdAt !== 'string' || !budget.createdAt.trim()) {
    errors.push('Created date is required.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createBudget(
  budgetList: Budget[],
  budget: Budget
): BudgetMutationResult {
  const validation = validateBudget(budget);

  if (!validation.valid) {
    return {
      success: false,
      budgets: budgetList,
      errors: validation.errors,
    };
  }

  if (budgetList.some((existing) => existing.id === budget.id)) {
    return {
      success: false,
      budgets: budgetList,
      errors: ['Budget id already exists.'],
    };
  }

  const isDuplicate = budgetList.some(
    (existing) =>
      existing.month === budget.month &&
      existing.category.trim().toLowerCase() ===
        budget.category.trim().toLowerCase()
  );

  if (isDuplicate) {
    return {
      success: false,
      budgets: budgetList,
      errors: [
        'A budget for this category and month already exists.',
      ],
    };
  }

  return {
    success: true,
    budgets: [...budgetList, budget],
    errors: [],
  };
}

export function updateBudget(
  budgetList: Budget[],
  updatedBudget: Budget
): BudgetMutationResult {
  const validation = validateBudget(updatedBudget);

  if (!validation.valid) {
    return {
      success: false,
      budgets: budgetList,
      errors: validation.errors,
    };
  }

  const index = budgetList.findIndex(
    (b) => b.id === updatedBudget.id
  );

  if (index === -1) {
    return {
      success: false,
      budgets: budgetList,
      errors: ['Budget not found.'],
    };
  }

  const isDuplicate = budgetList.some(
    (existing) =>
      existing.id !== updatedBudget.id &&
      existing.month === updatedBudget.month &&
      existing.category.trim().toLowerCase() ===
        updatedBudget.category.trim().toLowerCase()
  );

  if (isDuplicate) {
    return {
      success: false,
      budgets: budgetList,
      errors: [
        'A budget for this category and month already exists.',
      ],
    };
  }

  const nextBudgets = [...budgetList];
  nextBudgets[index] = updatedBudget;

  return {
    success: true,
    budgets: nextBudgets,
    errors: [],
  };
}

export function deleteBudget(
  budgetList: Budget[],
  budgetId: string
): BudgetMutationResult {
  if (!budgetId.trim()) {
    return {
      success: false,
      budgets: budgetList,
      errors: ['Budget id is required.'],
    };
  }

  const exists = budgetList.some((b) => b.id === budgetId);

  if (!exists) {
    return {
      success: false,
      budgets: budgetList,
      errors: ['Budget not found.'],
    };
  }

  return {
    success: true,
    budgets: budgetList.filter((b) => b.id !== budgetId),
    errors: [],
  };
}

export function calculateBudgetRealization(
  budget: Budget,
  transactions: Transaction[] = []
): BudgetRealization {
  const budgetCatNormalized = budget.category.trim().toLowerCase();

  const matchingExpenses = transactions.filter((tx) => {
    if (tx.type !== 'expense') {
      return false;
    }

    if (tx.category.trim().toLowerCase() !== budgetCatNormalized) {
      return false;
    }

    // Match YYYY-MM
    return typeof tx.date === 'string' && tx.date.startsWith(budget.month);
  });

  const spent = matchingExpenses.reduce((sum, tx) => {
    return Number.isFinite(tx.amount) && tx.amount > 0
      ? sum + tx.amount
      : sum;
  }, 0);

  const remaining = budget.limit - spent;
  const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

  let status: BudgetStatus = 'ok';
  if (spent > budget.limit) {
    status = 'exceeded';
  } else if (spent >= budget.limit * 0.8) {
    status = 'warning';
  }

  return {
    budget,
    spent,
    remaining,
    percentage,
    status,
  };
}

export function calculateMonthlyBudgetSummary(
  budgets: Budget[],
  transactions: Transaction[] = [],
  month: string
): MonthlyBudgetSummary {
  const monthBudgets = budgets.filter((b) => b.month === month);

  const items = monthBudgets.map((budget) =>
    calculateBudgetRealization(budget, transactions)
  );

  const totalBudget = items.reduce(
    (sum, item) => sum + item.budget.limit,
    0
  );

  const totalSpent = items.reduce(
    (sum, item) => sum + item.spent,
    0
  );

  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const overBudgetCount = items.filter(
    (item) => item.status === 'exceeded'
  ).length;

  return {
    month,
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentage,
    overBudgetCount,
    items,
  };
}

export function loadBudgets(
  fallback: Budget[] = []
): Budget[] {
  try {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY);

    if (!stored) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return fallback;
    }

    const validBudgets: Budget[] = [];

    for (const item of parsed) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const value = item as Record<string, unknown>;

      if (
        typeof value.id !== 'string' ||
        typeof value.category !== 'string' ||
        typeof value.limit !== 'number' ||
        !Number.isFinite(value.limit) ||
        typeof value.month !== 'string' ||
        typeof value.createdAt !== 'string'
      ) {
        continue;
      }

      const budget: Budget = {
        id: value.id,
        category: value.category,
        limit: value.limit,
        month: value.month,
        createdAt: value.createdAt,
      };

      if (validateBudget(budget).valid) {
        validBudgets.push(budget);
      }
    }

    return validBudgets;
  } catch {
    return fallback;
  }
}

export function saveBudgets(budgetList: Budget[]): void {
  try {
    localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify(budgetList)
    );
  } catch {
    // Keep app usable if localStorage is unavailable
  }
}
