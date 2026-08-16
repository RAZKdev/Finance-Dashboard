export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
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
  balance: number;
  currency: string;
  createdAt: string;
}
