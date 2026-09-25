import React, { useEffect, useRef, useState } from 'react';
import type { MarketAsset } from '../../data/markets';
import {
  fetchCandlePoints,
  generateRealisticCandles,
  updateOrAppendLiveCandle,
  type CandlePoint,
  type ChartTimeframe,
  type ChartType,
} from '../../utils/chartData';

interface MarketLiveChartProps {
  asset: MarketAsset;
  allAssets?: MarketAsset[];
  onSelectAsset?: (asset: MarketAsset) => void;
  className?: string;
}

const formatCurrencyValue = (val: number, currency: string) => {
  if (currency === 'IDR') {
    return `Rp ${val.toLocaleString('id-ID')}`;
  }
  return `${currency} ${val.toLocaleString('en-US', {
    maximumFractionDigits: val < 10 ? 4 : 2,
    minimumFractionDigits: val < 10 ? 4 : 2,
  })}`;
};

export const MarketLiveChart: React.FC<MarketLiveChartProps> = ({
  asset,
  allAssets = [],
  onSelectAsset,
  className = '',
}) => {
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('LIVE');
  const [candles, setCandles] = useState<CandlePoint[]>(() =>
    generateRealisticCandles(asset.price, asset.changePercent, 28, 'LIVE')
  );
  const [isStreaming, setIsStreaming] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandlePoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [ticksInCandle, setTicksInCandle] = useState(1);
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);

  const prevPriceRef = useRef(asset.price);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Fetch candle data when asset or timeframe changes
  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      const data = await fetchCandlePoints(asset, timeframe);
      if (!ignore) {
        setCandles(data);
        setTicksInCandle(1);
      }
    };
    loadData();
    return () => {
      ignore = true;
    };
  }, [asset, timeframe]);

  // Live running stream interval (active in LIVE mode)
  useEffect(() => {
    if (timeframe !== 'LIVE' || !isStreaming) return;

    const interval = setInterval(() => {
      setCandles((prev) => {
        const res = updateOrAppendLiveCandle(prev, asset.price, ticksInCandle);
        setTicksInCandle(res.newTicksInCandle);

        const currentCandle = res.candles[res.candles.length - 1];
        if (currentCandle) {
          if (currentCandle.close >= currentCandle.open) {
            setFlashColor('green');
          } else {
            setFlashColor('red');
          }
          setTimeout(() => setFlashColor(null), 800);
        }

        return res.candles;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [timeframe, isStreaming, asset.price, ticksInCandle]);

  // Detect price changes from parent prop to trigger live update
  useEffect(() => {
    if (asset.price !== prevPriceRef.current) {
      if (asset.price > prevPriceRef.current) {
        setFlashColor('green');
      } else {
        setFlashColor('red');
      }
      prevPriceRef.current = asset.price;
      setTimeout(() => setFlashColor(null), 800);
    }
  }, [asset.price]);

  // Calculations for SVG scaling
  const allHighs = candles.map((c) => c.high);
  const allLows = candles.map((c) => c.low);
  const rawMin = allLows.length ? Math.min(...allLows) : asset.price * 0.98;
  const rawMax = allHighs.length ? Math.max(...allHighs) : asset.price * 1.02;
  const priceRange = rawMax - rawMin || 1;
  const paddedMin = rawMin - priceRange * 0.08;
  const paddedMax = rawMax + priceRange * 0.08;
  const paddedRange = paddedMax - paddedMin;

  const width = 800;
  const height = 280;
  const paddingLeft = 15;
  const paddingRight = 65; // space for Y-axis labels
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const scalePriceToY = (price: number) => {
    return paddingTop + chartHeight - ((price - paddedMin) / paddedRange) * chartHeight;
  };

  const candleCount = candles.length;
  const slotWidth = candleCount > 0 ? chartWidth / candleCount : 20;
  const candleBodyWidth = Math.max(4, Math.min(14, slotWidth * 0.68));

  // Current / display candle stats (either hovered or the latest active candle)
  const latestCandle = candles[candles.length - 1];
  const activeDisplayCandle = hoveredCandle || latestCandle;
  const displayPrice = activeDisplayCandle ? activeDisplayCandle.close : asset.price;
  const displayChange = activeDisplayCandle ? activeDisplayCandle.close - activeDisplayCandle.open : 0;
  const displayChangePercent = activeDisplayCandle && activeDisplayCandle.open > 0
    ? (displayChange / activeDisplayCandle.open) * 100
    : 0;

  // Active price level for dashed guide line
  const activeY = latestCandle ? scalePriceToY(latestCandle.close) : height / 2;
  const activeIsBullish = latestCandle ? latestCandle.close >= latestCandle.open : true;
  const activeColor = activeIsBullish ? '#10b981' : '#f43f5e';

  // Build Line Path if chartType === 'line'
  let linePathD = '';
  if (candles.length > 0) {
    const coords = candles.map((c, i) => ({
      x: paddingLeft + (i + 0.5) * slotWidth,
      y: scalePriceToY(c.close),
    }));

    linePathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[Math.max(i - 1, 0)];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[Math.min(i + 2, coords.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  // Pointer move handler for crosshairs & OHLC inspection
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || candleCount === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleFactor = width / rect.width;
    const svgX = clientX * scaleFactor;

    if (svgX < paddingLeft || svgX > width - paddingRight) {
      setHoveredCandle(null);
      setHoverX(null);
      setHoverY(null);
      return;
    }

    const relativeX = svgX - paddingLeft;
    const index = Math.min(
      Math.max(0, Math.floor(relativeX / slotWidth)),
      candleCount - 1
    );

    const candle = candles[index];
    if (candle) {
      const centerX = paddingLeft + (index + 0.5) * slotWidth;
      const centerY = scalePriceToY(candle.close);
      setHoveredCandle(candle);
      setHoverX(centerX);
      setHoverY(centerY);
    }
  };

  const handlePointerLeave = () => {
    setHoveredCandle(null);
    setHoverX(null);
    setHoverY(null);
  };

  return (
    <div className={`rounded-xl border border-border bg-surface/70 p-4 sm:p-5 shadow-xs ${className}`}>
      {/* Asset Switcher Bar */}
      {allAssets.length > 0 && onSelectAsset && (
        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="shrink-0 text-xs font-medium text-text-muted mr-1">Select:</span>
          {allAssets.map((item) => {
            const isSelected = item.id === asset.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectAsset(item)}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-background/80 text-text-muted hover:bg-surface hover:text-text-primary border border-border/70'
                }`}
              >
                {item.symbol}
              </button>
            );
          })}
        </div>
      )}

      {/* Top Header with Price, Change & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-text-primary">
              {asset.symbol}
            </h3>
            <span className="text-xs text-text-muted">· {asset.name}</span>

            {timeframe === 'LIVE' && isStreaming && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                LIVE CANDLE
              </span>
            )}
          </div>

          <div className="mt-1 flex items-baseline gap-3">
            <span
              className={`text-2xl font-black tabular-nums transition-colors duration-300 ${
                flashColor === 'green'
                  ? 'text-emerald-400'
                  : flashColor === 'red'
                  ? 'text-rose-400'
                  : 'text-text-primary'
              }`}
            >
              {formatCurrencyValue(displayPrice, asset.currency)}
            </span>

            <span
              className={`inline-flex items-center text-xs font-semibold tabular-nums ${
                displayChange >= 0 ? 'text-positive' : 'text-negative'
              }`}
            >
              {displayChange >= 0 ? '+' : ''}
              {formatCurrencyValue(displayChange, asset.currency)} ({displayChange >= 0 ? '+' : ''}
              {displayChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Chart View Toggle & Timeframe Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Mode (Candle vs Line) */}
          <div className="flex rounded-lg border border-border bg-background p-0.5" role="group">
            <button
              type="button"
              onClick={() => setChartType('candle')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                chartType === 'candle'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Candlestick Chart"
            >
              🕯️ Candle
            </button>

            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                chartType === 'line'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Line Chart"
            >
              📈 Line
            </button>
          </div>

          {/* Pause / Resume Live Stream */}
          {timeframe === 'LIVE' && (
            <button
              type="button"
              onClick={() => setIsStreaming((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-text-muted hover:text-text-primary"
              title={isStreaming ? 'Pause live stream' : 'Resume live stream'}
            >
              <span>{isStreaming ? '⏸ Pause' : '▶ Resume'}</span>
            </button>
          )}

          {/* Timeframe Selector */}
          <div className="flex rounded-lg border border-border bg-background p-0.5" role="group">
            {(['LIVE', '1D', '1W', '1M'] as ChartTimeframe[]).map((tf) => {
              const active = timeframe === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tf === 'LIVE' ? '🔴 Live' : tf}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* OHLC Bar (TradingView Style Bar) */}
      {activeDisplayCandle && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-background/80 px-3 py-1.5 text-xs tabular-nums text-text-muted border border-border/40">
          <div>
            <span className="text-text-muted/60">O: </span>
            <span className="font-semibold text-text-primary">
              {formatCurrencyValue(activeDisplayCandle.open, asset.currency)}
            </span>
          </div>

          <div>
            <span className="text-text-muted/60">H: </span>
            <span className="font-semibold text-text-primary">
              {formatCurrencyValue(activeDisplayCandle.high, asset.currency)}
            </span>
          </div>

          <div>
            <span className="text-text-muted/60">L: </span>
            <span className="font-semibold text-text-primary">
              {formatCurrencyValue(activeDisplayCandle.low, asset.currency)}
            </span>
          </div>

          <div>
            <span className="text-text-muted/60">C: </span>
            <span
              className={`font-semibold ${
                activeDisplayCandle.close >= activeDisplayCandle.open
                  ? 'text-positive'
                  : 'text-negative'
              }`}
            >
              {formatCurrencyValue(activeDisplayCandle.close, asset.currency)}
            </span>
          </div>

          <div className="ml-auto text-[11px] text-text-muted/70">
            {activeDisplayCandle.timeLabel}
          </div>
        </div>
      )}

      {/* SVG Candlestick / Line Chart Canvas */}
      <div className="relative mt-3">
        {/* Floating Tooltip Card */}
        {hoveredCandle && hoverX !== null && hoverY !== null && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface-elevated/95 px-3 py-2 text-xs shadow-lg backdrop-blur-xs"
            style={{
              left: `${(hoverX / width) * 100}%`,
              top: `${Math.max(10, (hoverY / height) * 100 - 10)}%`,
            }}
          >
            <div className="font-bold text-text-primary">
              {formatCurrencyValue(hoveredCandle.close, asset.currency)}
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-text-muted mt-1">
              <span>Open: {hoveredCandle.open}</span>
              <span>High: {hoveredCandle.high}</span>
              <span>Low: {hoveredCandle.low}</span>
              <span>Close: {hoveredCandle.close}</span>
            </div>
            <p className="text-[10px] text-text-muted/70 mt-1 border-t border-border/40 pt-0.5">
              {hoveredCandle.timeLabel}
            </p>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64 sm:h-72 overflow-visible cursor-crosshair select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#10b981" floodOpacity="0.6" />
            </filter>
            <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f43f5e" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines & Price Labels on right axis */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = paddingTop + chartHeight * ratio;
            const priceLevel = paddedMax - ratio * paddedRange;
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - paddingRight + 6}
                  y={y + 3.5}
                  className="text-[9px] fill-text-muted/70 select-none tabular-nums"
                  textAnchor="start"
                >
                  {formatCurrencyValue(priceLevel, asset.currency)}
                </text>
              </g>
            );
          })}

          {/* Bottom Volume Bars (TradingView / Pro Terminal Style) */}
          {chartType === 'candle' &&
            candles.map((candle, idx) => {
              const centerX = paddingLeft + (idx + 0.5) * slotWidth;
              const isBullish = candle.close >= candle.open;
              const color = isBullish ? '#10b981' : '#f43f5e';
              const bodyDelta = Math.abs(candle.close - candle.open);
              const volRatio = Math.min(1, bodyDelta / (priceRange * 0.25) + 0.15);
              const barH = volRatio * 26;

              return (
                <rect
                  key={`vol-${candle.timestamp}`}
                  x={centerX - candleBodyWidth / 2}
                  y={height - paddingBottom - barH}
                  width={candleBodyWidth}
                  height={barH}
                  fill={color}
                  opacity={0.22}
                  rx={1}
                />
              );
            })}

          {/* Render Candlesticks if chartType === 'candle' */}
          {chartType === 'candle' &&
            candles.map((candle, idx) => {
              const centerX = paddingLeft + (idx + 0.5) * slotWidth;
              const yHigh = scalePriceToY(candle.high);
              const yLow = scalePriceToY(candle.low);
              const yOpen = scalePriceToY(candle.open);
              const yClose = scalePriceToY(candle.close);

              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
              const isBullish = candle.close >= candle.open;
              const color = isBullish ? '#10b981' : '#f43f5e';
              const isLast = idx === candleCount - 1;

              return (
                <g
                  key={candle.timestamp}
                  className="transition-all duration-200"
                  filter={isLast ? (isBullish ? 'url(#glow-green)' : 'url(#glow-red)') : undefined}
                >
                  {/* Wick / Shadow */}
                  <line
                    x1={centerX}
                    y1={yHigh}
                    x2={centerX}
                    y2={yLow}
                    stroke={color}
                    strokeWidth={1.5}
                  />

                  {/* Candle Body */}
                  <rect
                    x={centerX - candleBodyWidth / 2}
                    y={bodyTop}
                    width={candleBodyWidth}
                    height={bodyHeight}
                    fill={color}
                    stroke={color}
                    strokeWidth={1}
                    rx={1.5}
                    className={isLast ? 'filter drop-shadow-sm' : ''}
                  />
                </g>
              );
            })}

          {/* Render Smooth Line if chartType === 'line' */}
          {chartType === 'line' && linePathD && (
            <path
              d={linePathD}
              fill="none"
              stroke={activeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Active Price Dashed Horizontal Guideline */}
          {latestCandle && (
            <g>
              <line
                x1={paddingLeft}
                y1={activeY}
                x2={width - paddingRight}
                y2={activeY}
                stroke={activeColor}
                strokeDasharray="3 3"
                strokeWidth="1.2"
                strokeOpacity="0.8"
              />

              {/* Price Tag Badge on Right Axis */}
              <rect
                x={width - paddingRight + 2}
                y={activeY - 9}
                width={60}
                height={18}
                rx={3}
                fill={activeColor}
              />
              <text
                x={width - paddingRight + 5}
                y={activeY + 3.5}
                fill="#ffffff"
                className="text-[9px] font-bold tabular-nums"
              >
                {asset.currency === 'IDR'
                  ? Math.round(latestCandle.close).toLocaleString('id-ID')
                  : latestCandle.close.toFixed(latestCandle.close < 10 ? 3 : 1)}
              </text>

              {/* Pulsing Beacon at Active Candle Close */}
              <g
                transform={`translate(${
                  paddingLeft + (candleCount - 0.5) * slotWidth
                }, ${activeY})`}
              >
                <circle r="6" fill={activeColor} opacity="0.4" className="animate-ping" />
                <circle r="3.5" fill={activeColor} stroke="#ffffff" strokeWidth="1.5" />
              </g>
            </g>
          )}

          {/* Crosshairs on Pointer Hover */}
          {hoverX !== null && hoverY !== null && (
            <g>
              <line
                x1={hoverX}
                y1={paddingTop}
                x2={hoverX}
                y2={height - paddingBottom}
                stroke="currentColor"
                className="text-text-muted/60"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={paddingLeft}
                y1={hoverY}
                x2={width - paddingRight}
                y2={hoverY}
                stroke="currentColor"
                className="text-text-muted/60"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Footer Metrics */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs text-text-muted">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-[11px] text-text-muted/80">Period Low: </span>
            <span className="font-semibold tabular-nums text-text-primary">
              {formatCurrencyValue(rawMin, asset.currency)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-muted/80">Period High: </span>
            <span className="font-semibold tabular-nums text-text-primary">
              {formatCurrencyValue(rawMax, asset.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timeframe === 'LIVE' ? (
            <span className="text-[11px]">
              Live Candlestick Stream Active · <strong>{candleCount}</strong> candles
            </span>
          ) : (
            <span className="text-[11px]">Historical Candlesticks ({candleCount})</span>
          )}
        </div>
      </div>
    </div>
  );
};
