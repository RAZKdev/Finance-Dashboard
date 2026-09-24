import React from 'react';
import { StatCard } from '../ui';
import type { Account, Transaction } from '../../types/finance';
import { calculateTotalCashBalance } from '../../utils/accounts';

interface DashboardStatsProps {
  transactions: Transaction[];
  portfolioValue: number;
  portfolioProfitLoss: number | null;
  portfolioProfitLossPercent: number | null;
  accounts?: Account[];
}

const formatCurrency = (value: number) =>
  `Rp ${value.toLocaleString('id-ID')}`;

const getCurrentMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  transactions,
  portfolioValue,
  portfolioProfitLoss,
  portfolioProfitLossPercent,
  accounts = [],
}) => {
  const currentMonth = getCurrentMonth();

  const monthlyTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(currentMonth)
  );

  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalBalance = calculateTotalCashBalance(accounts, transactions);

  const portfolioChange =
    portfolioProfitLoss !== null &&
    portfolioProfitLossPercent !== null
      ? `${portfolioProfitLoss >= 0 ? '+' : ''}${portfolioProfitLossPercent.toFixed(2)}%`
      : 'No P/L data';

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Total Balance"
        value={formatCurrency(totalBalance)}
        change={
          accounts.length > 0
            ? `${accounts.length} account${accounts.length > 1 ? 's' : ''}`
            : 'Current balance'
        }
        trend={totalBalance >= 0 ? 'up' : 'down'}
      />

      <StatCard
        label="Portfolio"
        value={formatCurrency(portfolioValue)}
        change="Current market value"
        trend="up"
      />

      <StatCard
        label="Portfolio P/L"
        value={
          portfolioProfitLoss !== null
            ? `${portfolioProfitLoss >= 0 ? '+' : '-'}Rp ${Math.abs(
                portfolioProfitLoss
              ).toLocaleString('id-ID')}`
            : '—'
        }
        change={portfolioChange}
        trend={
          portfolioProfitLoss === null
            ? 'up'
            : portfolioProfitLoss >= 0
              ? 'up'
              : 'down'
        }
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
