import type {
  Account,
  Transaction,
} from '../types/finance';

export interface TransactionValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTransaction(
  transaction: Transaction,
  accountList: Account[] = []
): TransactionValidationResult {
  const errors: string[] = [];

  if (typeof transaction.id !== 'string' || !transaction.id.trim()) {
    errors.push('Transaction id is required.');
  }

  if (typeof transaction.title !== 'string' || !transaction.title.trim()) {
    errors.push('Transaction title is required.');
  }

  if (typeof transaction.amount !== 'number' || !Number.isFinite(transaction.amount) || transaction.amount <= 0) {
    errors.push('Transaction amount must be a number greater than 0.');
  }

  if (
    transaction.type !== 'income' &&
    transaction.type !== 'expense'
  ) {
    errors.push('Transaction type is invalid.');
  }

  if (typeof transaction.category !== 'string' || !transaction.category.trim()) {
    errors.push('Transaction category is required.');
  }

  if (typeof transaction.date !== 'string' || !transaction.date.trim()) {
    errors.push('Transaction date is required.');
  }

  /*
   * accountId is optional for backward compatibility.
   * Existing transactions without accountId remain valid.
   *
   * But when accountId exists, it must reference a real account.
   */
  if (transaction.accountId !== undefined) {
    const accountId =
      typeof transaction.accountId === 'string'
        ? transaction.accountId.trim()
        : '';

    if (!accountId) {
      errors.push('Account id cannot be empty.');
    } else if (
      !accountList.some(
        (account) => account.id === accountId
      )
    ) {
      errors.push('Transaction account not found.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function filterValidTransactions(
  transactionList: Transaction[],
  accountList: Account[] = []
): Transaction[] {
  return transactionList.filter(
    (transaction) =>
      validateTransaction(
        transaction,
        accountList
      ).valid
  );
}
