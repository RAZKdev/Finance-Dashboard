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
