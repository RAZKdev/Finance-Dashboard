import test from 'node:test';
import assert from 'node:assert/strict';

// Import pure utils compiled or directly
import {
  calculatePortfolioMetrics,
  getPortfolioValue,
  calculatePortfolioAnalytics,
  calculatePortfolioQuality,
  calculatePortfolioAllocation,
} from './src/utils/portfolio.ts';

import {
  validateAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  calculateAccountBalance,
  calculateAccountBalanceSummary,
  calculateTotalCashBalance,
  loadAccounts,
} from './src/utils/accounts.ts';

import {
  validateTransaction,
  filterValidTransactions,
} from './src/utils/transactions.ts';

import {
  validateBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  calculateBudgetRealization,
  calculateMonthlyBudgetSummary,
  loadBudgets,
  isValidMonthFormat,
} from './src/utils/budgets.ts';

import {
  formatMonthLabel,
  getPreviousMonth,
  getMonthWindow,
  calculateMonthlyCashflow,
  calculateCategoryExpenses,
  calculateCashflowAnalytics,
} from './src/utils/cashflow.ts';

import {
  createBackupPayload,
  validateBackupPayload,
  mergeBackupData,
  escapeCSVValue,
  generateCSV,
  exportTransactionsToCSV,
  exportAccountsToCSV,
  exportPortfolioToCSV,
  exportBudgetsToCSV,
} from './src/utils/backup.ts';

import {
  loadCachedMarketAssets,
  saveCachedMarketAssets,
  syncLiveMarketAssets,
} from './src/utils/marketLive.ts';

test('calculatePortfolioMetrics - complete gain scenario', () => {
  const asset = {
    id: 'asset-1',
    name: 'BBCA',
    value: 10000000,
    quantity: 1000,
    averageBuyPrice: 8000,
    currentPrice: 10000,
  };

  const metrics = calculatePortfolioMetrics(asset);
  assert.equal(metrics.costBasis, 8000000);
  assert.equal(metrics.marketValue, 10000000);
  assert.equal(metrics.profitLoss, 2000000);
  assert.equal(metrics.profitLossPercent, 25);
});

test('calculatePortfolioMetrics - complete loss scenario', () => {
  const asset = {
    id: 'asset-2',
    name: 'GOTO',
    value: 500000,
    quantity: 10000,
    averageBuyPrice: 100,
    currentPrice: 50,
  };

  const metrics = calculatePortfolioMetrics(asset);
  assert.equal(metrics.costBasis, 1000000);
  assert.equal(metrics.marketValue, 500000);
  assert.equal(metrics.profitLoss, -500000);
  assert.equal(metrics.profitLossPercent, -50);
});

test('calculatePortfolioMetrics - incomplete/invalid inputs return null', () => {
  assert.deepEqual(
    calculatePortfolioMetrics({ id: '1', name: 'Cash', value: 1000 }),
    { costBasis: null, marketValue: null, profitLoss: null, profitLossPercent: null }
  );

  assert.deepEqual(
    calculatePortfolioMetrics({ id: '1', name: 'Test', value: 1000, quantity: -10, averageBuyPrice: 100 }),
    { costBasis: null, marketValue: null, profitLoss: null, profitLossPercent: null }
  );

  assert.deepEqual(
    calculatePortfolioMetrics({ id: '1', name: 'Test', value: 1000, quantity: 10, averageBuyPrice: 0 }),
    { costBasis: null, marketValue: null, profitLoss: null, profitLossPercent: null }
  );

  // currentPrice missing returns costBasis, but marketValue and P/L are null
  assert.deepEqual(
    calculatePortfolioMetrics({ id: '1', name: 'Test', value: 1000, quantity: 10, averageBuyPrice: 100 }),
    { costBasis: 1000, marketValue: null, profitLoss: null, profitLossPercent: null }
  );
});

test('getPortfolioValue - returns marketValue when available, otherwise asset.value', () => {
  const withMarket = {
    id: '1',
    name: 'Stock',
    value: 5000,
    quantity: 10,
    averageBuyPrice: 500,
    currentPrice: 600,
  };
  assert.equal(getPortfolioValue(withMarket), 6000);

  const withoutMarket = {
    id: '2',
    name: 'Other',
    value: 5000,
  };
  assert.equal(getPortfolioValue(withoutMarket), 5000);
});

test('calculatePortfolioAnalytics - all complete metrics', () => {
  const assets = [
    { id: '1', name: 'A', value: 1000, quantity: 10, averageBuyPrice: 100, currentPrice: 120 }, // cost 1000, val 1200, pl +200 (+20%)
    { id: '2', name: 'B', value: 2000, quantity: 20, averageBuyPrice: 100, currentPrice: 80 },  // cost 2000, val 1600, pl -400 (-20%)
  ];

  const analytics = calculatePortfolioAnalytics(assets);
  assert.equal(analytics.totalAssets, 2);
  assert.equal(analytics.totalCostBasis, 3000);
  assert.equal(analytics.totalMarketValue, 2800);
  assert.equal(analytics.totalProfitLoss, -200);
  assert.equal(Number(analytics.totalProfitLossPercent.toFixed(4)), Number(((-200 / 3000) * 100).toFixed(4)));
  assert.equal(analytics.completeMetrics, true);
  assert.equal(analytics.assetsWithMetrics, 2);
  assert.equal(analytics.assetsWithoutMetrics, 0);
  assert.equal(analytics.bestPerformer?.id, '1');
  assert.equal(analytics.worstPerformer?.id, '2');
});

test('calculatePortfolioAnalytics - mixed incomplete metrics safeguards honesty', () => {
  const assets = [
    { id: '1', name: 'A', value: 1200, quantity: 10, averageBuyPrice: 100, currentPrice: 120 },
    { id: '2', name: 'B', value: 2000 }, // incomplete metrics
  ];

  const analytics = calculatePortfolioAnalytics(assets);
  assert.equal(analytics.totalAssets, 2);
  assert.equal(analytics.completeMetrics, false);
  assert.equal(analytics.totalProfitLoss, null);
  assert.equal(analytics.totalProfitLossPercent, null);
  assert.equal(analytics.assetsWithMetrics, 1);
  assert.equal(analytics.assetsWithoutMetrics, 1);
});

test('calculatePortfolioAllocation - calculates proportions correctly', () => {
  const assets = [
    { id: '1', name: 'A', value: 3000 },
    { id: '2', name: 'B', value: 7000 },
  ];

  const alloc = calculatePortfolioAllocation(assets);
  assert.equal(alloc.totalValue, 10000);
  assert.equal(alloc.items.length, 2);
  assert.equal(alloc.items[0].percentage, 30);
  assert.equal(alloc.items[1].percentage, 70);
  assert.equal(alloc.complete, true);
});

test('calculatePortfolioQuality - detects concentration correctly', () => {
  const highConcentration = [
    { id: '1', name: 'A', value: 8500 },
    { id: '2', name: 'B', value: 1500 },
  ];
  assert.equal(calculatePortfolioQuality(highConcentration).concentration, 'very-high');

  const lowConcentration = [
    { id: '1', name: 'A', value: 2500 },
    { id: '2', name: 'B', value: 2500 },
    { id: '3', name: 'C', value: 2500 },
    { id: '4', name: 'D', value: 2500 },
  ];
  assert.equal(calculatePortfolioQuality(lowConcentration).concentration, 'low');
});

test('Account CRUD validation & mutation', () => {
  const initialAccounts = [];
  const validAccount = {
    id: 'acc-1',
    name: 'BCA Main',
    type: 'bank',
    openingBalance: 5000000,
    currency: 'IDR',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const createRes = createAccount(initialAccounts, validAccount);
  assert.equal(createRes.success, true);
  assert.equal(createRes.accounts.length, 1);

  // Duplicate ID
  const dupRes = createAccount(createRes.accounts, validAccount);
  assert.equal(dupRes.success, false);
  assert.equal(dupRes.errors[0], 'Account id already exists.');

  // Update
  const updatedAccount = { ...validAccount, name: 'BCA Updated' };
  const updateRes = updateAccount(createRes.accounts, updatedAccount);
  assert.equal(updateRes.success, true);
  assert.equal(updateRes.accounts[0].name, 'BCA Updated');

  // Delete
  const deleteRes = deleteAccount(updateRes.accounts, 'acc-1');
  assert.equal(deleteRes.success, true);
  assert.equal(deleteRes.accounts.length, 0);
});

test('Transaction validation rules', () => {
  const accountList = [
    { id: 'acc-1', name: 'Cash', type: 'cash', openingBalance: 0, currency: 'IDR', createdAt: '2026-01-01' },
  ];

  // Valid transaction with account
  const validWithAcc = {
    id: 'tx-1',
    title: 'Salary',
    amount: 10000000,
    type: 'income',
    category: 'Work',
    date: '2026-09-01',
    accountId: 'acc-1',
  };
  assert.equal(validateTransaction(validWithAcc, accountList).valid, true);

  // Valid transaction without account (backward compatible)
  const validWithoutAcc = {
    id: 'tx-2',
    title: 'Lunch',
    amount: 50000,
    type: 'expense',
    category: 'Food',
    date: '2026-09-01',
  };
  assert.equal(validateTransaction(validWithoutAcc, accountList).valid, true);

  // Invalid transaction: non-existent account
  const invalidAcc = {
    id: 'tx-3',
    title: 'Coffee',
    amount: 25000,
    type: 'expense',
    category: 'Food',
    date: '2026-09-01',
    accountId: 'non-existent',
  };
  const invalidRes = validateTransaction(invalidAcc, accountList);
  assert.equal(invalidRes.valid, false);
  assert.equal(invalidRes.errors.includes('Transaction account not found.'), true);

  // Invalid amount (non-finite)
  const invalidAmount = { ...validWithoutAcc, amount: NaN };
  assert.equal(validateTransaction(invalidAmount, accountList).valid, false);
});

test('calculateAccountBalance - isolated calculations and transaction types', () => {
  const accountA = {
    id: 'acc-a',
    name: 'Bank A',
    type: 'bank',
    openingBalance: 1000000,
    currency: 'IDR',
    createdAt: '2026-01-01',
  };

  const accountB = {
    id: 'acc-b',
    name: 'Wallet B',
    type: 'ewallet',
    openingBalance: 500000,
    currency: 'IDR',
    createdAt: '2026-01-01',
  };

  const transactions = [
    // Account A transactions
    { id: 'tx-1', title: 'Salary', amount: 3000000, type: 'income', category: 'Income', date: '2026-09-01', accountId: 'acc-a' },
    { id: 'tx-2', title: 'Groceries', amount: 400000, type: 'expense', category: 'Food', date: '2026-09-02', accountId: 'acc-a' },
    // Account B transactions
    { id: 'tx-3', title: 'Topup', amount: 200000, type: 'income', category: 'Transfer', date: '2026-09-03', accountId: 'acc-b' },
    { id: 'tx-4', title: 'Coffee', amount: 50000, type: 'expense', category: 'Food', date: '2026-09-04', accountId: 'acc-b' },
    // Unlinked transaction (no accountId)
    { id: 'tx-5', title: 'Cash Gift', amount: 100000, type: 'income', category: 'Other', date: '2026-09-05' },
  ];

  // Acc A: 1,000,000 + 3,000,000 - 400,000 = 3,600,000
  assert.equal(calculateAccountBalance(accountA, transactions), 3600000);

  // Acc B: 500,000 + 200,000 - 50,000 = 650,000
  assert.equal(calculateAccountBalance(accountB, transactions), 650000);

  // Acc with no transactions
  const accountEmpty = {
    id: 'acc-c',
    name: 'Empty Vault',
    type: 'cash',
    openingBalance: 250000,
    currency: 'IDR',
    createdAt: '2026-01-01',
  };
  assert.equal(calculateAccountBalance(accountEmpty, transactions), 250000);
});

test('calculateAccountBalanceSummary - detailed ledger breakdown', () => {
  const account = {
    id: 'acc-1',
    name: 'Main Account',
    type: 'bank',
    openingBalance: 2000000,
    currency: 'IDR',
    createdAt: '2026-01-01',
  };

  const transactions = [
    { id: 'tx-1', title: 'Client Payment', amount: 1500000, type: 'income', category: 'Work', date: '2026-09-01', accountId: 'acc-1' },
    { id: 'tx-2', title: 'Interest', amount: 50000, type: 'income', category: 'Investment', date: '2026-09-02', accountId: 'acc-1' },
    { id: 'tx-3', title: 'Electricity', amount: 300000, type: 'expense', category: 'Bills', date: '2026-09-03', accountId: 'acc-1' },
    { id: 'tx-4', title: 'Internet', amount: 250000, type: 'expense', category: 'Bills', date: '2026-09-04', accountId: 'acc-1' },
    // Irrelevant transaction
    { id: 'tx-5', title: 'Other Account Tx', amount: 999999, type: 'income', category: 'Bills', date: '2026-09-05', accountId: 'acc-other' },
  ];

  const summary = calculateAccountBalanceSummary(account, transactions);
  assert.equal(summary.openingBalance, 2000000);
  assert.equal(summary.totalIncome, 1550000);
  assert.equal(summary.totalExpense, 550000);
  assert.equal(summary.netChange, 1000000);
  assert.equal(summary.currentBalance, 3000000);
});

test('calculateTotalCashBalance - aggregate across all accounts and transactions', () => {
  const accounts = [
    { id: 'acc-1', name: 'Bank 1', type: 'bank', openingBalance: 1000000, currency: 'IDR', createdAt: '2026-01-01' },
    { id: 'acc-2', name: 'Bank 2', type: 'bank', openingBalance: 2000000, currency: 'IDR', createdAt: '2026-01-01' },
  ];

  const transactions = [
    { id: 'tx-1', title: 'Income Linked', amount: 500000, type: 'income', category: 'Work', date: '2026-09-01', accountId: 'acc-1' },
    { id: 'tx-2', title: 'Expense Linked', amount: 200000, type: 'expense', category: 'Food', date: '2026-09-02', accountId: 'acc-2' },
    { id: 'tx-3', title: 'Income Unlinked', amount: 100000, type: 'income', category: 'Gift', date: '2026-09-03' },
    { id: 'tx-4', title: 'Expense Unlinked', amount: 50000, type: 'expense', category: 'Snack', date: '2026-09-04' },
  ];

  // Total opening = 1,000,000 + 2,000,000 = 3,000,000
  // Total income = 500,000 + 100,000 = 600,000
  // Total expense = 200,000 + 50,000 = 250,000
  // Total net cash = 3,000,000 + 600,000 - 250,000 = 3,350,000
  const total = calculateTotalCashBalance(accounts, transactions);
  assert.equal(total, 3350000);
});

test('loadAccounts - supports schema migration from legacy balance to openingBalance', () => {
  const originalLocalStorage = globalThis.localStorage;
  
  const mockStorage = new Map();
  mockStorage.set('finance-dashboard-accounts-v1', JSON.stringify([
    {
      id: 'acc-legacy-1',
      name: 'Old Bank Account',
      type: 'bank',
      balance: 4500000, // Legacy key
      currency: 'IDR',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-new-2',
      name: 'New Bank Account',
      type: 'bank',
      openingBalance: 1200000, // Modern key
      currency: 'IDR',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]));

  globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) ?? null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  };

  try {
    const loaded = loadAccounts();
    assert.equal(loaded.length, 2);
    assert.equal(loaded[0].id, 'acc-legacy-1');
    assert.equal(loaded[0].openingBalance, 4500000);
    assert.equal(loaded[1].id, 'acc-new-2');
    assert.equal(loaded[1].openingBalance, 1200000);
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test('validateBudget & isValidMonthFormat - checks constraints', () => {
  assert.equal(isValidMonthFormat('2026-09'), true);
  assert.equal(isValidMonthFormat('2026-01'), true);
  assert.equal(isValidMonthFormat('2026-12'), true);
  assert.equal(isValidMonthFormat('2026-00'), false);
  assert.equal(isValidMonthFormat('2026-13'), false);
  assert.equal(isValidMonthFormat('2026-9'), false);
  assert.equal(isValidMonthFormat('september'), false);

  const validBudget = {
    id: 'b-1',
    category: 'Groceries',
    limit: 2500000,
    month: '2026-09',
    createdAt: '2026-09-01T00:00:00.000Z',
  };
  assert.equal(validateBudget(validBudget).valid, true);

  // Missing category
  assert.equal(validateBudget({ ...validBudget, category: '' }).valid, false);

  // Zero or negative limit
  assert.equal(validateBudget({ ...validBudget, limit: 0 }).valid, false);
  assert.equal(validateBudget({ ...validBudget, limit: -500 }).valid, false);
  assert.equal(validateBudget({ ...validBudget, limit: NaN }).valid, false);

  // Invalid month
  assert.equal(validateBudget({ ...validBudget, month: '2026-15' }).valid, false);
});

test('Budget CRUD mutations and uniqueness rules', () => {
  const initialBudgets = [];
  const budgetA = {
    id: 'b-1',
    category: 'Food',
    limit: 2000000,
    month: '2026-09',
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  // Create A
  const res1 = createBudget(initialBudgets, budgetA);
  assert.equal(res1.success, true);
  assert.equal(res1.budgets.length, 1);

  // Duplicate ID
  const dupIdRes = createBudget(res1.budgets, { ...budgetA, category: 'Other' });
  assert.equal(dupIdRes.success, false);
  assert.equal(dupIdRes.errors.includes('Budget id already exists.'), true);

  // Duplicate Category in the SAME month (case-insensitive)
  const dupCatRes = createBudget(res1.budgets, {
    id: 'b-2',
    category: ' food ',
    limit: 1500000,
    month: '2026-09',
    createdAt: '2026-09-01T00:00:00.000Z',
  });
  assert.equal(dupCatRes.success, false);
  assert.equal(dupCatRes.errors.includes('A budget for this category and month already exists.'), true);

  // Same Category in a DIFFERENT month is ALLOWED
  const nextMonthBudget = {
    id: 'b-3',
    category: 'Food',
    limit: 2200000,
    month: '2026-10',
    createdAt: '2026-10-01T00:00:00.000Z',
  };
  const diffMonthRes = createBudget(res1.budgets, nextMonthBudget);
  assert.equal(diffMonthRes.success, true);
  assert.equal(diffMonthRes.budgets.length, 2);

  // Update budget limit
  const updated = { ...budgetA, limit: 2500000 };
  const updateRes = updateBudget(diffMonthRes.budgets, updated);
  assert.equal(updateRes.success, true);
  assert.equal(updateRes.budgets.find(b => b.id === 'b-1').limit, 2500000);

  // Delete budget
  const delRes = deleteBudget(updateRes.budgets, 'b-1');
  assert.equal(delRes.success, true);
  assert.equal(delRes.budgets.length, 1);
  assert.equal(delRes.budgets[0].id, 'b-3');
});

test('calculateBudgetRealization - spending aggregation and status transitions', () => {
  const budget = {
    id: 'b-dining',
    category: 'Dining',
    limit: 1000000,
    month: '2026-09',
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  const transactions = [
    // Matching expense
    { id: 't1', title: 'Lunch', amount: 300000, type: 'expense', category: 'Dining', date: '2026-09-02' },
    // Matching expense, case insensitive and trimmed
    { id: 't2', title: 'Dinner', amount: 400000, type: 'expense', category: '  dining  ', date: '2026-09-15' },
    // Income with same category - must be ignored!
    { id: 't3', title: 'Food Refund', amount: 100000, type: 'income', category: 'Dining', date: '2026-09-16' },
    // Different category - ignored
    { id: 't4', title: 'Gas', amount: 200000, type: 'expense', category: 'Transport', date: '2026-09-18' },
    // Different month - ignored
    { id: 't5', title: 'August Dinner', amount: 500000, type: 'expense', category: 'Dining', date: '2026-08-30' },
  ];

  // At 700,000 spent out of 1,000,000 (70%): status 'ok'
  const real1 = calculateBudgetRealization(budget, transactions);
  assert.equal(real1.spent, 700000);
  assert.equal(real1.remaining, 300000);
  assert.equal(real1.percentage, 70);
  assert.equal(real1.status, 'ok');

  // Add 150,000 expense -> total 850,000 (85%): status 'warning'
  const warningTx = [...transactions, { id: 't6', title: 'Cafe', amount: 150000, type: 'expense', category: 'Dining', date: '2026-09-20' }];
  const real2 = calculateBudgetRealization(budget, warningTx);
  assert.equal(real2.spent, 850000);
  assert.equal(real2.remaining, 150000);
  assert.equal(real2.percentage, 85);
  assert.equal(real2.status, 'warning');

  // Add 200,000 expense -> total 1,050,000 (105%): status 'exceeded'
  const exceededTx = [...warningTx, { id: 't7', title: 'Brunch', amount: 200000, type: 'expense', category: 'Dining', date: '2026-09-22' }];
  const real3 = calculateBudgetRealization(budget, exceededTx);
  assert.equal(real3.spent, 1050000);
  assert.equal(real3.remaining, -50000);
  assert.equal(real3.percentage, 105);
  assert.equal(real3.status, 'exceeded');
});

test('calculateMonthlyBudgetSummary - multi-category aggregation', () => {
  const budgets = [
    { id: 'b1', category: 'Housing', limit: 3000000, month: '2026-09', createdAt: '2026-09-01' },
    { id: 'b2', category: 'Food', limit: 2000000, month: '2026-09', createdAt: '2026-09-01' },
    { id: 'b3', category: 'Other Month', limit: 1000000, month: '2026-10', createdAt: '2026-10-01' },
  ];

  const transactions = [
    { id: 't1', title: 'Rent', amount: 3000000, type: 'expense', category: 'Housing', date: '2026-09-05' },
    { id: 't2', title: 'Groceries', amount: 2200000, type: 'expense', category: 'Food', date: '2026-09-10' },
  ];

  const summary = calculateMonthlyBudgetSummary(budgets, transactions, '2026-09');
  assert.equal(summary.month, '2026-09');
  assert.equal(summary.items.length, 2);
  assert.equal(summary.totalBudget, 5000000);
  assert.equal(summary.totalSpent, 5200000);
  assert.equal(summary.totalRemaining, -200000);
  assert.equal(Number(summary.overallPercentage.toFixed(2)), 104);
  assert.equal(summary.overBudgetCount, 1); // Food exceeded 2,000,000 limit
});

test('loadBudgets - handles valid data, invalid records, and localStorage fallback', () => {
  const originalLocalStorage = globalThis.localStorage;
  const mockStorage = new Map();

  mockStorage.set('finance-dashboard-budgets-v1', JSON.stringify([
    { id: 'b-ok', category: 'Transport', limit: 1000000, month: '2026-09', createdAt: '2026-09-01' },
    { id: 'b-corrupt', category: '', limit: -20, month: 'invalid', createdAt: '' }, // invalid
  ]));

  globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) ?? null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  };

  try {
    const loaded = loadBudgets([]);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 'b-ok');
    assert.equal(loaded[0].limit, 1000000);
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test('formatMonthLabel, getPreviousMonth, getMonthWindow - date calculations', () => {
  assert.equal(formatMonthLabel('2026-09'), 'Sep 2026');
  assert.equal(formatMonthLabel('2026-01'), 'Jan 2026');
  assert.equal(formatMonthLabel('2026-12'), 'Dec 2026');

  assert.equal(getPreviousMonth('2026-09'), '2026-08');
  assert.equal(getPreviousMonth('2026-01'), '2025-12'); // Year rollover

  const window6 = getMonthWindow('2026-09', 6);
  assert.deepEqual(window6, [
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
  ]);
});

test('calculateMonthlyCashflow - inflow, outflow, net and savings rate', () => {
  const transactions = [
    // Income
    { id: '1', title: 'Salary', amount: 10000000, type: 'income', category: 'Salary', date: '2026-09-01' },
    { id: '2', title: 'Bonus', amount: 2000000, type: 'income', category: 'Salary', date: '2026-09-15' },
    // Expense
    { id: '3', title: 'Rent', amount: 3000000, type: 'expense', category: 'Housing', date: '2026-09-05' },
    { id: '4', title: 'Food', amount: 1500000, type: 'expense', category: 'Food', date: '2026-09-10' },
    // Other month
    { id: '5', title: 'August Salary', amount: 10000000, type: 'income', category: 'Salary', date: '2026-08-01' },
  ];

  const sept = calculateMonthlyCashflow(transactions, '2026-09');
  assert.equal(sept.inflow, 12000000);
  assert.equal(sept.outflow, 4500000);
  assert.equal(sept.net, 7500000);
  // savingsRate: (7,500,000 / 12,000,000) * 100 = 62.5%
  assert.equal(sept.savingsRate, 62.5);

  // Expense only scenario
  const expenseOnly = [
    { id: '1', title: 'Lunch', amount: 50000, type: 'expense', category: 'Food', date: '2026-10-01' },
  ];
  const oct = calculateMonthlyCashflow(expenseOnly, '2026-10');
  assert.equal(oct.inflow, 0);
  assert.equal(oct.outflow, 50000);
  assert.equal(oct.net, -50000);
  assert.equal(oct.savingsRate, -100);

  // Zero activity scenario
  const empty = calculateMonthlyCashflow([], '2026-11');
  assert.equal(empty.inflow, 0);
  assert.equal(empty.outflow, 0);
  assert.equal(empty.net, 0);
  assert.equal(empty.savingsRate, 0);
});

test('calculateCategoryExpenses - expense distribution and month-over-month shift', () => {
  const transactions = [
    // Previous month (2026-08)
    { id: 'p1', title: 'Groceries', amount: 1000000, type: 'expense', category: 'Food', date: '2026-08-10' },
    { id: 'p2', title: 'Internet', amount: 400000, type: 'expense', category: 'Utilities', date: '2026-08-12' },

    // Current month (2026-09)
    { id: 'c1', title: 'Supermarket', amount: 1500000, type: 'expense', category: 'Food', date: '2026-09-05' },
    { id: 'c2', title: 'Dining out', amount: 500000, type: 'expense', category: ' food ', date: '2026-09-08' }, // case-insensitive trimmed
    { id: 'c3', title: 'Internet', amount: 300000, type: 'expense', category: 'Utilities', date: '2026-09-12' },
    { id: 'c4', title: 'Train ticket', amount: 200000, type: 'expense', category: 'Transport', date: '2026-09-20' }, // new category
  ];

  // Total 2026-09 expense:
  // Food: 1,500,000 + 500,000 = 2,000,000 (80%)
  // Utilities: 300,000 (12%)
  // Transport: 200,000 (8%)
  // Total = 2,500,000

  const categories = calculateCategoryExpenses(transactions, '2026-09', '2026-08');
  assert.equal(categories.length, 3);

  // Sorted descending
  assert.equal(categories[0].category.toLowerCase(), 'food');
  assert.equal(categories[0].amount, 2000000);
  assert.equal(categories[0].percentage, 80);
  assert.equal(categories[0].previousMonthAmount, 1000000);
  assert.equal(categories[0].monthOverMonthChange, 1000000); // increased by 1,000,000
  assert.equal(categories[0].monthOverMonthPercent, 100); // +100%

  assert.equal(categories[1].category, 'Utilities');
  assert.equal(categories[1].amount, 300000);
  assert.equal(categories[1].percentage, 12);
  assert.equal(categories[1].monthOverMonthChange, -100000); // reduced by 100,000
  assert.equal(categories[1].monthOverMonthPercent, -25); // -25%

  assert.equal(categories[2].category, 'Transport');
  assert.equal(categories[2].amount, 200000);
  assert.equal(categories[2].previousMonthAmount, undefined); // new category
});

test('calculateCashflowAnalytics - aggregates 6-month window accurately', () => {
  const transactions = [
    { id: '1', title: 'Income Jul', amount: 5000000, type: 'income', category: 'Job', date: '2026-07-01' },
    { id: '2', title: 'Expense Jul', amount: 2000000, type: 'expense', category: 'Living', date: '2026-07-10' },

    { id: '3', title: 'Income Aug', amount: 5000000, type: 'income', category: 'Job', date: '2026-08-01' },
    { id: '4', title: 'Expense Aug', amount: 4000000, type: 'expense', category: 'Living', date: '2026-08-10' },

    { id: '5', title: 'Income Sep', amount: 6000000, type: 'income', category: 'Job', date: '2026-09-01' },
    { id: '6', title: 'Expense Sep', amount: 1000000, type: 'expense', category: 'Living', date: '2026-09-10' },
  ];

  const analytics = calculateCashflowAnalytics(transactions, '2026-09', 6);
  assert.equal(analytics.months.length, 6);
  assert.equal(analytics.totalInflow, 16000000);
  assert.equal(analytics.totalOutflow, 7000000);
  assert.equal(analytics.netCashflow, 9000000);

  // Best month is Sep (net = 5,000,000)
  assert.equal(analytics.bestMonth?.month, '2026-09');
  assert.equal(analytics.bestMonth?.net, 5000000);

  // Lowest active month is Aug (net = 1,000,000)
  assert.equal(analytics.lowestMonth?.month, '2026-08');
  assert.equal(analytics.lowestMonth?.net, 1000000);
});

test('createBackupPayload & validateBackupPayload - structure and validation integrity', () => {
  const accounts = [
    { id: 'acc-1', name: 'BCA', type: 'bank', openingBalance: 5000000, currency: 'IDR', createdAt: '2026-01-01' },
  ];
  const transactions = [
    { id: 'tx-1', title: 'Salary', amount: 10000000, type: 'income', category: 'Job', date: '2026-09-01', accountId: 'acc-1' },
  ];
  const portfolio = [
    { id: 'asset-1', name: 'BBCA', value: 15000000 },
  ];
  const budgets = [
    { id: 'b-1', category: 'Food', limit: 2000000, month: '2026-09', createdAt: '2026-09-01' },
  ];

  const payload = createBackupPayload(accounts, transactions, portfolio, budgets);
  assert.equal(payload.version, 1);
  assert.equal(payload.source, 'finance-dashboard');
  assert.equal(typeof payload.exportedAt, 'string');

  // Valid validation
  const validRes = validateBackupPayload(payload);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.summary?.accountsCount, 1);
  assert.equal(validRes.summary?.transactionsCount, 1);
  assert.equal(validRes.summary?.portfolioCount, 1);
  assert.equal(validRes.summary?.budgetsCount, 1);

  // Invalid payload: non-object
  assert.equal(validateBackupPayload(null).valid, false);
  assert.equal(validateBackupPayload('string').valid, false);

  // Invalid payload: wrong source
  assert.equal(validateBackupPayload({ ...payload, source: 'unauthorized-app' }).valid, false);

  // Invalid payload: missing arrays
  assert.equal(validateBackupPayload({ version: 1, source: 'finance-dashboard' }).valid, false);

  // Partial corrupt item filtering: invalid items should be excluded from summary
  const mixedPayload = {
    ...payload,
    accounts: [...accounts, { id: 'corrupt-acc', name: '', openingBalance: NaN }], // invalid account
    portfolio: [...portfolio, { id: 'corrupt-asset', name: 'Bad', value: -100 }], // invalid asset value
  };
  const mixedRes = validateBackupPayload(mixedPayload);
  assert.equal(mixedRes.valid, true);
  assert.equal(mixedRes.summary?.accountsCount, 1); // 1 valid account kept
  assert.equal(mixedRes.summary?.portfolioCount, 1); // 1 valid asset kept
});

test('mergeBackupData - combines existing and incoming records without loss', () => {
  const current = {
    version: 1,
    exportedAt: '2026-09-01T00:00:00.000Z',
    source: 'finance-dashboard',
    accounts: [
      { id: 'acc-1', name: 'Original Bank', type: 'bank', openingBalance: 1000, currency: 'IDR', createdAt: '2026-01-01' },
      { id: 'acc-2', name: 'Keep Account', type: 'cash', openingBalance: 500, currency: 'IDR', createdAt: '2026-01-01' },
    ],
    transactions: [
      { id: 't1', title: 'Lunch', amount: 50000, type: 'expense', category: 'Food', date: '2026-09-01' },
    ],
    portfolio: [
      { id: 'p1', name: 'BBCA', value: 1000000 },
    ],
    budgets: [
      { id: 'b1', category: 'Food', limit: 500000, month: '2026-09', createdAt: '2026-09-01' },
    ],
  };

  const incoming = {
    version: 1,
    exportedAt: '2026-09-02T00:00:00.000Z',
    source: 'finance-dashboard',
    accounts: [
      // Overwrite acc-1
      { id: 'acc-1', name: 'Updated Bank', type: 'bank', openingBalance: 2000, currency: 'IDR', createdAt: '2026-01-01' },
      // New account acc-3
      { id: 'acc-3', name: 'New E-Wallet', type: 'ewallet', openingBalance: 300, currency: 'IDR', createdAt: '2026-01-01' },
    ],
    transactions: [
      // New transaction
      { id: 't2', title: 'Dinner', amount: 100000, type: 'expense', category: 'Food', date: '2026-09-02' },
    ],
    portfolio: [
      // New asset
      { id: 'p2', name: 'TLKM', value: 2000000 },
    ],
    budgets: [
      // New budget
      { id: 'b2', category: 'Transport', limit: 300000, month: '2026-09', createdAt: '2026-09-01' },
    ],
  };

  const merged = mergeBackupData(current, incoming);
  assert.equal(merged.accounts.length, 3);
  assert.equal(merged.accounts.find(a => a.id === 'acc-1').name, 'Updated Bank'); // updated
  assert.equal(merged.accounts.find(a => a.id === 'acc-2').name, 'Keep Account'); // retained
  assert.equal(merged.accounts.find(a => a.id === 'acc-3').name, 'New E-Wallet'); // added

  assert.equal(merged.transactions.length, 2);
  assert.equal(merged.portfolio.length, 2);
  assert.equal(merged.budgets.length, 2);
});

test('CSV serialization and domain exporters - escaping and header formatting', () => {
  // Test value escaping
  assert.equal(escapeCSVValue('Simple'), 'Simple');
  assert.equal(escapeCSVValue('Value, with comma'), '"Value, with comma"');
  assert.equal(escapeCSVValue('Value "quoted"'), '"Value ""quoted"""');
  assert.equal(escapeCSVValue('Multi\nLine'), '"Multi\nLine"');
  assert.equal(escapeCSVValue(12345), '12345');
  assert.equal(escapeCSVValue(null), '');

  // Test transactions CSV exporter
  const accounts = [
    { id: 'acc-1', name: 'Main Bank', type: 'bank', openingBalance: 0, currency: 'IDR', createdAt: '2026-01-01' },
  ];
  const transactions = [
    { id: 't1', title: 'Grocery, Market', amount: 250000, type: 'expense', category: 'Food', date: '2026-09-01', accountId: 'acc-1' },
    { id: 't2', title: 'Unlinked Tx', amount: 50000, type: 'expense', category: 'Misc', date: '2026-09-02' },
  ];

  const csv = exportTransactionsToCSV(transactions, accounts);
  assert.equal(csv.includes('Transaction ID,Title,Type,Category,Amount,Date,Account'), true);
  assert.equal(csv.includes('"Grocery, Market"'), true); // escaped
  assert.equal(csv.includes('Main Bank'), true); // linked account name
  assert.equal(csv.includes('Unlinked'), true); // fallback

  // Test Accounts CSV
  const accCsv = exportAccountsToCSV(accounts);
  assert.equal(accCsv.includes('Account ID,Account Name,Type,Opening Balance,Currency,Created At'), true);
  assert.equal(accCsv.includes('Main Bank'), true);

  // Test Portfolio CSV
  const portCsv = exportPortfolioToCSV([
    { id: 'p1', name: 'BBCA, PT', value: 5000000, symbol: 'BBCA' },
  ]);
  assert.equal(portCsv.includes('Asset ID,Asset Name,Value'), true);
  assert.equal(portCsv.includes('"BBCA, PT"'), true);

  // Test Budgets CSV
  const bgtCsv = exportBudgetsToCSV([
    { id: 'b1', category: 'Dining & Drinks', limit: 1500000, month: '2026-09', createdAt: '2026-09-01' },
  ]);
  assert.equal(bgtCsv.includes('Budget ID,Category,Monthly Limit,Month,Created At'), true);
  assert.equal(bgtCsv.includes('Dining & Drinks'), true);
});

test('loadCachedMarketAssets & saveCachedMarketAssets - storage resilience and fallback', () => {
  const originalLocalStorage = globalThis.localStorage;
  const mockStorage = new Map();

  globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) ?? null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  };

  const defaultAssets = [
    { id: 'bbca', symbol: 'BBCA', name: 'BCA', type: 'stock', price: 6200, changePercent: 0, currency: 'IDR' },
  ];

  try {
    // 1. Initial empty storage returns fallback
    const res1 = loadCachedMarketAssets(defaultAssets);
    assert.deepEqual(res1.assets, defaultAssets);
    assert.equal(res1.lastSync, null);

    // 2. Save valid assets and last sync
    const liveAssets = [
      { id: 'bbca', symbol: 'BBCA', name: 'BCA', type: 'stock', price: 6250, changePercent: 0.81, currency: 'IDR', isLive: true },
    ];
    saveCachedMarketAssets(liveAssets, '25 Sep, 13:45');

    const res2 = loadCachedMarketAssets(defaultAssets);
    assert.equal(res2.assets.length, 1);
    assert.equal(res2.assets[0].price, 6250);
    assert.equal(res2.assets[0].isLive, true);
    assert.equal(res2.lastSync, '25 Sep, 13:45');

    // 3. Corrupt JSON in localStorage falls back safely
    mockStorage.set('finance-dashboard-market-cache-v1', '{corrupt json');
    const res3 = loadCachedMarketAssets(defaultAssets);
    assert.deepEqual(res3.assets, defaultAssets);
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test('syncLiveMarketAssets - gracefully updates assets without throwing on network errors', async () => {
  const testAssets = [
    { id: 'btc', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 80000, changePercent: 0, currency: 'USD' },
    { id: 'bbca', symbol: 'BBCA', name: 'BCA', type: 'stock', price: 6000, changePercent: 0, currency: 'IDR' },
  ];

  const result = await syncLiveMarketAssets(testAssets);
  assert.equal(Array.isArray(result.assets), true);
  assert.equal(result.assets.length, 2);
  assert.equal(typeof result.updatedCount, 'number');
  assert.equal(typeof result.failedCount, 'number');
  assert.equal(typeof result.syncTimestamp, 'string');
});





