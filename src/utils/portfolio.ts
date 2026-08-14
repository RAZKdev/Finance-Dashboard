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
