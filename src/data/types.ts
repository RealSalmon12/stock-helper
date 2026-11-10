export type Market = 'KR' | 'US';

/** 수집 스크립트(scripts/fetch-data.mjs)가 만드는 지표. 값이 없으면 null/undefined. 퍼센트 값은 % 단위. */
export interface StockMetrics {
  price: number;
  change1d?: number | null;
  ret1m?: number | null;
  ret3m?: number | null;
  ret6m?: number | null;
  ret1y?: number | null;
  vol?: number | null;
  mdd?: number | null;
  ma50?: number | null;
  ma200?: number | null;
  aboveMa50?: boolean;
  aboveMa200?: boolean;
  rsi14?: number | null;
  high52?: number | null;
  low52?: number | null;
  fromHigh?: number | null;
  per?: number | null;
  fwdPer?: number | null;
  pbr?: number | null;
  peg?: number | null;
  divYield?: number | null;
  payout?: number | null;
  beta?: number | null;
  marketCap?: number | null;
  roe?: number | null;
  profitMargin?: number | null;
  opMargin?: number | null;
  revenueGrowth?: number | null;
  earningsGrowth?: number | null;
  debtToEquity?: number | null;
  currentRatio?: number | null;
  freeCashflow?: number | null;
  targetPrice?: number | null;
  analystCount?: number | null;
  recommendation?: string | null;
}

export interface Stock {
  code: string;
  name: string;
  sector: string;
  market: Market;
  currency: string;
  spark: number[];
  metrics: StockMetrics;
}

export interface MarketData {
  generatedAt: string;
  sources: string[];
  stocks: Stock[];
}
