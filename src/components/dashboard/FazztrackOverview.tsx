import React, { useState } from 'react';
import type { Transaction, Account, PortfolioAsset } from '../../types/finance';
import { calculateTotalCashBalance } from '../../utils/accounts';
import { getPortfolioValue, calculatePortfolioAllocation } from '../../utils/portfolio';
import { calculateCashflowAnalytics } from '../../utils/cashflow';
import { formatRupiah } from '../../utils/currency';

export interface OverviewDashboardProps {
  transactions?: Transaction[];
  accounts?: Account[];
  portfolioAssets?: PortfolioAsset[];
  onOpenTransactionModal?: () => void;
  onLoadDemoData?: () => void;
}

export const FazztrackOverview: React.FC<OverviewDashboardProps> = ({
  transactions = [],
  accounts = [],
  portfolioAssets = [],
  onOpenTransactionModal,
  onLoadDemoData,
}) => {
  const [cashflowTab, setCashflowTab] = useState<'Income' | 'Expense' | 'Savings'>('Income');
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');

  // Real data calculations (Clean slate without fake fallback numbers)
  const totalCash = calculateTotalCashBalance(accounts, transactions);
  const totalPortfolio = portfolioAssets.reduce((sum, asset) => sum + getPortfolioValue(asset), 0);
  const totalNetWorth = totalCash + totalPortfolio;

  // Month calculation
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonthStr));
  const activeTxList = currentMonthTx.length > 0 ? currentMonthTx : transactions;

  const currentIncome = activeTxList
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const currentExpense = activeTxList
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const currentSavings = Math.max(0, currentIncome - currentExpense);
  const isCleanSlate = accounts.length === 0 && transactions.length === 0 && portfolioAssets.length === 0;

  // Cashflow analytics for dynamic trend curve
  const analytics = calculateCashflowAnalytics(transactions, currentMonthStr, 12);
  const monthlyData = analytics.months;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(
    monthlyData.length > 0 ? monthlyData.length - 1 : null
  );

  // Extract series based on active tab
  const getTabValues = () => {
    if (monthlyData.length === 0) {
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    if (cashflowTab === 'Income') {
      return monthlyData.map((m) => m.inflow);
    }
    if (cashflowTab === 'Expense') {
      return monthlyData.map((m) => m.outflow);
    }
    return monthlyData.map((m) => Math.max(0, m.net));
  };

  const rawValues = getTabValues();
  const hasCashflowData = rawValues.some((v) => v > 0);
  const maxValue = Math.max(...rawValues, 1000000);

  // Normalize to SVG height (0 to 180)
  const normalizedPoints = rawValues.map((val) => {
    const ratio = val / maxValue;
    return Math.round(180 - ratio * 130);
  });

  // Calculate dynamic asset allocations
  const portfolioAlloc = calculatePortfolioAllocation(portfolioAssets);
  const cashAmount = Math.max(0, totalCash);
  const totalAssetsSum = cashAmount + totalPortfolio;

  const cashPct = totalAssetsSum > 0 ? Math.round((cashAmount / totalAssetsSum) * 100) : 0;
  const stockAsset = portfolioAlloc.items.find((item) => item.asset.assetType === 'stock');
  const cryptoAsset = portfolioAlloc.items.find((item) => item.asset.assetType === 'crypto');

  const stockPct = totalAssetsSum > 0 && stockAsset && stockAsset.value > 0
    ? Math.round((stockAsset.value / totalAssetsSum) * 100)
    : 0;
  const remainingPct = totalAssetsSum > 0 ? Math.max(0, 100 - cashPct - stockPct) : 0;

  // Recent transactions to display
  const displayTransactions = transactions.slice(0, 6);

  // Hover point value
  const activeHoverItem = hoveredIndex !== null && monthlyData[hoveredIndex]
    ? monthlyData[hoveredIndex]
    : null;

  const hoverAmount = activeHoverItem
    ? cashflowTab === 'Income'
      ? (activeHoverItem.inflow || rawValues[hoveredIndex ?? 0])
      : cashflowTab === 'Expense'
      ? (activeHoverItem.outflow || rawValues[hoveredIndex ?? 0])
      : (activeHoverItem.net || rawValues[hoveredIndex ?? 0])
    : (rawValues[hoveredIndex ?? 0] || 0);

  const hoverLabel = activeHoverItem && activeHoverItem.monthLabel
    ? activeHoverItem.monthLabel
    : 'Bulan Berjalan';

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Slate Welcome / Demo Prompt Banner */}
      {isCleanSlate && (
        <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-extrabold text-indigo-950 dark:text-indigo-200 text-sm">Dashboard Siap Digunakan (Mulai dari Nol / Rp 0)</p>
              <p className="text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                Saat ini belum ada data rekening atau mutasi yang tercatat. Anda bisa mencatat data keuangan asli Anda, atau memuat data simulasi untuk melihat pratinjau grafik.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onLoadDemoData && (
              <button
                type="button"
                onClick={onLoadDemoData}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition cursor-pointer"
              >
                📥 Muat Data Demo
              </button>
            )}
            <button
              type="button"
              onClick={onOpenTransactionModal}
              className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              + Catat Transaksi Baru
            </button>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo / Aset */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-indigo-200 dark:hover:border-indigo-800 transition">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Saldo / Aset</p>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              {formatRupiah(totalNetWorth)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {totalNetWorth > 0 ? (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400">▲ Aktif</span>
                  <span className="font-normal text-slate-400 dark:text-slate-500">tercatat di ledger</span>
                </>
              ) : (
                <span className="font-normal text-slate-400 dark:text-slate-500">Belum ada saldo terdaftar</span>
              )}
            </div>
          </div>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-emerald-200 dark:hover:border-emerald-800 transition">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Pemasukan
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pemasukan Bulan Ini</p>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              {formatRupiah(currentIncome)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {currentIncome > 0 ? (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400">▲ Stabil</span>
                  <span className="font-normal text-slate-400 dark:text-slate-500">tercatat di ledger</span>
                </>
              ) : (
                <span className="font-normal text-slate-400 dark:text-slate-500">Belum ada pemasukan</span>
              )}
            </div>
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-rose-200 dark:hover:border-rose-800 transition">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
              Pengeluaran
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pengeluaran Bulan Ini</p>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              {formatRupiah(currentExpense)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {currentExpense > 0 ? (
                <>
                  <span className="text-rose-500 dark:text-rose-400">▼ Terkontrol</span>
                  <span className="font-normal text-slate-400 dark:text-slate-500">tercatat di ledger</span>
                </>
              ) : (
                <span className="font-normal text-slate-400 dark:text-slate-500">Belum ada pengeluaran</span>
              )}
            </div>
          </div>
        </div>

        {/* Estimasi Tabungan */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-amber-200 dark:hover:border-amber-800 transition">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
              Tabungan
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Estimasi Tabungan</p>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              {formatRupiah(currentSavings)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {currentSavings > 0 ? (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400">▲ Surplus</span>
                  <span className="font-normal text-slate-400 dark:text-slate-500">akumulasi bersih</span>
                </>
              ) : (
                <span className="font-normal text-slate-400 dark:text-slate-500">Rp 0 akumulasi</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Cashflow & Asset allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart (2/3 width) */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Arus Kas (Cashflow)</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Tren historis pergerakan dana Anda</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Category tabs */}
              <div className="flex rounded-xl bg-slate-50 dark:bg-slate-800 p-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {(['Income', 'Expense', 'Savings'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCashflowTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      cashflowTab === tab
                        ? 'bg-white dark:bg-slate-900 font-bold text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab === 'Income' ? 'Pemasukan' : tab === 'Expense' ? 'Pengeluaran' : 'Tabungan'}
                  </button>
                ))}
              </div>

              {/* Timeframe */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as 'monthly' | 'yearly')}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-600 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
          </div>

          {/* Interactive Line Chart Canvas / Empty State */}
          {hasCashflowData ? (
            <div className="relative mt-2 h-64 w-full">
              {/* Hover Tooltip Box */}
              {hoveredIndex !== null && (
                <div
                  className="absolute z-10 -top-3 transform -translate-x-1/2 pointer-events-none transition-all duration-150"
                  style={{
                    left: `${((hoveredIndex || 0) / Math.max(1, (monthlyData.length || 12) - 1)) * 88 + 6}%`,
                  }}
                >
                  <div className="rounded-xl bg-slate-900 dark:bg-slate-800 text-white p-2.5 shadow-xl border border-slate-700 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                      <span>{formatRupiah(hoverAmount)}</span>
                      <span className="text-[10px] text-emerald-400">▲ Aktif</span>
                    </div>
                    <p className="text-[10px] text-slate-300 dark:text-slate-400 mt-0.5">{hoverLabel}</p>
                  </div>
                </div>
              )}

              {/* SVG Wave Line */}
              <svg
                className="w-full h-48 overflow-visible"
                viewBox="0 0 600 200"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area under curve */}
                <path
                  d={`M 0,${normalizedPoints[0] || 150} ${normalizedPoints
                    .map((p, idx) => `L ${(idx / Math.max(1, normalizedPoints.length - 1)) * 600},${p}`)
                    .join(' ')} L 600,200 L 0,200 Z`}
                  fill="url(#indigoGradient)"
                />

                {/* Smooth curve stroke */}
                <path
                  d={`M 0,${normalizedPoints[0] || 150} ${normalizedPoints
                    .map((p, idx) => `L ${(idx / Math.max(1, normalizedPoints.length - 1)) * 600},${p}`)
                    .join(' ')}`}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dotted indicator line for active hover */}
                {hoveredIndex !== null && (
                  <line
                    x1={(hoveredIndex / Math.max(1, normalizedPoints.length - 1)) * 600}
                    y1={normalizedPoints[hoveredIndex] || 100}
                    x2={(hoveredIndex / Math.max(1, normalizedPoints.length - 1)) * 600}
                    y2={200}
                    stroke="#818CF8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Hover Dot */}
                {hoveredIndex !== null && (
                  <circle
                    cx={(hoveredIndex / Math.max(1, normalizedPoints.length - 1)) * 600}
                    cy={normalizedPoints[hoveredIndex] || 100}
                    r="4.5"
                    fill="#4F46E5"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                )}
              </svg>

              {/* X-Axis Month Labels */}
              <div className="flex justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                {monthlyData.map((m, idx) => (
                  <span
                    key={m.month}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    className={`cursor-pointer transition ${
                      hoveredIndex === idx ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {m.monthLabel.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center mt-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Belum Ada Riwayat Arus Kas</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                Grafik tren arus kas akan otomatis terisi saat mutasi pemasukan atau pengeluaran dicatat.
              </p>
              <button
                type="button"
                onClick={onOpenTransactionModal}
                className="mt-3 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
              >
                + Catat Transaksi Baru
              </button>
            </div>
          )}
        </div>

        {/* Asset Allocations (1/3 width) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Alokasi Aset</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Distribusi portofolio dan kas</p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                Diversifikasi
              </span>
            </div>

            <div className="mt-2">
              <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {formatRupiah(totalNetWorth)}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {totalNetWorth > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">▲ 100% dialokasikan</span>
                ) : (
                  <span>Belum ada aset terdaftar</span>
                )}
              </div>
            </div>

            {totalAssetsSum > 0 ? (
              <>
                {/* Proportional Segmented Progress Bar */}
                <div className="mt-5 flex h-3.5 w-full overflow-hidden rounded-full gap-1 p-0.5 bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-l-full bg-indigo-400 transition-all duration-300"
                    style={{ width: `${Math.max(5, cashPct)}%` }}
                    title={`Kas: ${cashPct}%`}
                  />
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${Math.max(5, stockPct)}%` }}
                    title={`Saham/Investasi: ${stockPct}%`}
                  />
                  <div
                    className="h-full rounded-r-full bg-indigo-900 dark:bg-indigo-500 transition-all duration-300"
                    style={{ width: `${Math.max(5, remainingPct)}%` }}
                    title={`Lainnya / Kripto: ${remainingPct}%`}
                  />
                </div>

                {/* Dynamic Breakdown List */}
                <div className="mt-6 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-3.5 rounded-full bg-indigo-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Kas & Rekening Bank</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatRupiah(cashAmount)} ({cashPct}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-3.5 rounded-full bg-indigo-600" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Saham & Pasar Modal</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatRupiah(stockAsset ? stockAsset.value : 0)} ({stockPct}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-3.5 rounded-full bg-indigo-900 dark:bg-indigo-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Aset Lain / Kripto</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatRupiah(cryptoAsset ? cryptoAsset.value : 0)} ({remainingPct}%)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="h-3.5 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="py-7 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Belum Ada Aset Terdaftar</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Tambah akun rekening di menu Wallet atau beli aset di menu Investment.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onOpenTransactionModal}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              + Tambah Alokasi / Transaksi Baru
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Real Transactions / Mutasi Terkini */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Aktivitas & Tagihan Terkini</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Mutasi transaksi dalam mata uang Rupiah (IDR)</p>
          </div>
          <button
            type="button"
            onClick={onOpenTransactionModal}
            className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
          >
            + Catat Transaksi
          </button>
        </div>

        {/* Table of Real Transactions */}
        <div className="overflow-x-auto mt-2">
          {displayTransactions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Belum Ada Mutasi Transaksi</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                Seluruh mutasi keuangan Anda saat ini masih kosong (Rp 0). Klik tombol di bawah untuk mencatat transaksi baru.
              </p>
              <button
                type="button"
                onClick={onOpenTransactionModal}
                className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
              >
                + Catat Transaksi Baru
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold">
                  <th className="pb-3 pt-2 font-medium">Transaksi / Item ⇅</th>
                  <th className="pb-3 pt-2 font-medium">Kategori ⇅</th>
                  <th className="pb-3 pt-2 font-medium">Tipe ⇅</th>
                  <th className="pb-3 pt-2 font-medium">Nominal (IDR) ⇅</th>
                  <th className="pb-3 pt-2 font-medium">Tanggal ⇅</th>
                  <th className="pb-3 pt-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {displayTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                    {/* Title */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800'
                        }`}>
                          {tx.title[0]?.toUpperCase() || 'T'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{tx.title}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">{tx.category}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {tx.category}
                    </td>

                    {/* Type */}
                    <td className="py-3.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>

                    {/* Amount formatted in Rupiah */}
                    <td className={`py-3.5 font-bold ${
                      tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">
                      {tx.date}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 text-right">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                        Sukses
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
