export type MarketAssetType = 'stock' | 'crypto' | 'forex';

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  type: MarketAssetType;
  price: number;
  changePercent: number;
  currency: string;
  lastUpdated?: string;
  isLive?: boolean;
}

export const marketAssets: MarketAsset[] = [
  {
    id: 'bbca',
    symbol: 'BBCA',
    name: 'Bank Central Asia',
    type: 'stock',
    price: 6225,
    changePercent: -1.19,
    currency: 'IDR',
  },
  {
    id: 'bmri',
    symbol: 'BMRI',
    name: 'Bank Mandiri',
    type: 'stock',
    price: 4070,
    changePercent: -2.86,
    currency: 'IDR',
  },
  {
    id: 'bbri',
    symbol: 'BBRI',
    name: 'Bank Rakyat Indonesia',
    type: 'stock',
    price: 3140,
    changePercent: -1.57,
    currency: 'IDR',
  },
  {
    id: 'tlkm',
    symbol: 'TLKM',
    name: 'Telkom Indonesia',
    type: 'stock',
    price: 2410,
    changePercent: -1.23,
    currency: 'IDR',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    price: 84450,
    changePercent: -0.05,
    currency: 'USD',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    price: 2690,
    changePercent: 0.26,
    currency: 'USD',
  },
  {
    id: 'usdidr',
    symbol: 'USDIDR',
    name: 'US Dollar / Indonesian Rupiah',
    type: 'forex',
    price: 17835,
    changePercent: 0.12,
    currency: 'IDR',
  },
  {
    id: 'eurusd',
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    type: 'forex',
    price: 1.1397,
    changePercent: -0.15,
    currency: 'USD',
  },
  {
    id: 'euridr',
    symbol: 'EURIDR',
    name: 'Euro / Indonesian Rupiah',
    type: 'forex',
    price: 20328,
    changePercent: -0.03,
    currency: 'IDR',
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
];
