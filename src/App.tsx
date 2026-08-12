import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  SectionHeader,
} from './components/ui';
import {
  TransactionList,
  TransactionModal,
} from './components/transactions';
import type { Transaction } from './types/finance';
import { Navigation } from './components/navigation';
import { DashboardStats } from './components/dashboard';
import { PortfolioList } from './components/portfolio';
import { QuickSearch } from './components/search';
import { transactions } from './data/transactions';
import { portfolioAssets } from './data/portfolio';

const TRANSACTIONS_STORAGE_KEY = 'finance-dashboard-transactions-v1';

const loadTransactions = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);

    if (!stored) {
      return transactions;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return transactions;
    }

    return parsed.filter((item): item is Transaction => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const value = item as Record<string, unknown>;

      return (
        typeof value.id === 'string' &&
        typeof value.title === 'string' &&
        typeof value.amount === 'number' &&
        (value.type === 'income' || value.type === 'expense') &&
        typeof value.category === 'string' &&
        typeof value.date === 'string'
      );
    });
  } catch {
    return transactions;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionList, setTransactionList] =
    useState<Transaction[]>(loadTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(
        TRANSACTIONS_STORAGE_KEY,
        JSON.stringify(transactionList)
      );
    } catch {
      // Keep the app usable even if localStorage is unavailable.
    }
  }, [transactionList]);

  const filteredTransactions = transactionList.filter((transaction) => {
    const query = activeSearchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [
      transaction.title,
      transaction.category,
      transaction.type,
      transaction.date,
    ].some((value) => value.toLowerCase().includes(query));
  });

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
  };

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactionList((current) => [transaction, ...current]);
    setIsTransactionModalOpen(false);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionList((current) =>
      current.filter((transaction) => transaction.id !== transactionId)
    );
  };

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
            <TransactionList
              transactions={filteredTransactions}
              onDelete={handleDeleteTransaction}
            />
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
            <DashboardStats
              transactions={transactionList}
              portfolioValue={portfolioAssets.reduce(
                (sum, asset) => sum + asset.value,
                0
              )}
            />

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
                <TransactionList
              transactions={filteredTransactions}
              onDelete={handleDeleteTransaction}
            />
              </Card>
            </section>

            <QuickSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
            />
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
            <Button
              size="sm"
              onClick={() => setIsTransactionModalOpen(true)}
            >
              + Add
            </Button>
          }
        />

        {renderTabContent()}
      </main>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleAddTransaction}
      />
    </div>
  );
}

export default App;
