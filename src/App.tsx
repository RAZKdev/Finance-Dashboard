import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  SectionHeader,
} from './components/ui';
import { TransactionList } from './components/transactions';
import { DashboardStats } from './components/dashboard';
import { QuickSearch } from './components/search';
import { transactions } from './data/transactions';
import { portfolioAssets } from './data/portfolio';

function App() {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Portfolio', 'Markets', 'Transactions'];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold">Finance Dashboard</h1>
            <p className="text-xs text-text-muted">
              Personal finance overview
            </p>
          </div>

          <Badge variant="positive">Market Open</Badge>
        </div>
      </header>

      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-premium text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <SectionHeader
          title={activeTab}
          description="Track your financial position and portfolio performance."
          action={
            <Button size="sm" onClick={() => alert('Add transaction')}>
              + Add
            </Button>
          }
        />

        <DashboardStats />

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionHeader
              title="Portfolio Overview"
              description="Current allocation across your assets."
            />

            <div className="space-y-4">
              {portfolioAssets.map((asset) => {
                const total = portfolioAssets.reduce(
                  (sum, item) => sum + item.value,
                  0
                );
                const percentage = (asset.value / total) * 100;

                return (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{asset.name}</p>
                      <p className="text-xs text-text-muted">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>

                    <p className="text-sm font-semibold tabular-nums">
                      Rp {asset.value.toLocaleString('id-ID')}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionHeader
              title="Recent Transactions"
              description="Latest activity in your account."
            />

            <TransactionList transactions={transactions} />
          </Card>
        </section>

        <QuickSearch />
      </main>
    </div>
  );
}

export default App;
