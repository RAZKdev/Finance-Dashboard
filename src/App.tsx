import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  SectionHeader,
} from './components/ui';
import { TransactionList } from './components/transactions';
import { Navigation } from './components/navigation';
import { DashboardStats } from './components/dashboard';
import { PortfolioList } from './components/portfolio';
import { QuickSearch } from './components/search';
import { transactions } from './data/transactions';
import { portfolioAssets } from './data/portfolio';

function App() {
  const [activeTab, setActiveTab] = useState('Overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Portfolio':
        return (
          <Card>
            <SectionHeader
              title="Portfolio"
              description="Current allocation across your assets."
            />
            <PortfolioList assets={portfolioAssets} />
          </Card>
        );

      case 'Transactions':
        return (
          <Card>
            <SectionHeader
              title="Transactions"
              description="Latest activity in your account."
            />
            <TransactionList transactions={transactions} />
          </Card>
        );

      case 'Markets':
        return (
          <Card>
            <SectionHeader
              title="Markets"
              description="Market data will be available here."
            />
            <div className="py-8 text-center text-sm text-text-muted">
              Market data is not available yet.
            </div>
          </Card>
        );

      case 'Overview':
      default:
        return (
          <>
            <DashboardStats />

            <section className="grid gap-6 lg:grid-cols-2">
              <Card>
                <SectionHeader
                  title="Portfolio Overview"
                  description="Current allocation across your assets."
                />
                <PortfolioList assets={portfolioAssets} />
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
          </>
        );
    }
  };

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

      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

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

        {renderTabContent()}
      </main>
    </div>
  );
}

export default App;
