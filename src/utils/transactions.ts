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

  if (!transaction.id.trim()) {
    errors.push('Transaction id is required.');
  }

  if (!transaction.title.trim()) {
    errors.push('Transaction title is required.');
  }

  if (!Number.isFinite(transaction.amount)) {
    errors.push('Transaction amount must be a finite number.');
  }

  if (
    transaction.type !== 'income' &&
    transaction.type !== 'expense'
  ) {
    errors.push('Transaction type is invalid.');
  }

  if (!transaction.category.trim()) {
    errors.push('Transaction category is required.');
  }

  if (!transaction.date.trim()) {
    errors.push('Transaction date is required.');
  }

  /*
   * accountId is optional for backward compatibility.
   * Existing transactions without accountId remain valid.
   *
   * But when accountId exists, it must reference a real account.
   */
  if (transaction.accountId !== undefined) {
    const accountId = transaction.accountId.trim();

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
