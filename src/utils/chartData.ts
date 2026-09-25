import type { MarketAsset } from '../data/markets';

export interface ChartPoint {
  timestamp: number;
  timeLabel: string;
  price: number;
}

export interface CandlePoint {
  timestamp: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type ChartTimeframe = 'LIVE' | '1D' | '1W' | '1M';
export type ChartType = 'candle' | 'line';

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
  const volatility = currentPrice * 0.003;

  for (let i = 0; i < count; i++) {
    const time = now - (count - 1 - i) * stepMs;
    const randomShock = (Math.random() - 0.48) * volatility;
    
    if (i === count - 1) {
      walkingPrice = currentPrice;
    } else {
      walkingPrice += driftPerStep + randomShock;
    }

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
 * Generate realistic candlestick history matching professional trading charts (Groww / TradingView)
 */
export const generateRealisticCandles = (
  currentPrice: number,
  changePercent: number,
  count: number = 28,
  timeframe: ChartTimeframe = 'LIVE'
): CandlePoint[] => {
  const candles: CandlePoint[] = [];
  const startPrice = currentPrice / (1 + changePercent / 100);
  const now = Date.now();
  const stepMs = timeframe === 'LIVE' ? 4000 : timeframe === '1D' ? 15 * 60 * 1000 : 3600 * 1000;

  let walkingOpen = startPrice;
  const priceDeltaTotal = currentPrice - startPrice;
  const driftPerCandle = priceDeltaTotal / count;
  const baseVolatility = Math.max(currentPrice * 0.0035, currentPrice > 100 ? 15 : 0.001);

  const round = (val: number) => (currentPrice > 100 ? Math.round(val) : Number(val.toFixed(4)));

  for (let i = 0; i < count; i++) {
    const time = now - (count - 1 - i) * stepMs;
    // Multi-frequency wave pattern for realistic market structure (uptrend, swing pullbacks, breakouts)
    const wave = Math.sin((i / count) * Math.PI * 2.5) * baseVolatility * 0.8;
    const randomShock = (Math.random() - 0.48) * baseVolatility;

    let close = i === count - 1 ? currentPrice : walkingOpen + driftPerCandle + wave + randomShock;
    close = Math.max(close, currentPrice * 0.5);

    const highExtra = Math.random() * (baseVolatility * 0.75) + (currentPrice > 100 ? 4 : 0.0008);
    const lowExtra = Math.random() * (baseVolatility * 0.75) + (currentPrice > 100 ? 4 : 0.0008);

    const openVal = round(walkingOpen);
    const closeVal = round(close);
    const highVal = Math.max(openVal, closeVal, round(Math.max(walkingOpen, close) + highExtra));
    const lowVal = Math.min(openVal, closeVal, round(Math.min(walkingOpen, close) - lowExtra));

    candles.push({
      timestamp: time,
      timeLabel: formatTimeLabel(new Date(time), timeframe),
      open: openVal,
      high: highVal,
      low: lowVal,
      close: closeVal,
    });

    walkingOpen = close;
  }

  return candles;
};

/**
 * Generate the next live tick for the running line stream
 */
export const appendLiveTick = (
  prevPoints: ChartPoint[],
  currentPrice: number
): ChartPoint[] => {
  const maxPoints = 35;
  const lastPoint = prevPoints[prevPoints.length - 1];
  const lastPrice = lastPoint ? lastPoint.price : currentPrice;

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
 * Update the active candle or form a new candle in real-time
 */
export const updateOrAppendLiveCandle = (
  prevCandles: CandlePoint[],
  currentPrice: number,
  ticksInCurrentCandle: number
): { candles: CandlePoint[]; newTicksInCandle: number } => {
  const maxCandles = 32;
  const ticksPerCandle = 4; // Form a new candle every 4 ticks

  if (prevCandles.length === 0) {
    return {
      candles: generateRealisticCandles(currentPrice, 0, 1),
      newTicksInCandle: 1,
    };
  }

  const lastCandle = prevCandles[prevCandles.length - 1];
  const lastPrice = lastCandle.close;

  const drift = (currentPrice - lastPrice) * 0.25;
  const volatility = Math.max(currentPrice * 0.0012, currentPrice > 100 ? 5 : 0.0004);
  const microJiggle = (Math.random() - 0.48) * volatility;
  const newPrice = currentPrice > 100
    ? Math.round(lastPrice + drift + microJiggle)
    : Number((lastPrice + drift + microJiggle).toFixed(4));

  if (ticksInCurrentCandle < ticksPerCandle) {
    // Update existing active candle in-place
    const updatedActiveCandle: CandlePoint = {
      ...lastCandle,
      close: newPrice,
      high: Math.max(lastCandle.high, newPrice),
      low: Math.min(lastCandle.low, newPrice),
    };
    const updated = [...prevCandles.slice(0, -1), updatedActiveCandle];
    return { candles: updated, newTicksInCandle: ticksInCurrentCandle + 1 };
  }

  // Finalize candle and open a brand new candle
  const now = new Date();
  const wickBuffer = currentPrice > 100 ? Math.round(Math.random() * 5) + 3 : 0.0005;
  const newCandle: CandlePoint = {
    timestamp: now.getTime(),
    timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    open: lastCandle.close,
    close: newPrice,
    high: Math.max(lastCandle.close, newPrice) + wickBuffer,
    low: Math.min(lastCandle.close, newPrice) - wickBuffer,
  };

  const updated = [...prevCandles, newCandle];
  if (updated.length > maxCandles) {
    return { candles: updated.slice(updated.length - maxCandles), newTicksInCandle: 1 };
  }
  return { candles: updated, newTicksInCandle: 1 };
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

/**
 * Fetch intraday candlestick (OHLC) points from Yahoo Finance API with graceful fallback
 */
export const fetchCandlePoints = async (
  asset: MarketAsset,
  timeframe: ChartTimeframe
): Promise<CandlePoint[]> => {
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
    const quote = resultObj?.indicators?.quote?.[0];
    const opens: (number | null)[] = quote?.open || [];
    const highs: (number | null)[] = quote?.high || [];
    const lows: (number | null)[] = quote?.low || [];
    const closes: (number | null)[] = quote?.close || [];

    if (!timestamps.length || !closes.length) {
      return generateRealisticCandles(asset.price, asset.changePercent, 25, timeframe);
    }

    const candles: CandlePoint[] = [];
    const round = (val: number) => (asset.price > 100 ? Math.round(val) : Number(val.toFixed(4)));

    for (let i = 0; i < timestamps.length; i++) {
      const o = opens[i];
      const h = highs[i];
      const l = lows[i];
      const c = closes[i];
      const t = timestamps[i];

      if (
        typeof o === 'number' &&
        typeof h === 'number' &&
        typeof l === 'number' &&
        typeof c === 'number' &&
        Number.isFinite(c) &&
        typeof t === 'number'
      ) {
        const date = new Date(t * 1000);
        const openVal = round(o);
        const closeVal = round(c);
        const spreadBuffer = Math.max((closeVal * 0.0008), asset.price > 100 ? 2 : 0.0004);
        const highVal = Math.max(openVal, closeVal, round(h > l ? h : closeVal + spreadBuffer));
        const lowVal = Math.min(openVal, closeVal, round(h > l ? l : closeVal - spreadBuffer));

        candles.push({
          timestamp: date.getTime(),
          timeLabel: formatTimeLabel(date, timeframe),
          open: openVal,
          high: highVal,
          low: lowVal,
          close: closeVal,
        });
      }
    }

    if (candles.length < 5) {
      return generateRealisticCandles(asset.price, asset.changePercent, 28, timeframe);
    }

    // If API returned fewer than 20 candles (e.g. market just opened), prepend historical candles
    if (candles.length < 20) {
      const needed = 25 - candles.length;
      const firstCandle = candles[0];
      const stepMs = 5 * 60 * 1000;
      const prepended = generateRealisticCandles(firstCandle.open, 0, needed, timeframe).map((c, idx) => ({
        ...c,
        timestamp: firstCandle.timestamp - (needed - idx) * stepMs,
        timeLabel: formatTimeLabel(new Date(firstCandle.timestamp - (needed - idx) * stepMs), timeframe),
      }));
      return [...prepended, ...candles].slice(-32);
    }

    return candles.slice(-32);
  } catch (err) {
    console.warn(`[ChartData] Falling back to generated candles for ${asset.symbol}:`, err);
    return generateRealisticCandles(asset.price, asset.changePercent, 28, timeframe);
  }
};
