import type { Transaction } from '../types/finance';

export const transactions: Transaction[] = [
  {
    id: 'tx-001',
    title: 'Salary',
    amount: 7500000,
    type: 'income',
    category: 'Income',
    date: '2026-08-01',
  },
  {
    id: 'tx-002',
    title: 'Investment',
    amount: 2000000,
    type: 'expense',
    category: 'Investment',
    date: '2026-08-03',
  },
  {
    id: 'tx-003',
    title: 'Food',
    amount: 150000,
    type: 'expense',
    category: 'Food',
    date: '2026-08-05',
  },
  {
    id: 'tx-004',
    title: 'Freelance',
    amount: 750000,
    type: 'income',
    category: 'Freelance',
    date: '2026-08-07',
  },
];
