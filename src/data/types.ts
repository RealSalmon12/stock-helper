export type Market = 'KR' | 'US';

export type RecommendationKind = 'buyNow' | 'stable';

export interface StockPick {
  symbol: string;
  name: string;
  market: Market;
  kind: RecommendationKind;
  /** 초보자도 이해할 수 있는 한 줄 이유 */
  reason: string;
}
