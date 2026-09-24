import type { Account, Transaction } from '../types/finance';

export const ACCOUNT_STORAGE_KEY =
  'finance-dashboard-accounts-v1';

export interface AccountBalanceSummary {
  openingBalance: number;
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
}

export interface AccountValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAccount(
  account: Account
): AccountValidationResult {
  const errors: string[] = [];

  if (typeof account.id !== 'string' || !account.id.trim()) {
    errors.push('Account id is required.');
  }

  if (typeof account.name !== 'string' || !account.name.trim()) {
    errors.push('Account name is required.');
  }

  if (
    account.type !== 'cash' &&
    account.type !== 'bank' &&
    account.type !== 'ewallet' &&
    account.type !== 'other'
  ) {
    errors.push('Account type is invalid.');
  }

  if (
    typeof account.openingBalance !== 'number' ||
    !Number.isFinite(account.openingBalance)
  ) {
    errors.push(
      'Opening balance must be a finite number.'
    );
  }

  if (typeof account.currency !== 'string' || !account.currency.trim()) {
    errors.push('Currency is required.');
  }

  if (typeof account.createdAt !== 'string' || !account.createdAt.trim()) {
    errors.push('Created date is required.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export interface AccountMutationResult {
  success: boolean;
  accounts: Account[];
  errors: string[];
}

export function createAccount(
  accountList: Account[],
  account: Account
): AccountMutationResult {
  const validation = validateAccount(account);

  if (!validation.valid) {
    return {
      success: false,
      accounts: accountList,
      errors: validation.errors,
    };
  }

  if (
    accountList.some(
      (existing) => existing.id === account.id
    )
  ) {
    return {
      success: false,
      accounts: accountList,
      errors: ['Account id already exists.'],
    };
  }

  return {
    success: true,
    accounts: [...accountList, account],
    errors: [],
  };
}

export function updateAccount(
  accountList: Account[],
  updatedAccount: Account
): AccountMutationResult {
  const validation = validateAccount(updatedAccount);

  if (!validation.valid) {
    return {
      success: false,
      accounts: accountList,
      errors: validation.errors,
    };
  }

  const index = accountList.findIndex(
    (account) => account.id === updatedAccount.id
  );

  if (index === -1) {
    return {
      success: false,
      accounts: accountList,
      errors: ['Account not found.'],
    };
  }

  const nextAccounts = [...accountList];
  nextAccounts[index] = updatedAccount;

  return {
    success: true,
    accounts: nextAccounts,
    errors: [],
  };
}

export function deleteAccount(
  accountList: Account[],
  accountId: string
): AccountMutationResult {
  if (!accountId.trim()) {
    return {
      success: false,
      accounts: accountList,
      errors: ['Account id is required.'],
    };
  }

  const exists = accountList.some(
    (account) => account.id === accountId
  );

  if (!exists) {
    return {
      success: false,
      accounts: accountList,
      errors: ['Account not found.'],
    };
  }

  return {
    success: true,
    accounts: accountList.filter(
      (account) => account.id !== accountId
    ),
    errors: [],
  };
}

export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[] = []
): number {
  const linkedTransactions = transactions.filter(
    (tx) => tx.accountId === account.id
  );

  const netChange = linkedTransactions.reduce((acc, tx) => {
    if (tx.type === 'income') {
      return acc + tx.amount;
    }
    if (tx.type === 'expense') {
      return acc - tx.amount;
    }
    return acc;
  }, 0);

  return account.openingBalance + netChange;
}

export function calculateAccountBalanceSummary(
  account: Account,
  transactions: Transaction[] = []
): AccountBalanceSummary {
  const linkedTransactions = transactions.filter(
    (tx) => tx.accountId === account.id
  );

  const totalIncome = linkedTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = linkedTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netChange = totalIncome - totalExpense;
  const currentBalance = account.openingBalance + netChange;

  return {
    openingBalance: account.openingBalance,
    currentBalance,
    totalIncome,
    totalExpense,
    netChange,
  };
}

export function calculateTotalCashBalance(
  accounts: Account[],
  transactions: Transaction[] = []
): number {
  const totalOpening = accounts.reduce(
    (sum, acc) => sum + acc.openingBalance,
    0
  );

  const totalNet = transactions.reduce(
    (sum, tx) =>
      tx.type === 'income' ? sum + tx.amount : sum - tx.amount,
    0
  );

  return totalOpening + totalNet;
}

export function loadAccounts(
  fallback: Account[] = []
): Account[] {
  try {
    const stored = localStorage.getItem(
      ACCOUNT_STORAGE_KEY
    );

    if (!stored) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return fallback;
    }

    const accounts: Account[] = [];

    for (const item of parsed) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const value = item as Record<string, unknown>;

      // Support legacy schema migration if 'openingBalance' is missing but 'balance' was present
      const resolvedOpeningBalance =
        typeof value.openingBalance === 'number'
          ? value.openingBalance
          : typeof value.balance === 'number'
            ? value.balance
            : NaN;

      if (
        typeof value.id !== 'string' ||
        typeof value.name !== 'string' ||
        (
          value.type !== 'cash' &&
          value.type !== 'bank' &&
          value.type !== 'ewallet' &&
          value.type !== 'other'
        ) ||
        !Number.isFinite(resolvedOpeningBalance) ||
        typeof value.currency !== 'string' ||
        typeof value.createdAt !== 'string'
      ) {
        continue;
      }

      const account: Account = {
        id: value.id,
        name: value.name,
        type: value.type,
        openingBalance: resolvedOpeningBalance,
        currency: value.currency,
        createdAt: value.createdAt,
      };

      if (validateAccount(account).valid) {
        accounts.push(account);
      }
    }

    return accounts;
  } catch {
    return fallback;
  }
}

export function saveAccounts(
  accountList: Account[]
): void {
  try {
    localStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify(accountList)
    );
  } catch {
    // Keep the app usable if localStorage is unavailable.
  }
}
