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
