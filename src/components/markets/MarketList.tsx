import React from 'react';
import type { MarketAsset } from '../../data/markets';
import { MarketLiveChart } from './MarketLiveChart';

export interface MarketListProps {
  assets: MarketAsset[];
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  lastSyncTime?: string | null;
}

type MarketFilter = 'all' | MarketAsset['type'];
type MarketSort =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'change-asc'
  | 'change-desc';

type MarketView = 'all' | 'favorites';

const FAVORITES_STORAGE_KEY = 'finance-dashboard-market-favorites-v1';

const formatPrice = (asset: MarketAsset) => {
  if (asset.currency === 'IDR') {
    return `Rp ${asset.price.toLocaleString('id-ID')}`;
  }

  return `${asset.currency} ${asset.price.toLocaleString('en-US', {
    maximumFractionDigits: 4,
  })}`;
};

const typeLabel: Record<MarketAsset['type'], string> = {
  stock: 'Stock (IHSG)',
  crypto: 'Crypto',
  forex: 'Forex',
};

const typeDescription: Record<MarketAsset['type'], string> = {
  stock: 'Indonesian Stock Exchange (IDX) Equity Asset',
  crypto: 'Cryptocurrency Asset (Real-time Binance Ticker)',
  forex: 'Foreign Exchange Rate (ExchangeRate-API)',
};

const MarketDetail: React.FC<{
  asset: MarketAsset;
  onBack: () => void;
}> = ({ asset, onBack }) => {
  const isPositive = asset.changePercent >= 0;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
      >
        <span aria-hidden="true">←</span>
        Back to markets
      </button>

      <div className="rounded-xl border border-border bg-surface/50 p-4 sm:p-5">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary">
                  {asset.symbol}
                </h2>

                <span className="rounded-md bg-background px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                  {typeLabel[asset.type]}
                </span>

                <span
                  className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    asset.isLive
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-border bg-surface text-text-muted'
                  }`}
                >
                  {asset.isLive ? '🟢 Live Data' : 'Snapshot'}
                </span>

                {asset.lastUpdated && (
                  <span className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-medium text-text-muted">
                    Updated: {asset.lastUpdated}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-text-muted">
                {asset.name}
              </p>
            </div>

            <div
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                isPositive
                  ? 'bg-positive/10 text-positive'
                  : 'bg-negative/10 text-negative'
              }`}
            >
              {isPositive ? 'Positive' : 'Negative'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-text-muted">Price</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">
                {formatPrice(asset)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-text-muted">Daily Change</p>
              <p
                className={`mt-1 text-lg font-bold tabular-nums ${
                  isPositive ? 'text-positive' : 'text-negative'
                }`}
              >
                {isPositive ? '+' : ''}
                {asset.changePercent.toFixed(2)}%
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 sm:col-span-2">
              <p className="text-xs text-text-muted">Data Provider / Asset Type</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {typeDescription[asset.type]}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <MarketLiveChart asset={asset} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MarketList: React.FC<MarketListProps> = ({
  assets,
  onRefresh,
  isRefreshing = false,
  lastSyncTime = null,
}) => {
  const [filter, setFilter] = React.useState<MarketFilter>('all');
  const [sort, setSort] = React.useState<MarketSort>('default');
  const [view, setView] = React.useState<MarketView>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedAsset, setSelectedAsset] =
    React.useState<MarketAsset | null>(null);

  const [selectedChartAssetId, setSelectedChartAssetId] = React.useState<string>(
    () => assets[0]?.id || ''
  );

  const activeChartAsset =
    assets.find((a) => a.id === selectedChartAssetId) || assets[0];

  const [favoriteIds, setFavoriteIds] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(
        FAVORITES_STORAGE_KEY
      );

      if (!stored) {
        return [];
      }

      const parsed: unknown = JSON.parse(stored);

      return Array.isArray(parsed)
        ? parsed.filter(
            (item): item is string =>
              typeof item === 'string'
          )
        : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteIds)
      );
    } catch {
      // Keep the watchlist usable if localStorage is unavailable.
    }
  }, [favoriteIds]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const searchedAssets =
    normalizedSearchQuery === ''
      ? assets
      : assets.filter((asset) =>
          [
            asset.symbol,
            asset.name,
            asset.type,
          ].some((value) =>
            value.toLowerCase().includes(normalizedSearchQuery)
          )
        );

  const viewedAssets =
    view === 'favorites'
      ? searchedAssets.filter((asset) =>
          favoriteIds.includes(asset.id)
        )
      : searchedAssets;

  const filteredAssets =
    filter === 'all'
      ? viewedAssets
      : viewedAssets.filter((asset) => asset.type === filter);

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'change-asc':
        return a.changePercent - b.changePercent;
      case 'change-desc':
        return b.changePercent - a.changePercent;
      case 'default':
      default:
        return 0;
    }
  });

  const filters: Array<{ value: MarketFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'stock', label: 'Stocks (IHSG)' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'forex', label: 'Forex' },
  ];

  const views: Array<{ value: MarketView; label: string }> = [
    { value: 'all', label: 'All Assets' },
    { value: 'favorites', label: 'Favorites' },
  ];

  const sorts: Array<{ value: MarketSort; label: string }> = [
    { value: 'default', label: 'Default' },
    { value: 'price-asc', label: 'Price ↑' },
    { value: 'price-desc', label: 'Price ↓' },
    { value: 'change-asc', label: 'Change ↑' },
    { value: 'change-desc', label: 'Change ↓' },
  ];

  if (assets.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        No market data available.
      </div>
    );
  }

  if (selectedAsset) {
    return (
      <MarketDetail
        asset={selectedAsset}
        onBack={() => setSelectedAsset(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Data Sync Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface/40 p-3 sm:px-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>

          <span className="text-text-muted">
            {lastSyncTime ? (
              <>
                <strong className="text-text-primary">Data Live Terhubung</strong> · Terakhir diperbarui: {lastSyncTime}
              </>
            ) : (
              'Live Market Provider (ExchangeRate-API, Binance & Yahoo Finance IDX)'
            )}
          </span>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={() => onRefresh()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isRefreshing ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Memperbarui...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">↻</span>
                <span>Perbarui Data Live</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Interactive Live Running Chart */}
      {activeChartAsset && (
        <MarketLiveChart
          asset={activeChartAsset}
          allAssets={assets}
          onSelectAsset={(selected) => setSelectedChartAssetId(selected.id)}
        />
      )}

      <div className="relative">
        <label
          htmlFor="market-search"
          className="sr-only"
        >
          Search markets
        </label>

        <input
          id="market-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search symbol, asset name, or type..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Market views"
        >
          {views.map((item) => {
            const isActive = view === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setView(item.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-muted hover:text-text-primary'
                }`}
                aria-pressed={isActive}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Market filters"
          >
            {filters.map((item) => {
              const isActive = filter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text-muted hover:text-text-primary'
                  }`}
                  aria-pressed={isActive}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-xs text-text-muted">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as MarketSort)
              }
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {sorts.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {sortedAssets.length === 0 ? (
        <div className="py-6 text-center text-sm text-text-muted">
          {view === 'favorites'
            ? 'No favorite markets match your current search/filter.'
            : normalizedSearchQuery
              ? 'No markets match your search.'
              : 'No assets found for this filter.'}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedAssets.map((asset) => {
            const isPositive = asset.changePercent >= 0;
            const isFavorite = favoriteIds.includes(asset.id);

            const toggleFavorite = () => {
              setFavoriteIds((current) =>
                current.includes(asset.id)
                  ? current.filter((id) => id !== asset.id)
                  : [...current, asset.id]
              );
            };

            return (
              <div
                key={asset.id}
                className="flex items-center gap-2 border-b border-border pb-3 pt-1 last:border-0"
              >
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className="shrink-0 rounded-lg px-2 py-2 text-lg transition-colors hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-pressed={isFavorite}
                  aria-label={
                    isFavorite
                      ? `Remove ${asset.symbol} from favorites`
                      : `Add ${asset.symbol} to favorites`
                  }
                >
                  {isFavorite ? '★' : '☆'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChartAssetId(asset.id);
                    setSelectedAsset(asset);
                  }}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left transition-colors hover:bg-surface/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label={`View details for ${asset.symbol}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {asset.symbol}
                      </p>

                      <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                        {typeLabel[asset.type]}
                      </span>

                      {asset.isLive && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Live
                        </span>
                      )}
                    </div>

                    <p className="truncate text-xs text-text-muted">
                      {asset.name}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatPrice(asset)}
                    </p>

                    <p
                      className={`text-xs font-medium tabular-nums ${
                        isPositive
                          ? 'text-positive'
                          : 'text-negative'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {asset.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChartAssetId(asset.id)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedChartAssetId === asset.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary border border-border/80'
                  }`}
                  aria-label={`Plot ${asset.symbol} on chart`}
                  title={`Plot ${asset.symbol} on chart`}
                >
                  📈 Chart
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
