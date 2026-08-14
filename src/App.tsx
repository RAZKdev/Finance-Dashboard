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
import type {
  PortfolioAsset,
  Transaction,
} from './types/finance';
import { Navigation } from './components/navigation';
import { DashboardStats } from './components/dashboard';
import {
  PortfolioAllocation,
  PortfolioAnalytics,
  PortfolioList,
  PortfolioModal,
} from './components/portfolio';
import { MarketList } from './components/markets';
import { QuickSearch } from './components/search';
import { transactions } from './data/transactions';
import { portfolioAssets } from './data/portfolio';
import { marketAssets } from './data/markets';
import {
  calculatePortfolioAllocation,
  calculatePortfolioAnalytics,
  getPortfolioValue,
} from './utils/portfolio';

const TRANSACTIONS_STORAGE_KEY =
  'finance-dashboard-transactions-v1';

const PORTFOLIO_STORAGE_KEY =
  'finance-dashboard-portfolio-v1';

const loadTransactions = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(
      TRANSACTIONS_STORAGE_KEY
    );

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
        (value.type === 'income' ||
          value.type === 'expense') &&
        typeof value.category === 'string' &&
        typeof value.date === 'string'
      );
    });
  } catch {
    return transactions;
  }
};

const loadPortfolio = (): PortfolioAsset[] => {
  try {
    const stored = localStorage.getItem(
      PORTFOLIO_STORAGE_KEY
    );

    if (!stored) {
      return portfolioAssets;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return portfolioAssets;
    }

    return parsed.filter((item): item is PortfolioAsset => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const value = item as Record<string, unknown>;

      return (
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.value === 'number'
      );
    });
  } catch {
    return portfolioAssets;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('Overview');

  const [isTransactionModalOpen, setIsTransactionModalOpen] =
    useState(false);

  const [transactionList, setTransactionList] =
    useState<Transaction[]>(loadTransactions);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [isPortfolioModalOpen, setIsPortfolioModalOpen] =
    useState(false);

  const [portfolioList, setPortfolioList] =
    useState<PortfolioAsset[]>(loadPortfolio);

  const [editingPortfolioAsset, setEditingPortfolioAsset] =
    useState<PortfolioAsset | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] =
    useState('');

  useEffect(() => {
    try {
      localStorage.setItem(
        TRANSACTIONS_STORAGE_KEY,
        JSON.stringify(transactionList)
      );
    } catch {
      // Keep the app usable if localStorage is unavailable.
    }
  }, [transactionList]);

  useEffect(() => {
    try {
      localStorage.setItem(
        PORTFOLIO_STORAGE_KEY,
        JSON.stringify(portfolioList)
      );
    } catch {
      // Keep the app usable if localStorage is unavailable.
    }
  }, [portfolioList]);

  const filteredTransactions = transactionList.filter(
    (transaction) => {
      const query = activeSearchQuery
        .trim()
        .toLowerCase();

      if (!query) {
        return true;
      }

      return [
        transaction.title,
        transaction.category,
        transaction.type,
        transaction.date,
      ].some((value) =>
        value.toLowerCase().includes(query)
      );
    }
  );

  const portfolioAnalytics =
    calculatePortfolioAnalytics(portfolioList);

  const portfolioAllocation =
    calculatePortfolioAllocation(portfolioList);

  const portfolioValue = portfolioList.reduce(
    (sum, asset) => sum + getPortfolioValue(asset),
    0
  );

  const portfolioProfitLoss =
    portfolioAnalytics.totalProfitLoss;

  const portfolioProfitLossPercent =
    portfolioAnalytics.totalProfitLossPercent;


  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
  };

  const handleEditTransaction = (
    transaction: Transaction
  ) => {
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (
    transaction: Transaction
  ) => {
    if (editingTransaction) {
      setTransactionList((current) =>
        current.map((item) =>
          item.id === transaction.id
            ? transaction
            : item
        )
      );
    } else {
      setTransactionList((current) => [
        transaction,
        ...current,
      ]);
    }

    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (
    transactionId: string
  ) => {
    setTransactionList((current) =>
      current.filter(
        (transaction) =>
          transaction.id !== transactionId
      )
    );
  };

  const handleSavePortfolio = (
    asset: PortfolioAsset
  ) => {
    if (editingPortfolioAsset) {
      setPortfolioList((current) =>
        current.map((item) =>
          item.id === asset.id ? asset : item
        )
      );
    } else {
      setPortfolioList((current) => [
        asset,
        ...current,
      ]);
    }

    setIsPortfolioModalOpen(false);
    setEditingPortfolioAsset(null);
  };

  const handleEditPortfolio = (
    asset: PortfolioAsset
  ) => {
    setEditingPortfolioAsset(asset);
    setIsPortfolioModalOpen(true);
  };

  const handleDeletePortfolio = (
    assetId: string
  ) => {
    setPortfolioList((current) =>
      current.filter(
        (asset) => asset.id !== assetId
      )
    );
  };

  const openAddPortfolio = () => {
    setEditingPortfolioAsset(null);
    setIsPortfolioModalOpen(true);
  };

  const openAddTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
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

            <PortfolioList
              assets={portfolioList}
              onEdit={handleEditPortfolio}
              onDelete={handleDeletePortfolio}
            />
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
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </Card>
        );

      case 'Markets':
        return (
          <Card>
            <SectionHeader
              title="Markets"
              description="Latest market snapshot."
            />

            <MarketList assets={marketAssets} />
          </Card>
        );

      case 'Overview':
      default:
        return (
          <>
            <DashboardStats
              transactions={transactionList}
              portfolioValue={portfolioValue}
              portfolioProfitLoss={portfolioProfitLoss}
              portfolioProfitLossPercent={portfolioProfitLossPercent}
            />

            <PortfolioAnalytics
              analytics={portfolioAnalytics}
            />

            <PortfolioAllocation
              allocation={portfolioAllocation}
              isEmpty={portfolioList.length === 0}
            />

            <section className="grid gap-6 lg:grid-cols-2">
              <Card>
                <SectionHeader
                  title="Portfolio Overview"
                  description="Current allocation across your assets."
                />

                <PortfolioList
                  assets={portfolioList}
                  onEdit={handleEditPortfolio}
                  onDelete={handleDeletePortfolio}
                />
              </Card>

              <Card>
                <SectionHeader
                  title="Recent Transactions"
                  description="Latest activity in your account."
                />

                <TransactionList
                  transactions={filteredTransactions}
                  onEdit={handleEditTransaction}
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
            <h1 className="text-xl font-semibold">
              Finance Dashboard
            </h1>

            <p className="text-xs text-text-muted">
              Personal finance overview
            </p>
          </div>

          <Badge variant="positive">
            Market Open
          </Badge>
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
            activeTab === 'Portfolio' ? (
              <Button
                size="sm"
                onClick={openAddPortfolio}
              >
                + Add Asset
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={openAddTransaction}
              >
                + Add
              </Button>
            )
          }
        />

        {renderTabContent()}


      </main>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
        initialData={editingTransaction}
      />

      <PortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => {
          setIsPortfolioModalOpen(false);
          setEditingPortfolioAsset(null);
        }}
        onSubmit={handleSavePortfolio}
        initialData={editingPortfolioAsset}
      />
    </div>
  );
}

export default App;
