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
import {
  AccountList,
  AccountModal,
} from './components/accounts';
import {
  BudgetList,
  BudgetModal,
} from './components/budgets';
import {
  CashflowView,
  CashflowMiniCard,
} from './components/cashflow';
import { BackupModal } from './components/backup';
import type {
  Account,
  AppBackupData,
  Budget,
  PortfolioAsset,
  Transaction,
} from './types/finance';
import { Navigation } from './components/navigation';
import {
  DashboardStats,
  BudgetOverviewCard,
} from './components/dashboard';
import {
  PortfolioAllocation,
  PortfolioAnalytics,
  PortfolioList,
  PortfolioModal,
  PortfolioQuality,
} from './components/portfolio';
import { MarketList } from './components/markets';
import { QuickSearch } from './components/search';
import { transactions } from './data/transactions';
import { portfolioAssets } from './data/portfolio';
import { accounts } from './data/accounts';
import { budgets } from './data/budgets';
import {
  createAccount,
  deleteAccount,
  loadAccounts,
  saveAccounts,
  updateAccount,
} from './utils/accounts';
import {
  createBudget,
  deleteBudget,
  loadBudgets,
  saveBudgets,
  updateBudget,
} from './utils/budgets';
import { marketAssets } from './data/markets';
import type { MarketAsset } from './data/markets';
import {
  loadCachedMarketAssets,
  saveCachedMarketAssets,
  syncLiveMarketAssets,
} from './utils/marketLive';
import {
  calculatePortfolioAllocation,
  calculatePortfolioAnalytics,
  calculatePortfolioQuality,
  getPortfolioValue,
} from './utils/portfolio';
import {
  validateTransaction,
} from './utils/transactions';

const TRANSACTIONS_STORAGE_KEY =
  'finance-dashboard-transactions-v1';

const PORTFOLIO_STORAGE_KEY =
  'finance-dashboard-portfolio-v1';

const loadTransactions = (
  accountList: Account[]
): Transaction[] => {
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

    const candidates = parsed.filter(
      (item): item is Transaction => {
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
          typeof value.date === 'string' &&
          (
            value.accountId === undefined ||
            typeof value.accountId === 'string'
          )
        );
      }
    );

    return candidates.filter(
      (transaction) =>
        validateTransaction(
          transaction,
          accountList
        ).valid
    );
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

    const validAssets: PortfolioAsset[] = [];

    for (const item of parsed) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const value = item as Record<string, unknown>;

      if (
        typeof value.id !== 'string' ||
        !value.id.trim() ||
        typeof value.name !== 'string' ||
        !value.name.trim() ||
        typeof value.value !== 'number' ||
        !Number.isFinite(value.value) ||
        value.value <= 0
      ) {
        continue;
      }

      const asset: PortfolioAsset = {
        id: value.id.trim(),
        name: value.name.trim(),
        value: value.value,
      };

      if (typeof value.symbol === 'string' && value.symbol.trim()) {
        asset.symbol = value.symbol.trim();
      }

      if (
        value.assetType === 'stock' ||
        value.assetType === 'crypto' ||
        value.assetType === 'forex' ||
        value.assetType === 'cash'
      ) {
        asset.assetType = value.assetType;
      }

      if (
        typeof value.quantity === 'number' &&
        Number.isFinite(value.quantity) &&
        value.quantity > 0
      ) {
        asset.quantity = value.quantity;
      }

      if (
        typeof value.averageBuyPrice === 'number' &&
        Number.isFinite(value.averageBuyPrice) &&
        value.averageBuyPrice > 0
      ) {
        asset.averageBuyPrice = value.averageBuyPrice;
      }

      if (
        typeof value.currentPrice === 'number' &&
        Number.isFinite(value.currentPrice) &&
        value.currentPrice > 0
      ) {
        asset.currentPrice = value.currentPrice;
      }

      if (typeof value.currency === 'string' && value.currency.trim()) {
        asset.currency = value.currency.trim();
      }

      validAssets.push(asset);
    }

    return validAssets;
  } catch {
    return portfolioAssets;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('Overview');

  const [isTransactionModalOpen, setIsTransactionModalOpen] =
    useState(false);

  const [accountList, setAccountList] =
    useState<Account[]>(() => loadAccounts(accounts));

  const [transactionList, setTransactionList] =
    useState<Transaction[]>(() =>
      loadTransactions(accountList)
    );

  const [editingAccount, setEditingAccount] =
    useState<Account | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] =
    useState(false);

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

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [budgetList, setBudgetList] = useState<Budget[]>(() =>
    loadBudgets(budgets)
  );
  const [editingBudget, setEditingBudget] =
    useState<Budget | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] =
    useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] =
    useState(false);
  const [selectedBudgetMonth, setSelectedBudgetMonth] =
    useState<string>(currentMonth);

  const [marketList, setMarketList] = useState<MarketAsset[]>(() => {
    const { assets } = loadCachedMarketAssets(marketAssets);
    return assets;
  });
  const [marketLastSync, setMarketLastSync] = useState<string | null>(() => {
    const { lastSync } = loadCachedMarketAssets(marketAssets);
    return lastSync;
  });
  const [isSyncingMarkets, setIsSyncingMarkets] = useState(false);

  const handleRefreshMarkets = async () => {
    setIsSyncingMarkets(true);
    try {
      const res = await syncLiveMarketAssets(marketList);
      setMarketList(res.assets);
      setMarketLastSync(res.syncTimestamp);
      saveCachedMarketAssets(res.assets, res.syncTimestamp);
    } catch (err) {
      console.warn('Failed to sync live markets:', err);
    } finally {
      setIsSyncingMarkets(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const timer = setTimeout(() => {
      void (async () => {
        setIsSyncingMarkets(true);
        try {
          const res = await syncLiveMarketAssets(marketAssets);
          if (!ignore) {
            setMarketList(res.assets);
            setMarketLastSync(res.syncTimestamp);
            saveCachedMarketAssets(res.assets, res.syncTimestamp);
          }
        } catch (err) {
          console.warn('Failed to sync live markets:', err);
        } finally {
          if (!ignore) {
            setIsSyncingMarkets(false);
          }
        }
      })();
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, []);

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
    saveAccounts(accountList);
  }, [accountList]);

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

  useEffect(() => {
    saveBudgets(budgetList);
  }, [budgetList]);

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

  const portfolioQuality =
    calculatePortfolioQuality(portfolioList);

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
    const validation = validateTransaction(
      transaction,
      accountList
    );

    if (!validation.valid) {
      window.alert(validation.errors.join('\\n'));
      return;
    }

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

  const handleSaveAccount = (account: Account) => {
    setAccountList((current) => {
      const result = editingAccount
        ? updateAccount(current, account)
        : createAccount(current, account);

      return result.success ? result.accounts : current;
    });

    setIsAccountModalOpen(false);
    setEditingAccount(null);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = (accountId: string) => {
    const isAccountInUse = transactionList.some(
      (transaction) =>
        transaction.accountId === accountId
    );

    if (isAccountInUse) {
      window.alert(
        'This account cannot be deleted because it is linked to one or more transactions.'
      );
      return;
    }

    setAccountList((current) => {
      const result = deleteAccount(current, accountId);

      if (!result.success) {
        window.alert(result.errors.join('\\n'));
        return current;
      }

      return result.accounts;
    });
  };

  const openAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
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

  const handleSaveBudget = (budget: Budget) => {
    setBudgetList((current) => {
      const result = editingBudget
        ? updateBudget(current, budget)
        : createBudget(current, budget);

      if (!result.success) {
        window.alert(result.errors.join('\n'));
        return current;
      }

      return result.budgets;
    });

    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsBudgetModalOpen(true);
  };

  const handleDeleteBudget = (budgetId: string) => {
    setBudgetList((current) => {
      const result = deleteBudget(current, budgetId);

      if (!result.success) {
        window.alert(result.errors.join('\n'));
        return current;
      }

      return result.budgets;
    });
  };

  const openAddBudget = () => {
    setEditingBudget(null);
    setIsBudgetModalOpen(true);
  };

  const handleRestoreBackup = (data: AppBackupData) => {
    setAccountList(data.accounts);
    setTransactionList(data.transactions);
    setPortfolioList(data.portfolio);
    setBudgetList(data.budgets);
  };

  const existingCategories = Array.from(
    new Set(transactionList.map((t) => t.category).filter(Boolean))
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Accounts':
        return (
          <Card>
            <SectionHeader
              title="Accounts"
              description="Manage your cash, bank, and e-wallet accounts."
            />

            <AccountList
              accounts={accountList}
              transactions={transactionList}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
            />
          </Card>
        );

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
              accounts={accountList}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              emptyMessage={
                transactionList.length === 0
                  ? 'No transactions yet.'
                  : 'No transactions match your search.'
              }
              emptyDescription={
                transactionList.length === 0
                  ? 'Add a transaction to start tracking your activity.'
                  : 'Try a different title, category, type, or date.'
              }
            />
          </Card>
        );

      case 'Markets':
        return (
          <Card>
            <SectionHeader
              title="Markets"
              description="Live market feed for Forex, Crypto & Indonesian Stocks (IHSG)."
            />

            <MarketList
              assets={marketList}
              onRefresh={handleRefreshMarkets}
              isRefreshing={isSyncingMarkets}
              lastSyncTime={marketLastSync}
            />
          </Card>
        );

      case 'Budgets':
        return (
          <Card>
            <SectionHeader
              title="Budget Realization"
              description="Monthly spending limits vs actual transaction expenses by category."
            />

            <BudgetList
              budgets={budgetList}
              transactions={transactionList}
              selectedMonth={selectedBudgetMonth}
              onMonthChange={setSelectedBudgetMonth}
              onEdit={handleEditBudget}
              onDelete={handleDeleteBudget}
              onAdd={openAddBudget}
            />
          </Card>
        );

      case 'Cashflow':
        return (
          <Card>
            <SectionHeader
              title="Cashflow Analytics"
              description="Monthly income versus expenses comparison and category spending shifts."
            />

            <CashflowView
              transactions={transactionList}
              selectedMonth={selectedBudgetMonth}
              onMonthChange={setSelectedBudgetMonth}
            />
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
              accounts={accountList}
            />

            <CashflowMiniCard
              transactions={transactionList}
              currentMonth={selectedBudgetMonth}
              onNavigateToCashflow={() => setActiveTab('Cashflow')}
            />

            <BudgetOverviewCard
              budgets={budgetList}
              transactions={transactionList}
              currentMonth={selectedBudgetMonth}
              onNavigateToBudgets={() => setActiveTab('Budgets')}
            />

            <PortfolioAnalytics
              analytics={portfolioAnalytics}
            />

            <PortfolioAllocation
              allocation={portfolioAllocation}
              isEmpty={portfolioList.length === 0}
            />

            <PortfolioQuality
              quality={portfolioQuality}
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
                  accounts={accountList}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  emptyMessage={
                    transactionList.length === 0
                      ? 'No transactions yet.'
                      : 'No transactions match your search.'
                  }
                  emptyDescription={
                    transactionList.length === 0
                      ? 'Add a transaction to see your latest activity here.'
                      : 'Try a different title, category, type, or date.'
                  }
                />
              </Card>
            </section>

            <QuickSearch
              value={searchQuery}
              activeQuery={activeSearchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              onClear={() => {
                setSearchQuery('');
                setActiveSearchQuery('');
              }}
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

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBackupModalOpen(true)}
            >
              Export / Restore
            </Button>

            <Badge variant={marketLastSync ? 'positive' : 'default'}>
              {marketLastSync ? '🟢 Live Market Active' : 'Simulated Data'}
            </Badge>
          </div>
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
            ) : activeTab === 'Accounts' ? (
              <Button
                size="sm"
                onClick={openAddAccount}
              >
                + Add Account
              </Button>
            ) : activeTab === 'Budgets' ? (
              <Button
                size="sm"
                onClick={openAddBudget}
              >
                + Add Budget
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
        accounts={accountList}
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

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleSaveAccount}
        initialData={editingAccount}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={handleSaveBudget}
        initialData={editingBudget}
        existingCategories={existingCategories}
        defaultMonth={selectedBudgetMonth}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        accounts={accountList}
        transactions={transactionList}
        portfolio={portfolioList}
        budgets={budgetList}
        onRestore={handleRestoreBackup}
      />
    </div>
  );
}

export default App;
