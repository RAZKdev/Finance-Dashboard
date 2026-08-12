import React from 'react';
import { StatCard } from '../ui';
import type { Transaction } from '../../types/finance';

interface DashboardStatsProps {
  transactions: Transaction[];
  portfolioValue: number;
}

const formatCurrency = (value: number) =>
  `Rp ${value.toLocaleString('id-ID')}`;

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  transactions,
  portfolioValue,
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(currentMonth)
  );

  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalBalance = transactions.reduce(
    (balance, transaction) =>
      transaction.type === 'income'
        ? balance + transaction.amount
        : balance - transaction.amount,
    0
  );

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Balance"
        value={formatCurrency(totalBalance)}
        change="Current balance"
        trend="up"
      />

      <StatCard
        label="Portfolio"
        value={formatCurrency(portfolioValue)}
        change="Current value"
        trend="up"
      />

      <StatCard
        label="Monthly Income"
        value={formatCurrency(monthlyIncome)}
        change="This month"
        trend="up"
      />

      <StatCard
        label="Monthly Expense"
        value={formatCurrency(monthlyExpense)}
        change="This month"
        trend="down"
      />
    </section>
  );
};
