import type { MarketAsset } from '../data/markets';

export const MARKET_STORAGE_KEY = 'finance-dashboard-market-cache-v1';
export const MARKET_LAST_SYNC_KEY = 'finance-dashboard-market-last-sync-v1';

export interface MarketSyncResult {
  assets: MarketAsset[];
  updatedCount: number;
  failedCount: number;
  syncTimestamp: string;
}

const DEFAULT_TIMEOUT_MS = 6000;

const createTimeoutSignal = (ms: number = DEFAULT_TIMEOUT_MS) => {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

/**
 * Fetch live Forex rates from ExchangeRate-API (open, CORS-enabled, no key needed)
 */
export const fetchLiveForex = async (): Promise<Record<string, { price: number; changePercent?: number }>> => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: createTimeoutSignal(),
    });

    if (!res.ok) {
      throw new Error(`Forex API responded with status ${res.status}`);
    }

    const data = await res.json();
    const rates = data.rates as Record<string, number> | undefined;

    if (!rates) {
      return {};
    }

    const idrRate = rates['IDR'] ?? 17835;
    const eurRate = rates['EUR'] ?? 0.877;

    return {
      usdidr: {
        price: Math.round(idrRate),
      },
      eurusd: {
        price: Number((1 / eurRate).toFixed(4)),
      },
      euridr: {
        price: Math.round(idrRate / eurRate),
      },
    };
  } catch (error) {
    console.warn('[MarketLive] Failed to fetch Forex rates:', error);
    return {};
  }
};

/**
 * Fetch live Crypto rates from Binance Public API (CORS-friendly, free, real-time)
 */
export const fetchLiveCrypto = async (): Promise<Record<string, { price: number; changePercent: number }>> => {
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22%5D',
      {
        signal: createTimeoutSignal(),
      }
    );

    if (!res.ok) {
      throw new Error(`Crypto API status ${res.status}`);
    }

    const tickers = (await res.json()) as Array<{
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
    }>;

    const result: Record<string, { price: number; changePercent: number }> = {};

    for (const ticker of tickers) {
      if (ticker.symbol === 'BTCUSDT') {
        result['btc'] = {
          price: Math.round(parseFloat(ticker.lastPrice)),
          changePercent: Number(parseFloat(ticker.priceChangePercent).toFixed(2)),
        };
      } else if (ticker.symbol === 'ETHUSDT') {
        result['eth'] = {
          price: Number(parseFloat(ticker.lastPrice).toFixed(1)),
          changePercent: Number(parseFloat(ticker.priceChangePercent).toFixed(2)),
        };
      }
    }

    return result;
  } catch (error) {
    console.warn('[MarketLive] Failed to fetch Crypto rates:', error);
    return {};
  }
};

/**
 * Fetch Indonesian stock quote via Vite reverse proxy or direct fallback
 */
export const fetchLiveIdxStock = async (
  symbol: string
): Promise<{ price: number; changePercent: number } | null> => {
  const stockSymbol = symbol.toUpperCase().endsWith('.JK')
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}.JK`;

  const isBrowser = typeof window !== 'undefined';
  const targetUrl = isBrowser
    ? `/api/yahoo/v8/finance/chart/${stockSymbol}?interval=1d&range=1d`
    : `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}?interval=1d&range=1d`;

  try {
    const res = await fetch(targetUrl, {
      signal: createTimeoutSignal(),
      headers: isBrowser
        ? undefined
        : {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
    });

    if (!res.ok) {
      throw new Error(`Stock API returned ${res.status}`);
    }

    const data = await res.json();
    const resultObj = data?.chart?.result?.[0];
    const meta = resultObj?.meta;

    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      throw new Error('Invalid stock meta response');
    }

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || price;
    const changePercent =
      prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

    return {
      price,
      changePercent: Number(changePercent.toFixed(2)),
    };
  } catch (err) {
    // If running in pure static/preview without Vite proxy, report warning
    console.warn(`[MarketLive] Stock quote for ${symbol} unavailable:`, err);
    return null;
  }
};

/**
 * Synchronize all market assets with live external data providers
 */
export const syncLiveMarketAssets = async (
  currentAssets: MarketAsset[]
): Promise<MarketSyncResult> => {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { day: '2-digit', month: 'short' });
  const formattedSyncTime = `${dateString}, ${timeString}`;

  // 1. Fetch Forex and Crypto concurrently
  const [forexRates, cryptoRates] = await Promise.all([
    fetchLiveForex(),
    fetchLiveCrypto(),
  ]);

  // 2. Fetch Indonesian stocks concurrently
  const stockAssets = currentAssets.filter((a) => a.type === 'stock');
  const stockPromises = stockAssets.map(async (asset) => {
    const quote = await fetchLiveIdxStock(asset.symbol);
    return { id: asset.id, quote };
  });

  const stockResults = await Promise.allSettled(stockPromises);
  const stockQuotes: Record<string, { price: number; changePercent: number }> = {};

  for (const res of stockResults) {
    if (res.status === 'fulfilled' && res.value.quote) {
      stockQuotes[res.value.id] = res.value.quote;
    }
  }

  // 3. Map over currentAssets and update with latest live values
  let updatedCount = 0;
  let failedCount = 0;

  const updatedAssets = currentAssets.map((asset) => {
    const assetId = asset.id.toLowerCase();

    // Check Crypto
    if (asset.type === 'crypto' && cryptoRates[assetId]) {
      updatedCount++;
      return {
        ...asset,
        price: cryptoRates[assetId].price,
        changePercent: cryptoRates[assetId].changePercent,
        lastUpdated: formattedSyncTime,
        isLive: true,
      };
    }

    // Check Forex
    if (asset.type === 'forex' && forexRates[assetId]) {
      updatedCount++;
      return {
        ...asset,
        price: forexRates[assetId].price,
        lastUpdated: formattedSyncTime,
        isLive: true,
      };
    }

    // Check Stock
    if (asset.type === 'stock' && stockQuotes[asset.id]) {
      updatedCount++;
      return {
        ...asset,
        price: stockQuotes[asset.id].price,
        changePercent: stockQuotes[asset.id].changePercent,
        lastUpdated: formattedSyncTime,
        isLive: true,
      };
    }

    // Unchanged / Offline snapshot
    failedCount++;
    return {
      ...asset,
      // Retain existing isLive or keep false
      isLive: asset.isLive ?? false,
    };
  });

  return {
    assets: updatedAssets,
    updatedCount,
    failedCount,
    syncTimestamp: formattedSyncTime,
  };
};

/**
 * Persistence helpers for Market assets
 */
export const loadCachedMarketAssets = (
  fallbackAssets: MarketAsset[]
): { assets: MarketAsset[]; lastSync: string | null } => {
  try {
    const raw = localStorage.getItem(MARKET_STORAGE_KEY);
    const lastSync = localStorage.getItem(MARKET_LAST_SYNC_KEY);

    if (!raw) {
      return { assets: fallbackAssets, lastSync: null };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { assets: fallbackAssets, lastSync: null };
    }

    const validAssets = parsed.filter(
      (item): item is MarketAsset =>
        typeof item?.id === 'string' &&
        typeof item?.symbol === 'string' &&
        typeof item?.price === 'number' &&
        Number.isFinite(item.price)
    );

    return {
      assets: validAssets.length > 0 ? validAssets : fallbackAssets,
      lastSync,
    };
  } catch {
    return { assets: fallbackAssets, lastSync: null };
  }
};

export const saveCachedMarketAssets = (
  assets: MarketAsset[],
  lastSync?: string
): void => {
  try {
    localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(assets));
    if (lastSync) {
      localStorage.setItem(MARKET_LAST_SYNC_KEY, lastSync);
    }
  } catch {
    // Keep app functional if localStorage is disabled
  }
};
