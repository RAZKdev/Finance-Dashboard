import type { MarketAsset } from '../data/markets';

export interface ChartPoint {
  timestamp: number;
  timeLabel: string;
  price: number;
}

export type ChartTimeframe = 'LIVE' | '1D' | '1W' | '1M';

const getSymbolForApi = (asset: MarketAsset): string => {
  const sym = asset.symbol.toUpperCase();
  if (asset.type === 'stock') {
    return sym.endsWith('.JK') ? sym : `${sym}.JK`;
  }
  if (asset.type === 'crypto') {
    return `${sym}-USD`;
  }
  if (asset.type === 'forex') {
    if (sym === 'XAUUSD') return 'GC=F';
    return `${sym}=X`;
  }
  return sym;
};

const formatTimeLabel = (date: Date, timeframe: ChartTimeframe): string => {
  if (timeframe === 'LIVE' || timeframe === '1D') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  if (timeframe === '1W') {
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

/**
 * Generate fallback / initial realistic curve if external API is unreachable or offline
 */
export const generateRealisticHistory = (
  currentPrice: number,
  changePercent: number,
  count: number = 30,
  timeframe: ChartTimeframe = 'LIVE'
): ChartPoint[] => {
  const points: ChartPoint[] = [];
  const startPrice = currentPrice / (1 + changePercent / 100);
  const now = Date.now();
  const stepMs = timeframe === 'LIVE' ? 3000 : timeframe === '1D' ? 15 * 60 * 1000 : 3600 * 1000;

  let walkingPrice = startPrice;
  const priceDeltaTotal = currentPrice - startPrice;
  const driftPerStep = priceDeltaTotal / count;
  const volatility = currentPrice * 0.003; // 0.3% volatility

  for (let i = 0; i < count; i++) {
    const time = now - (count - 1 - i) * stepMs;
    const randomShock = (Math.random() - 0.48) * volatility;
    
    if (i === count - 1) {
      walkingPrice = currentPrice;
    } else {
      walkingPrice += driftPerStep + randomShock;
    }

    // Keep prices positive and reasonable
    walkingPrice = Math.max(walkingPrice, currentPrice * 0.5);

    points.push({
      timestamp: time,
      timeLabel: formatTimeLabel(new Date(time), timeframe),
      price: Number(walkingPrice.toFixed(currentPrice > 100 ? 0 : 4)),
    });
  }

  return points;
};

/**
 * Generate the next live tick for the running stream
 */
export const appendLiveTick = (
  prevPoints: ChartPoint[],
  currentPrice: number
): ChartPoint[] => {
  const maxPoints = 35;
  const lastPoint = prevPoints[prevPoints.length - 1];
  const lastPrice = lastPoint ? lastPoint.price : currentPrice;

  // Realistic micro tick movement around latest price (drift towards currentPrice)
  const drift = (currentPrice - lastPrice) * 0.25;
  const microJiggle = (Math.random() - 0.49) * (currentPrice * 0.0015);
  let newPrice = lastPrice + drift + microJiggle;

  if (currentPrice > 100) {
    newPrice = Math.round(newPrice);
  } else {
    newPrice = Number(newPrice.toFixed(4));
  }

  const now = new Date();
  const newPoint: ChartPoint = {
    timestamp: now.getTime(),
    timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: newPrice,
  };

  const updated = [...prevPoints, newPoint];
  if (updated.length > maxPoints) {
    return updated.slice(updated.length - maxPoints);
  }
  return updated;
};

/**
 * Fetch intraday/historical chart points from Yahoo Finance API with graceful fallback
 */
export const fetchChartPoints = async (
  asset: MarketAsset,
  timeframe: ChartTimeframe
): Promise<ChartPoint[]> => {
  const apiSymbol = getSymbolForApi(asset);

  let range = '1d';
  let interval = '15m';

  if (timeframe === 'LIVE') {
    range = '1d';
    interval = '5m';
  } else if (timeframe === '1D') {
    range = '1d';
    interval = '15m';
  } else if (timeframe === '1W') {
    range = '5d';
    interval = '60m';
  } else if (timeframe === '1M') {
    range = '1mo';
    interval = '1d';
  }

  const isBrowser = typeof window !== 'undefined';
  const targetUrl = isBrowser
    ? `/api/yahoo/v8/finance/chart/${apiSymbol}?interval=${interval}&range=${range}`
    : `https://query1.finance.yahoo.com/v8/finance/chart/${apiSymbol}?interval=${interval}&range=${range}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: isBrowser
        ? undefined
        : {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    const resultObj = data?.chart?.result?.[0];
    const timestamps: number[] = resultObj?.timestamp || [];
    const closes: (number | null)[] = resultObj?.indicators?.quote?.[0]?.close || [];

    if (timestamps.length === 0 || closes.length === 0) {
      return generateRealisticHistory(asset.price, asset.changePercent, 25, timeframe);
    }

    const points: ChartPoint[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const price = closes[i];
      const time = timestamps[i];

      if (typeof price === 'number' && Number.isFinite(price) && typeof time === 'number') {
        const date = new Date(time * 1000);
        points.push({
          timestamp: date.getTime(),
          timeLabel: formatTimeLabel(date, timeframe),
          price: Number(price.toFixed(asset.price > 100 ? 0 : 4)),
        });
      }
    }

    if (points.length < 5) {
      return generateRealisticHistory(asset.price, asset.changePercent, 25, timeframe);
    }

    return points;
  } catch (err) {
    console.warn(`[ChartData] Falling back to generated curve for ${asset.symbol}:`, err);
    return generateRealisticHistory(asset.price, asset.changePercent, 25, timeframe);
  }
};
