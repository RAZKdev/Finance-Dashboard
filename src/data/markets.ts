export type MarketAssetType = 'stock' | 'crypto' | 'forex';

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  type: MarketAssetType;
  price: number;
  changePercent: number;
  currency: string;
}

export const marketAssets: MarketAsset[] = [
  {
    id: 'bbca',
    symbol: 'BBCA',
    name: 'Bank Central Asia',
    type: 'stock',
    price: 8750,
    changePercent: 1.24,
    currency: 'IDR',
  },
  {
    id: 'bmri',
    symbol: 'BMRI',
    name: 'Bank Mandiri',
    type: 'stock',
    price: 5325,
    changePercent: -0.56,
    currency: 'IDR',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    price: 118500,
    changePercent: 2.18,
    currency: 'USD',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    price: 4310,
    changePercent: -1.12,
    currency: 'USD',
  },
  {
    id: 'xauusd',
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    type: 'forex',
    price: 3398.5,
    changePercent: 0.74,
    currency: 'USD',
  },
  {
    id: 'eurusd',
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    type: 'forex',
    price: 1.1684,
    changePercent: -0.21,
    currency: 'USD',
  },
];
