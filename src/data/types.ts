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

/** 애널리스트 전망 (Yahoo Finance) */
export interface Outlook {
  targetMean?: number | null;
  targetHigh?: number | null;
  targetLow?: number | null;
  analysts?: number | null;
  recKey?: string | null;
  /** 1(강력 매수) ~ 5(강력 매도) */
  recMean?: number | null;
  votes?: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  epsGrowthThisYear?: number | null;
  epsGrowthNextYear?: number | null;
  revGrowthNextYear?: number | null;
  changes?: { firm: string; action: string; from: string | null; to: string | null; t: number }[];
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  t: number | null;
  /** 이 종목을 직접 다룬 기사인지 (아니면 업종·시장 기사) */
  rel?: boolean;
  /** 제목의 낙관(1)/중립(0)/비관(-1) 단어 판정 */
  tone: number;
}

/** 투자자 반응 */
export interface Crowd {
  source: string;
  posts: number;
  bull: number;
  bear: number;
  watchers?: number | null;
  holders?: number;
  method: string;
}

export interface Stock {
  code: string;
  name: string;
  sector: string;
  market: Market;
  currency: string;
  spark: number[];
  metrics: StockMetrics;
  outlook?: Outlook | null;
  news?: NewsItem[];
  crowd?: Crowd | null;
  /** 장중 현재가를 받았을 때만 있음 */
  live?: { state: string | null; t: number | null; intraday: number[] };
}

export interface MarketData {
  generatedAt: string;
  sources: string[];
  stocks: Stock[];
}
