import type { PortfolioAsset } from '../types/finance';

export interface PortfolioMetrics {
  costBasis: number | null;
  marketValue: number | null;
  profitLoss: number | null;
  profitLossPercent: number | null;
}

export function calculatePortfolioMetrics(
  asset: PortfolioAsset
): PortfolioMetrics {
  const {
    quantity,
    averageBuyPrice,
    currentPrice,
  } = asset;

  if (
    quantity === undefined ||
    averageBuyPrice === undefined ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(averageBuyPrice) ||
    quantity <= 0 ||
    averageBuyPrice <= 0
  ) {
    return {
      costBasis: null,
      marketValue: null,
      profitLoss: null,
      profitLossPercent: null,
    };
  }

  const costBasis = quantity * averageBuyPrice;

  if (
    currentPrice === undefined ||
    !Number.isFinite(currentPrice) ||
    currentPrice <= 0
  ) {
    return {
      costBasis,
      marketValue: null,
      profitLoss: null,
      profitLossPercent: null,
    };
  }

  const marketValue = quantity * currentPrice;
  const profitLoss = marketValue - costBasis;
  const profitLossPercent =
    costBasis > 0 ? (profitLoss / costBasis) * 100 : null;

  return {
    costBasis,
    marketValue,
    profitLoss,
    profitLossPercent,
  };
}

export function getPortfolioValue(
  asset: PortfolioAsset
): number {
  const metrics = calculatePortfolioMetrics(asset);

  return metrics.marketValue ?? asset.value;
}

export interface PortfolioAnalytics {
  totalAssets: number;
  totalCostBasis: number;
  totalMarketValue: number;
  totalProfitLoss: number | null;
  totalProfitLossPercent: number | null;
  completeMetrics: boolean;
  assetsWithMetrics: number;
  assetsWithoutMetrics: number;
  bestPerformer: PortfolioAsset | null;
  worstPerformer: PortfolioAsset | null;
}

export function calculatePortfolioAnalytics(
  assets: PortfolioAsset[]
): PortfolioAnalytics {
  const metrics = assets.map((asset) => ({
    asset,
    metrics: calculatePortfolioMetrics(asset),
  }));

  const complete = metrics.filter(
    ({ metrics: assetMetrics }) =>
      assetMetrics.costBasis !== null &&
      assetMetrics.marketValue !== null &&
      assetMetrics.profitLoss !== null &&
      assetMetrics.profitLossPercent !== null
  );

  const hasCompletePortfolioMetrics =
    assets.length > 0 &&
    complete.length === assets.length;

  const totalCostBasis = hasCompletePortfolioMetrics
    ? complete.reduce(
        (sum, { metrics: assetMetrics }) =>
          sum + (assetMetrics.costBasis ?? 0),
        0
      )
    : 0;

  const totalMarketValue = hasCompletePortfolioMetrics
    ? complete.reduce(
        (sum, { metrics: assetMetrics }) =>
          sum + (assetMetrics.marketValue ?? 0),
        0
      )
    : 0;

  const totalProfitLoss = hasCompletePortfolioMetrics
    ? complete.reduce(
        (sum, { metrics: assetMetrics }) =>
          sum + (assetMetrics.profitLoss ?? 0),
        0
      )
    : null;

  const totalProfitLossPercent =
    totalProfitLoss !== null && totalCostBasis > 0
      ? (totalProfitLoss / totalCostBasis) * 100
      : null;

  const performers = complete.filter(
    ({ metrics: assetMetrics }) =>
      assetMetrics.profitLossPercent !== null
  );

  const bestPerformer =
    performers.length > 0
      ? performers.reduce((best, current) => {
          const bestPercent =
            best.metrics.profitLossPercent ?? -Infinity;
          const currentPercent =
            current.metrics.profitLossPercent ?? -Infinity;

          return currentPercent > bestPercent ? current : best;
        }).asset
      : null;

  const worstPerformer =
    performers.length > 0
      ? performers.reduce((worst, current) => {
          const worstPercent =
            worst.metrics.profitLossPercent ?? Infinity;
          const currentPercent =
            current.metrics.profitLossPercent ?? Infinity;

          return currentPercent < worstPercent ? current : worst;
        }).asset
      : null;

  return {
    totalAssets: assets.length,
    totalCostBasis,
    totalMarketValue,
    totalProfitLoss,
    totalProfitLossPercent,
    completeMetrics: hasCompletePortfolioMetrics,
    assetsWithMetrics: complete.length,
    assetsWithoutMetrics: assets.length - complete.length,
    bestPerformer,
    worstPerformer,
  };
}

export type PortfolioConcentration =
  | 'low'
  | 'moderate'
  | 'high'
  | 'very-high';

export interface PortfolioQuality {
  totalAssets: number;
  assetsWithCompleteMetrics: number;
  assetsWithoutCompleteMetrics: number;
  largestHolding: PortfolioAsset | null;
  largestAllocation: number;
  concentration: PortfolioConcentration | null;
}

export function calculatePortfolioQuality(
  assets: PortfolioAsset[]
): PortfolioQuality {
  const completeMetricsCount = assets.filter(
    (asset) => {
      const metrics = calculatePortfolioMetrics(asset);

      return (
        metrics.costBasis !== null &&
        metrics.marketValue !== null &&
        metrics.profitLoss !== null &&
        metrics.profitLossPercent !== null
      );
    }
  ).length;

  const allocation = calculatePortfolioAllocation(assets);

  if (allocation.items.length === 0) {
    return {
      totalAssets: assets.length,
      assetsWithCompleteMetrics: completeMetricsCount,
      assetsWithoutCompleteMetrics:
        assets.length - completeMetricsCount,
      largestHolding: null,
      largestAllocation: 0,
      concentration: null,
    };
  }

  const largest = allocation.items.reduce(
    (best, current) =>
      current.percentage > best.percentage
        ? current
        : best
  );

  let concentration: PortfolioConcentration;

  if (largest.percentage >= 80) {
    concentration = 'very-high';
  } else if (largest.percentage >= 60) {
    concentration = 'high';
  } else if (largest.percentage >= 40) {
    concentration = 'moderate';
  } else {
    concentration = 'low';
  }

  return {
    totalAssets: assets.length,
    assetsWithCompleteMetrics: completeMetricsCount,
    assetsWithoutCompleteMetrics:
      assets.length - completeMetricsCount,
    largestHolding: largest.asset,
    largestAllocation: largest.percentage,
    concentration,
  };
}

export interface PortfolioAllocationItem {
  asset: PortfolioAsset;
  value: number;
  percentage: number;
}

export interface PortfolioAllocation {
  totalValue: number;
  items: PortfolioAllocationItem[];
  complete: boolean;
}

export function calculatePortfolioAllocation(
  assets: PortfolioAsset[]
): PortfolioAllocation {
  const valuedAssets = assets
    .map((asset) => ({
      asset,
      value: getPortfolioValue(asset),
    }))
    .filter(
      ({ value }) =>
        Number.isFinite(value) &&
        value > 0
    );

  const totalValue = valuedAssets.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const items = valuedAssets.map(({ asset, value }) => ({
    asset,
    value,
    percentage:
      totalValue > 0
        ? (value / totalValue) * 100
        : 0,
  }));

  return {
    totalValue,
    items,
    complete:
      assets.length > 0 &&
      items.length === assets.length &&
      totalValue > 0,
  };
}
