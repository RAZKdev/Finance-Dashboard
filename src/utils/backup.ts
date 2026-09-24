import type {
  Account,
  AppBackupData,
  Budget,
  PortfolioAsset,
  Transaction,
} from '../types/finance';
import { validateAccount } from './accounts.ts';
import { validateBudget } from './budgets.ts';
import { validateTransaction } from './transactions.ts';

export interface ValidationSummary {
  accountsCount: number;
  transactionsCount: number;
  portfolioCount: number;
  budgetsCount: number;
}

export interface BackupValidationResult {
  valid: boolean;
  errors: string[];
  data?: AppBackupData;
  summary?: ValidationSummary;
}

export function createBackupPayload(
  accounts: Account[],
  transactions: Transaction[],
  portfolio: PortfolioAsset[],
  budgets: Budget[]
): AppBackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: 'finance-dashboard',
    accounts,
    transactions,
    portfolio,
    budgets,
  };
}

export function validateBackupPayload(
  payload: unknown
): BackupValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: ['Invalid backup file: root must be a JSON object.'],
    };
  }

  const root = payload as Record<string, unknown>;

  if (root.source !== 'finance-dashboard') {
    errors.push('Unrecognized backup source. Expected "finance-dashboard".');
  }

  if (typeof root.version !== 'number' || root.version < 1) {
    errors.push('Missing or invalid schema version.');
  }

  if (
    !Array.isArray(root.accounts) ||
    !Array.isArray(root.transactions) ||
    !Array.isArray(root.portfolio) ||
    !Array.isArray(root.budgets)
  ) {
    errors.push(
      'Backup must contain accounts, transactions, portfolio, and budgets arrays.'
    );
    return { valid: false, errors };
  }

  // Validate Accounts
  const validAccounts: Account[] = [];
  for (const item of root.accounts) {
    if (item && typeof item === 'object') {
      const acc = item as Account;
      if (validateAccount(acc).valid) {
        validAccounts.push(acc);
      }
    }
  }

  // Validate Transactions (checked against valid accounts)
  const validTransactions: Transaction[] = [];
  for (const item of root.transactions) {
    if (item && typeof item === 'object') {
      const tx = item as Transaction;
      if (validateTransaction(tx, validAccounts).valid) {
        validTransactions.push(tx);
      }
    }
  }

  // Validate Portfolio Assets
  const validPortfolio: PortfolioAsset[] = [];
  for (const item of root.portfolio) {
    if (item && typeof item === 'object') {
      const p = item as Record<string, unknown>;
      if (
        typeof p.id === 'string' &&
        p.id.trim() &&
        typeof p.name === 'string' &&
        p.name.trim() &&
        typeof p.value === 'number' &&
        Number.isFinite(p.value) &&
        p.value > 0
      ) {
        validPortfolio.push(item as PortfolioAsset);
      }
    }
  }

  // Validate Budgets
  const validBudgets: Budget[] = [];
  for (const item of root.budgets) {
    if (item && typeof item === 'object') {
      const b = item as Budget;
      if (validateBudget(b).valid) {
        validBudgets.push(b);
      }
    }
  }

  const validData: AppBackupData = {
    version: root.version as number,
    exportedAt:
      typeof root.exportedAt === 'string'
        ? root.exportedAt
        : new Date().toISOString(),
    source: 'finance-dashboard',
    accounts: validAccounts,
    transactions: validTransactions,
    portfolio: validPortfolio,
    budgets: validBudgets,
  };

  const summary: ValidationSummary = {
    accountsCount: validAccounts.length,
    transactionsCount: validTransactions.length,
    portfolioCount: validPortfolio.length,
    budgetsCount: validBudgets.length,
  };

  return {
    valid: errors.length === 0,
    errors,
    data: validData,
    summary,
  };
}

export function mergeBackupData(
  current: AppBackupData,
  incoming: AppBackupData
): AppBackupData {
  // Accounts: map by id, incoming overwrites
  const accountsMap = new Map<string, Account>();
  for (const acc of current.accounts) {
    accountsMap.set(acc.id, acc);
  }
  for (const acc of incoming.accounts) {
    accountsMap.set(acc.id, acc);
  }

  // Transactions: map by id, incoming overwrites
  const txMap = new Map<string, Transaction>();
  for (const tx of current.transactions) {
    txMap.set(tx.id, tx);
  }
  for (const tx of incoming.transactions) {
    txMap.set(tx.id, tx);
  }

  // Portfolio: map by id, incoming overwrites
  const portfolioMap = new Map<string, PortfolioAsset>();
  for (const asset of current.portfolio) {
    portfolioMap.set(asset.id, asset);
  }
  for (const asset of incoming.portfolio) {
    portfolioMap.set(asset.id, asset);
  }

  // Budgets: map by id, incoming overwrites
  const budgetMap = new Map<string, Budget>();
  for (const b of current.budgets) {
    budgetMap.set(b.id, b);
  }
  for (const b of incoming.budgets) {
    budgetMap.set(b.id, b);
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: 'finance-dashboard',
    accounts: Array.from(accountsMap.values()),
    transactions: Array.from(txMap.values()),
    portfolio: Array.from(portfolioMap.values()),
    budgets: Array.from(budgetMap.values()),
  };
}

// -------------------------------------------------------------
// CSV Serialization Utilities
// -------------------------------------------------------------

export function escapeCSVValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }

  const str = String(val);
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function generateCSV(
  headers: { key: string; label: string }[],
  rows: Record<string, unknown>[]
): string {
  const headerLine = headers
    .map((h) => escapeCSVValue(h.label))
    .join(',');

  const rowLines = rows.map((row) =>
    headers.map((h) => escapeCSVValue(row[h.key])).join(',')
  );

  return [headerLine, ...rowLines].join('\r\n');
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  accounts: Account[] = []
): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const headers = [
    { key: 'id', label: 'Transaction ID' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'accountName', label: 'Account' },
  ];

  const rows = transactions.map((tx) => ({
    id: tx.id,
    title: tx.title,
    type: tx.type,
    category: tx.category,
    amount: tx.amount,
    date: tx.date,
    accountName: tx.accountId
      ? accountMap.get(tx.accountId) ?? tx.accountId
      : 'Unlinked',
  }));

  return generateCSV(headers, rows);
}

export function exportAccountsToCSV(accounts: Account[]): string {
  const headers = [
    { key: 'id', label: 'Account ID' },
    { key: 'name', label: 'Account Name' },
    { key: 'type', label: 'Type' },
    { key: 'openingBalance', label: 'Opening Balance' },
    { key: 'currency', label: 'Currency' },
    { key: 'createdAt', label: 'Created At' },
  ];

  const rows = accounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    type: acc.type,
    openingBalance: acc.openingBalance,
    currency: acc.currency,
    createdAt: acc.createdAt,
  }));

  return generateCSV(headers, rows);
}

export function exportPortfolioToCSV(
  portfolio: PortfolioAsset[]
): string {
  const headers = [
    { key: 'id', label: 'Asset ID' },
    { key: 'name', label: 'Asset Name' },
    { key: 'value', label: 'Value' },
    { key: 'symbol', label: 'Symbol' },
    { key: 'assetType', label: 'Asset Type' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'averageBuyPrice', label: 'Avg Buy Price' },
    { key: 'currentPrice', label: 'Current Price' },
    { key: 'currency', label: 'Currency' },
  ];

  const rows = portfolio.map((asset) => ({
    id: asset.id,
    name: asset.name,
    value: asset.value,
    symbol: asset.symbol ?? '',
    assetType: asset.assetType ?? '',
    quantity: asset.quantity ?? '',
    averageBuyPrice: asset.averageBuyPrice ?? '',
    currentPrice: asset.currentPrice ?? '',
    currency: asset.currency ?? 'IDR',
  }));

  return generateCSV(headers, rows);
}

export function exportBudgetsToCSV(budgets: Budget[]): string {
  const headers = [
    { key: 'id', label: 'Budget ID' },
    { key: 'category', label: 'Category' },
    { key: 'limit', label: 'Monthly Limit' },
    { key: 'month', label: 'Month' },
    { key: 'createdAt', label: 'Created At' },
  ];

  const rows = budgets.map((b) => ({
    id: b.id,
    category: b.category,
    limit: b.limit,
    month: b.month,
    createdAt: b.createdAt,
  }));

  return generateCSV(headers, rows);
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
