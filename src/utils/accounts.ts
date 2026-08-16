import type { Account } from '../types/finance';

export const ACCOUNT_STORAGE_KEY =
  'finance-dashboard-accounts-v1';

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

        return (
          typeof value.id === 'string' &&
          typeof value.name === 'string' &&
          (
            value.type === 'cash' ||
            value.type === 'bank' ||
            value.type === 'ewallet' ||
            value.type === 'other'
          ) &&
          typeof value.balance === 'number' &&
          Number.isFinite(value.balance) &&
          typeof value.currency === 'string' &&
          typeof value.createdAt === 'string'
        );
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
