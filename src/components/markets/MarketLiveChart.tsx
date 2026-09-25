import React, { useEffect, useRef, useState } from 'react';
import type { MarketAsset } from '../../data/markets';
import {
  appendLiveTick,
  fetchChartPoints,
  generateRealisticHistory,
  type ChartPoint,
  type ChartTimeframe,
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
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('LIVE');
  const [points, setPoints] = useState<ChartPoint[]>(() =>
    generateRealisticHistory(asset.price, asset.changePercent, 25, 'LIVE')
  );
  const [isStreaming, setIsStreaming] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
  const [tickCount, setTickCount] = useState(0);

  const prevPriceRef = useRef(asset.price);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Load chart points when asset or timeframe changes
  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      const data = await fetchChartPoints(asset, timeframe);
      if (!ignore) {
        setPoints(data);
        setTickCount(0);
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
      setPoints((prev) => {
        const next = appendLiveTick(prev, asset.price);
        const latest = next[next.length - 1];
        const secondLatest = next[next.length - 2];

        if (latest && secondLatest) {
          if (latest.price > secondLatest.price) {
            setFlashColor('green');
          } else if (latest.price < secondLatest.price) {
            setFlashColor('red');
          }
          setTimeout(() => setFlashColor(null), 800);
        }

        return next;
      });
      setTickCount((c) => c + 1);
    }, 2800);

    return () => clearInterval(interval);
  }, [timeframe, isStreaming, asset.price]);

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
  const prices = points.map((p) => p.price);
  const minPrice = prices.length ? Math.min(...prices) : asset.price * 0.98;
  const maxPrice = prices.length ? Math.max(...prices) : asset.price * 1.02;
  const priceRange = maxPrice - minPrice || 1;
  const paddedMin = minPrice - priceRange * 0.08;
  const paddedMax = maxPrice + priceRange * 0.08;
  const paddedRange = paddedMax - paddedMin;

  const width = 800;
  const height = 260;
  const paddingX = 20;
  const paddingY = 25;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const getCoordinates = (p: ChartPoint, i: number, total: number) => {
    const x = paddingX + (i / Math.max(total - 1, 1)) * chartWidth;
    const y = paddingY + chartHeight - ((p.price - paddedMin) / paddedRange) * chartHeight;
    return { x, y };
  };

  const coords = points.map((p, i) => getCoordinates(p, i, points.length));

  // Build SVG path
  let pathD = '';
  if (coords.length > 0) {
    pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[Math.max(i - 1, 0)];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[Math.min(i + 2, coords.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const areaD = coords.length
    ? `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`
    : '';

  const firstPrice = points[0]?.price ?? asset.price;
  const latestPoint = points[points.length - 1];
  const currentPrice = latestPoint ? latestPoint.price : asset.price;
  const isPositiveTrend = currentPrice >= firstPrice;
  const themeColor = isPositiveTrend ? '#10b981' : '#f43f5e';
  const gradientId = `gradient-${asset.id}-${isPositiveTrend ? 'up' : 'down'}`;

  const latestCoord = coords[coords.length - 1];

  // Mouse move handler for crosshair
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;

    // Find closest point
    let closestIdx = 0;
    let minDistance = Infinity;

    coords.forEach((c, idx) => {
      const dist = Math.abs(c.x - svgX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    const targetCoord = coords[closestIdx];
    const targetPoint = points[closestIdx];
    if (targetCoord && targetPoint) {
      setHoveredPoint(targetPoint);
      setHoverX(targetCoord.x);
      setHoverY(targetCoord.y);
    }
  };

  const handlePointerLeave = () => {
    setHoveredPoint(null);
    setHoverX(null);
    setHoverY(null);
  };

  const periodChange = currentPrice - firstPrice;
  const periodChangePercent = firstPrice > 0 ? (periodChange / firstPrice) * 100 : 0;

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

      {/* Header with Live Stats & Controls */}
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
                LIVE STREAM
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
              {formatCurrencyValue(currentPrice, asset.currency)}
            </span>

            <span
              className={`inline-flex items-center text-xs font-semibold tabular-nums ${
                periodChange >= 0 ? 'text-positive' : 'text-negative'
              }`}
            >
              {periodChange >= 0 ? '+' : ''}
              {formatCurrencyValue(periodChange, asset.currency)} ({periodChange >= 0 ? '+' : ''}
              {periodChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Timeframe & Stream Toggle */}
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Live SVG Chart */}
      <div className="relative mt-4">
        {/* Tooltip on pointer hover */}
        {hoveredPoint && hoverX !== null && hoverY !== null && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface-elevated/95 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur-xs"
            style={{
              left: `${(hoverX / width) * 100}%`,
              top: `${(hoverY / height) * 100 - 8}%`,
            }}
          >
            <p className="font-bold tabular-nums text-text-primary">
              {formatCurrencyValue(hoveredPoint.price, asset.currency)}
            </p>
            <p className="text-[10px] text-text-muted">{hoveredPoint.timeLabel}</p>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-64 overflow-visible cursor-crosshair select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = paddingY + chartHeight * ratio;
            const priceLevel = paddedMax - ratio * paddedRange;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={width - paddingX + 4}
                  y={y + 3}
                  className="text-[9px] fill-text-muted/60 select-none tabular-nums"
                  textAnchor="start"
                >
                  {formatCurrencyValue(priceLevel, asset.currency)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

          {/* Main Curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={themeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Current Price Dashed Guideline */}
          {latestCoord && (
            <line
              x1={paddingX}
              y1={latestCoord.y}
              x2={latestCoord.x}
              y2={latestCoord.y}
              stroke={themeColor}
              strokeDasharray="3 3"
              strokeOpacity="0.6"
              strokeWidth="1.2"
            />
          )}

          {/* Live Pulsing Beacon Dot at the leading edge */}
          {latestCoord && (
            <g transform={`translate(${latestCoord.x}, ${latestCoord.y})`}>
              <circle r="7" fill={themeColor} opacity="0.35" className="animate-ping" />
              <circle r="4.5" fill={themeColor} stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {/* Hover Crosshair */}
          {hoverX !== null && hoverY !== null && (
            <g>
              <line
                x1={hoverX}
                y1={paddingY}
                x2={hoverX}
                y2={height - paddingY}
                stroke="currentColor"
                className="text-text-muted/70"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={hoverY}
                x2={width - paddingX}
                y2={hoverY}
                stroke="currentColor"
                className="text-text-muted/70"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle cx={hoverX} cy={hoverY} r="4" fill="#ffffff" stroke={themeColor} strokeWidth="2" />
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
              {formatCurrencyValue(minPrice, asset.currency)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-text-muted/80">Period High: </span>
            <span className="font-semibold tabular-nums text-text-primary">
              {formatCurrencyValue(maxPrice, asset.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timeframe === 'LIVE' ? (
            <span className="text-[11px]">
              Stream active · <strong>{tickCount}</strong> ticks generated
            </span>
          ) : (
            <span className="text-[11px]">Historical Intraday Points ({points.length})</span>
          )}
        </div>
      </div>
    </div>
  );
};
