import React from 'react';
import { StatCard } from '../ui';

export const DashboardStats: React.FC = () => {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Balance"
        value="Rp 25.450.000"
        change="+8.4%"
        trend="up"
      />

      <StatCard
        label="Portfolio"
        value="Rp 18.200.000"
        change="+5.7%"
        trend="up"
      />

      <StatCard
        label="Monthly Income"
        value="Rp 7.500.000"
        change="+12.1%"
        trend="up"
      />

      <StatCard
        label="Monthly Expense"
        value="Rp 3.250.000"
        change="-4.2%"
        trend="down"
      />
    </section>
  );
};
