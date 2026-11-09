export type Market = 'KR' | 'US';

export type RecommendationKind = 'buyNow' | 'stable';

export type Mode = 'beginner' | 'expert';

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

export type Tone = 'good' | 'warn' | 'info';

export interface Reason {
  tone: Tone;
  /** 짧은 제목 (예: "오르는 흐름") */
  title: string;
  /** 초보용 쉬운 문장 */
  easy: string;
  /** 고수용 숫자 포함 문장 */
  detail: string;
  /** 관련 용어 (용어 사전 키) */
  term?: TermKey;
  /** 정렬용 강도 */
  weight: number;
}

export type TermKey =
  | 'per'
  | 'pbr'
  | 'peg'
  | 'roe'
  | 'div'
  | 'payout'
  | 'vol'
  | 'beta'
  | 'mdd'
  | 'ma'
  | 'rsi'
  | 'debt'
  | 'momentum'
  | 'target'
  | 'margin'
  | 'growth';

export interface SubScore {
  key: string;
  label: string;
  score: number; // 0~100
  weight: number; // 0~1
}

export interface Scored {
  stock: Stock;
  kind: RecommendationKind;
  score: number; // 0~100
  subs: SubScore[];
  reasons: Reason[];
  summary: string;
  /** 데이터가 얼마나 갖춰져 있는지 0~1 */
  coverage: number;
}
