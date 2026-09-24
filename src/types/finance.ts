export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  accountId?: string;
}

export interface PortfolioAsset {
  id: string;
  name: string;
  value: number;
  symbol?: string;
  assetType?: 'stock' | 'crypto' | 'forex' | 'cash';
  quantity?: number;
  averageBuyPrice?: number;
  currentPrice?: number;
  currency?: string;
}

export type AccountType =
  | 'cash'
  | 'bank'
  | 'ewallet'
  | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currency: string;
  createdAt: string;
}

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string; // Format: "YYYY-MM"
  createdAt: string;
}

export interface BudgetRealization {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
}

export interface MonthlyBudgetSummary {
  month: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  overBudgetCount: number;
  items: BudgetRealization[];
}

export interface AppBackupData {
  version: number;
  exportedAt: string;
  source: 'finance-dashboard';
  accounts: Account[];
  transactions: Transaction[];
  portfolio: PortfolioAsset[];
  budgets: Budget[];
}


