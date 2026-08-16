import type { Account } from '../types/finance';

export const ACCOUNT_STORAGE_KEY =
  'finance-dashboard-accounts-v1';

export interface AccountBalanceSummary {
  openingBalance: number;
  currentBalance: number;
}

export interface AccountValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAccount(
  account: Account
): AccountValidationResult {
  const errors: string[] = [];

  if (!account.id.trim()) {
    errors.push('Account id is required.');
  }

  if (!account.name.trim()) {
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
    !Number.isFinite(account.openingBalance)
  ) {
    errors.push(
      'Opening balance must be a finite number.'
    );
  }

  if (!account.currency.trim()) {
    errors.push('Currency is required.');
  }

  if (!account.createdAt.trim()) {
    errors.push('Created date is required.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function calculateAccountBalance(
  account: Account
): number {
  return account.openingBalance;
}

export function calculateAccountBalanceSummary(
  account: Account
): AccountBalanceSummary {
  const currentBalance =
    calculateAccountBalance(account);

  return {
    openingBalance: account.openingBalance,
    currentBalance,
  };
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

    return parsed.filter(
      (item): item is Account => {
        if (!item || typeof item !== 'object') {
          return false;
        }

        const value = item as Record<string, unknown>;

        if (
          typeof value.id !== 'string' ||
          typeof value.name !== 'string' ||
          typeof value.balance !== 'undefined' ||
          (
            value.type !== 'cash' &&
            value.type !== 'bank' &&
            value.type !== 'ewallet' &&
            value.type !== 'other'
          ) ||
          typeof value.openingBalance !== 'number' ||
          typeof value.currency !== 'string' ||
          typeof value.createdAt !== 'string'
        ) {
          return false;
        }

        const account: Account = {
          id: value.id,
          name: value.name,
          type: value.type,
          openingBalance: value.openingBalance,
          currency: value.currency,
          createdAt: value.createdAt,
        };

        return validateAccount(account).valid;
      }
    );
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
