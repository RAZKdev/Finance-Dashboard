import { lazy, Suspense, useEffect, useState } from 'react';
import {
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
} from './components/cashflow';
import type {
  Account,
  AppBackupData,
  Budget,
  PortfolioAsset,
  Transaction,
} from './types/finance';
import { Sidebar, Navigation } from './components/navigation';
import { useLanguage } from './i18n/LanguageContext';
import { useTheme } from './theme/ThemeContext';
import { formatRupiah } from './utils/currency';
import {
  FazztrackOverview,
} from './components/dashboard';
import {
  PortfolioList,
  PortfolioModal,
} from './components/portfolio';
import { demoAccounts, demoBudgets, demoPortfolio, demoTransactions } from './data/demoData';
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
  validateTransaction,
} from './utils/transactions';

const MarketList = lazy(() =>
  import('./components/markets').then((module) => ({
    default: module.MarketList,
  }))
);

const BackupModal = lazy(() =>
  import('./components/backup').then((module) => ({
    default: module.BackupModal,
  }))
);

const TRANSACTIONS_STORAGE_KEY = 'finance-dashboard-transactions-v1';
const PORTFOLIO_STORAGE_KEY = 'finance-dashboard-portfolio-v1';

const loadTransactions = (accountList: Account[]): Transaction[] => {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    const candidates = parsed.filter((item): item is Transaction => {
      if (!item || typeof item !== 'object') return false;
      const value = item as Record<string, unknown>;
      return (
        typeof value.id === 'string' &&
        typeof value.title === 'string' &&
        typeof value.amount === 'number' &&
        (value.type === 'income' || value.type === 'expense') &&
        typeof value.category === 'string' &&
        typeof value.date === 'string' &&
        (value.accountId === undefined || typeof value.accountId === 'string')
      );
    });

    return candidates.filter(
      (transaction) => validateTransaction(transaction, accountList).valid
    );
  } catch {
    return [];
  }
};

const loadPortfolio = (): PortfolioAsset[] => {
  try {
    const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    const validAssets: PortfolioAsset[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
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
    return [];
  }
};

export function App() {
  const { t, lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [accountList, setAccountList] = useState<Account[]>(loadAccounts);
  const [transactionList, setTransactionList] = useState<Transaction[]>(() =>
    loadTransactions(loadAccounts())
  );
  const [portfolioList, setPortfolioList] = useState<PortfolioAsset[]>(loadPortfolio);
  const [budgetList, setBudgetList] = useState<Budget[]>(loadBudgets);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [editingPortfolioAsset, setEditingPortfolioAsset] = useState<PortfolioAsset | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState('2024-03');

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

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
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactionList));
    } catch {
      // Keep app usable on storage error
    }
  }, [transactionList]);

  useEffect(() => {
    saveAccounts(accountList);
  }, [accountList]);

  useEffect(() => {
    try {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolioList));
    } catch {
      // Keep app usable on storage error
    }
  }, [portfolioList]);

  useEffect(() => {
    saveBudgets(budgetList);
  }, [budgetList]);

  const filteredTransactions = transactionList.filter((transaction) => {
    const query = activeSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return [
      transaction.title,
      transaction.category,
      transaction.type,
      transaction.date,
    ].some((value) => value.toLowerCase().includes(query));
  });

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (transaction: Transaction) => {
    const validation = validateTransaction(transaction, accountList);
    if (!validation.valid) {
      window.alert(validation.errors.join('\n'));
      return;
    }

    if (editingTransaction) {
      setTransactionList((current) =>
        current.map((item) => (item.id === transaction.id ? transaction : item))
      );
    } else {
      setTransactionList((current) => [transaction, ...current]);
    }
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Hapus transaksi ini?')) {
      setTransactionList((current) => current.filter((item) => item.id !== id));
    }
  };

  const openAddTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditPortfolio = (asset: PortfolioAsset) => {
    setEditingPortfolioAsset(asset);
    setIsPortfolioModalOpen(true);
  };

  const handleSavePortfolio = (asset: PortfolioAsset) => {
    if (editingPortfolioAsset) {
      setPortfolioList((current) =>
        current.map((item) => (item.id === asset.id ? asset : item))
      );
    } else {
      setPortfolioList((current) => [...current, asset]);
    }
    setIsPortfolioModalOpen(false);
    setEditingPortfolioAsset(null);
  };

  const handleDeletePortfolio = (id: string) => {
    if (window.confirm('Hapus aset ini?')) {
      setPortfolioList((current) => current.filter((item) => item.id !== id));
    }
  };

  const openAddPortfolio = () => {
    setEditingPortfolioAsset(null);
    setIsPortfolioModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (account: Account) => {
    if (editingAccount) {
      const result = updateAccount(accountList, account);
      if (!result.success) {
        window.alert(result.errors.join('\n'));
        return;
      }
      setAccountList(result.accounts);
    } else {
      const result = createAccount(accountList, account);
      if (!result.success) {
        window.alert(result.errors.join('\n'));
        return;
      }
      setAccountList(result.accounts);
    }
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    if (window.confirm('Hapus akun ini?')) {
      const result = deleteAccount(accountList, id);
      if (!result.success) {
        window.alert(result.errors.join('\n'));
        return;
      }
      setAccountList(result.accounts);
    }
  };

  const openAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = (budget: Budget) => {
    if (editingBudget) {
      const result = updateBudget(budgetList, budget);
      if (!result.success) {
        window.alert(result.errors.join('\n'));
        return;
      }
      setBudgetList(result.budgets);
    } else {
      const result = createBudget(budgetList, budget);
      if (!result.success) {
        window.alert(result.errors.join('\n'));
        return;
      }
      setBudgetList(result.budgets);
    }
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  };

  const handleDeleteBudget = (id: string) => {
    if (window.confirm('Hapus anggaran ini?')) {
      const result = deleteBudget(budgetList, id);
      if (!result.success) {
        window.alert(result.errors.join('\n'));
        return;
      }
      setBudgetList(result.budgets);
    }
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

  const handleLoadDemoData = () => {
    setAccountList(demoAccounts);
    saveAccounts(demoAccounts);

    setTransactionList(demoTransactions);
    try {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(demoTransactions));
    } catch {
      // ignore storage error
    }

    setPortfolioList(demoPortfolio);
    try {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(demoPortfolio));
    } catch {
      // ignore storage error
    }

    setBudgetList(demoBudgets);
    saveBudgets(demoBudgets);
  };

  const handleClearAllData = () => {
    if (window.confirm('Kosongkan semua data ke Rp 0? Seluruh mutasi transaksi, rekening, dan portofolio lokal akan dihapus.')) {
      setAccountList([]);
      saveAccounts([]);

      setTransactionList([]);
      try {
        localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
      } catch {
        // ignore storage error
      }

      setPortfolioList([]);
      try {
        localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
      } catch {
        // ignore storage error
      }

      setBudgetList([]);
      saveBudgets([]);
    }
  };

  const existingCategories = Array.from(
    new Set(transactionList.map((t) => t.category).filter(Boolean))
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Wallet':
      case 'Accounts':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            <SectionHeader
              title={t('sections.accountsTitle')}
              description={t('sections.accountsDesc')}
              action={
                <Button size="sm" onClick={openAddAccount} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-xs">
                  {t('sections.addAccount')}
                </Button>
              }
            />
            <AccountList
              accounts={accountList}
              transactions={transactionList}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
            />
          </Card>
        );

      case 'Transaction':
      case 'Transactions':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            <SectionHeader
              title={t('sections.transactionsTitle')}
              description={t('sections.transactionsDesc')}
              action={
                <Button size="sm" onClick={openAddTransaction} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-xs">
                  {t('sections.addTransaction')}
                </Button>
              }
            />
            <TransactionList
              transactions={filteredTransactions}
              accounts={accountList}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              emptyMessage={t('common.noTransactions')}
              emptyDescription={t('common.addTransactionPrompt')}
            />
          </Card>
        );

      case 'Card':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            <SectionHeader
              title="Kartu & Rekening Pembayaran"
              description="Kelola kartu debit, kartu kredit, dan akun dompet digital Anda"
              action={
                <Button size="sm" onClick={openAddAccount} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-xs">
                  + Tambah Kartu / Rekening
                </Button>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {accountList.map((acc) => (
                <div key={acc.id} className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-800 text-white shadow-md relative overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-80">{acc.type}</span>
                    <span className="text-sm font-extrabold tracking-tight">Finance Dashboard</span>
                  </div>
                  <p className="text-xs opacity-75">{acc.name}</p>
                  <p className="text-2xl font-black tracking-tight mt-1">
                    {formatRupiah(acc.openingBalance || 0)}
                  </p>
                  <div className="mt-4 flex justify-between items-center text-[11px] opacity-75">
                    <span>•••• •••• •••• {acc.id.slice(-4) || '8821'}</span>
                    <span>EXP 12/28</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );

      case 'Wishlist':
      case 'Budgets':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            <SectionHeader
              title={t('sections.budgetsTitle')}
              description={t('sections.budgetsDesc')}
              action={
                <Button size="sm" onClick={openAddBudget} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-xs">
                  {t('sections.addBudget')}
                </Button>
              }
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

      case 'Investment':
      case 'Portfolio':
        return (
          <div className="space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
              <SectionHeader
                title={t('sections.portfolioTitle')}
                description={t('sections.portfolioDesc')}
                action={
                  <Button size="sm" onClick={openAddPortfolio} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-xs">
                    {t('sections.addAsset')}
                  </Button>
                }
              />
              <PortfolioList
                assets={portfolioList}
                onEdit={handleEditPortfolio}
                onDelete={handleDeletePortfolio}
              />
            </Card>

            <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
              <SectionHeader
                title={t('sections.marketsTitle')}
                description={t('sections.marketsDesc')}
              />
              <MarketList
                assets={marketList}
                onRefresh={handleRefreshMarkets}
                isRefreshing={isSyncingMarkets}
                lastSyncTime={marketLastSync}
              />
            </Card>
          </div>
        );

      case 'Markets':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            <SectionHeader
              title={t('sections.marketsTitle')}
              description={t('sections.marketsDesc')}
            />
            <MarketList
              assets={marketList}
              onRefresh={handleRefreshMarkets}
              isRefreshing={isSyncingMarkets}
              lastSyncTime={marketLastSync}
            />
          </Card>
        );

      case 'Settings':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            <SectionHeader
              title="Pengaturan & Konfigurasi Sistem"
              description="Kelola tema terang/gelap, preferensi bahasa, manajemen data lokal, dan cadangan data"
            />
            <div className="mt-4 space-y-6 text-sm divide-y divide-slate-100 dark:divide-slate-800">
              {/* Theme Section */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Tema Tampilan (Terang / Gelap)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mode saat ini: <strong className="text-slate-800 dark:text-slate-200">{theme === 'dark' ? 'Mode Gelap (Dark)' : 'Mode Terang (Light)'}</strong>
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={toggleTheme} className="rounded-xl font-semibold flex items-center gap-2">
                  <span>{theme === 'dark' ? '☀️ Ganti ke Mode Terang' : '🌙 Ganti ke Mode Gelap'}</span>
                </Button>
              </div>

              {/* Language Section */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Bahasa Antarmuka</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Saat ini: {lang === 'en' ? 'English (EN)' : 'Bahasa Indonesia (ID)'}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={toggleLang} className="rounded-xl font-semibold">
                  Ganti ke {lang === 'en' ? 'Bahasa Indonesia' : 'English'}
                </Button>
              </div>

              {/* Simulation & Data Controls */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Simulasi & Manajemen Data</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mulai dari keadaan bersih (Rp 0) untuk penggunaan asli, atau muat data simulasi untuk mencoba antarmuka.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLoadDemoData}
                    className="rounded-xl font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                  >
                    📥 Muat Data Demo
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleClearAllData}
                    className="rounded-xl font-semibold"
                  >
                    🗑️ Kosongkan Data (Rp 0)
                  </Button>
                </div>
              </div>

              {/* Data & Backup Section */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Cadangan & Ekspor Data</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ekspor seluruh transaksi, akun, dan portofolio ke format JSON atau CSV
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setIsBackupModalOpen(true)} className="rounded-xl font-semibold">
                  Ekspor / Pulihkan Data
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'Help':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            <SectionHeader
              title="Panduan & Pusat Bantuan"
              description="Pelajari cara mengoptimalkan seluruh fitur Finance Dashboard"
            />
            <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200">
                <h4 className="font-bold text-sm mb-1 text-indigo-900 dark:text-indigo-300">🛡️ Penyimpanan Lokal & Privasi Penuh</h4>
                <p className="leading-relaxed">
                  Seluruh data keuangan, rekening, anggaran, dan portofolio Anda disimpan secara aman langsung di penyimpanan lokal perangkat (localStorage browser). Tidak ada rekaman transaksi atau kekayaan pribadi yang dikirimkan ke server pihak ketiga. Gunakan fitur Ekspor / Pulihkan untuk mencadangkan data secara mandiri.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">💡 Navigasi Cepat Keyboard</h4>
                <p>Gunakan kolom pencarian di sidebar atau tekan tombol pintas untuk langsung menyaring daftar mutasi dan portofolio.</p>
              </div>
            </div>
          </Card>
        );

      case 'Cashflow':
        return (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            <SectionHeader
              title={t('sections.cashflowTitle')}
              description={t('sections.cashflowDesc')}
            />
            <CashflowView
              transactions={transactionList}
              selectedMonth={selectedBudgetMonth}
              onMonthChange={setSelectedBudgetMonth}
            />
          </Card>
        );

      case 'Dashboard':
      case 'Overview':
      default:
        return (
          <FazztrackOverview
            transactions={transactionList}
            accounts={accountList}
            portfolioAssets={portfolioList}
            onOpenTransactionModal={openAddTransaction}
            onLoadDemoData={handleLoadDemoData}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
      {/* Modern Left Sidebar - Hidden on mobile (<768px) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setActiveSearchQuery(query);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 px-4 md:px-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between sticky top-0 z-30 transition-colors">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span className="text-slate-900 dark:text-white">Dashboard</span>
            <span>/</span>
            <span className="text-slate-500 dark:text-slate-400">
              {activeTab === 'Dashboard' ? 'Overview' : activeTab}
            </span>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Export / Restore Button */}
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
              title="Ekspor / Pulihkan Data"
            >
              <span aria-hidden="true">💾</span>
              <span className="hidden sm:inline">{t('header.exportRestore')}</span>
            </button>

            {/* Theme Toggle (Terang / Gelap) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Ganti ke Mode Terang (Light)' : 'Ganti ke Mode Gelap (Dark)'}
              aria-label={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Language switch */}
            <button
              type="button"
              onClick={toggleLang}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
              title="Ganti Bahasa"
            >
              <span aria-hidden="true">🌐</span>
              <span>{lang.toUpperCase()}</span>
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Navigation Tabs (Hidden on desktop md:hidden) */}
        <div className="md:hidden">
          <Navigation
            activeTab={
              activeTab === 'Dashboard' ? 'Overview' :
              activeTab === 'Wallet' ? 'Accounts' :
              activeTab === 'Transaction' ? 'Transactions' :
              activeTab === 'Wishlist' ? 'Budgets' :
              activeTab === 'Investment' ? 'Portfolio' :
              activeTab
            }
            onTabChange={(tab) => {
              if (tab === 'Backup') {
                setIsBackupModalOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
          />
        </div>

        {/* Main Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Section Title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {activeTab === 'Dashboard' ? 'Overview' : activeTab}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {activeTab === 'Dashboard'
                  ? 'Ringkasan posisi aset, arus kas, dan mutasi keuangan Anda secara realtime'
                  : `Kelola ${activeTab.toLowerCase()} Anda`}
              </p>
            </div>

            {/* Quick Action Button for non-dashboard tabs */}
            {activeTab !== 'Dashboard' && activeTab !== 'Settings' && activeTab !== 'Help' && (
              <Button
                size="sm"
                onClick={openAddTransaction}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-xs"
              >
                + Tambah Transaksi
              </Button>
            )}
          </div>

          {/* Render Active View */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24 text-xs text-slate-400">
                {t('common.loading')}
              </div>
            }
          >
            {renderTabContent()}
          </Suspense>
        </main>
      </div>

      {/* Modals */}
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

      {isBackupModalOpen && (
        <Suspense fallback={null}>
          <BackupModal
            isOpen={isBackupModalOpen}
            onClose={() => setIsBackupModalOpen(false)}
            accounts={accountList}
            transactions={transactionList}
            portfolio={portfolioList}
            budgets={budgetList}
            onRestore={handleRestoreBackup}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
