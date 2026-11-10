import { Market, Stock } from '../data/types';
import { clamp, FactorKey, ok, Rated, rateMarket } from './factors';
import { buyShare, targetUpside, voteTotal } from './outlook';

/**
 * 추천 목록
 *
 * 종목 성적표(factors.ts)의 과목 점수를 목록마다 다른 비중으로 섞어 순위를 매깁니다.
 * 투자 조언이 아니라, "이런 기준으로 보면 이 종목들이 위에 있어요"라는 참고용 정리예요.
 */

export type CollectionId = 'buy' | 'expert' | 'stable' | 'student' | 'dividend' | 'growth' | 'value';

export interface Collection {
  id: CollectionId;
  emoji: string;
  title: string;
  /** 목록 위에 보이는 한 줄 설명 */
  desc: string;
  /** 어떤 기준으로 골랐는지 */
  how: string;
  /** 점수에 많이 반영되는 과목 (상세 화면 강조용) */
  focus: FactorKey[];
  score: (r: Rated) => number;
  /** 이 목록에 넣지 않을 종목 */
  exclude?: (r: Rated) => boolean;
}

export const COLLECTIONS: Collection[] = [
  {
    id: 'buy',
    emoji: '🚀',
    title: '지금 사기 좋은',
    desc: '오르는 힘이 있으면서 아직 비싸지 않은 종목',
    how: '흐름 40% · 가치 30% · 실적 30%. 단기간에 너무 많이 올랐거나(과열) 장기 하락 중이면 점수를 깎아요.',
    focus: ['trend', 'value', 'earn'],
    score: ({ f, stock: { metrics: m } }) => {
      let v = f.trend * 0.4 + f.value * 0.3 + f.earn * 0.3;
      if (ok(m.rsi14) && m.rsi14 >= 75) v -= 7;
      if (ok(m.ret1m) && m.ret1m >= 25) v -= 5;
      if (!m.aboveMa200 && ok(m.ret6m) && m.ret6m < -15) v -= 8;
      return v;
    },
  },
  {
    id: 'expert',
    emoji: '🎯',
    title: '전문가가 주목하는',
    desc: '증권사 애널리스트들의 매수 의견이 많고 목표가 여유가 큰 종목',
    how: '매수 의견 비율 50% · 평균 목표가까지 남은 여유 35% · 의견을 낸 애널리스트 수 15%. 의견이 5명 미만이면 빼요. 애널리스트 전망은 자주 틀리고 대체로 낙관적이에요.',
    focus: ['value', 'earn'],
    score: ({ stock }) => {
      const share = buyShare(stock.outlook) ?? 50;
      const up = targetUpside(stock) ?? 0;
      const n = voteTotal(stock.outlook) || stock.outlook?.analysts || 0;
      return share * 0.5 + Math.max(0, Math.min(100, 50 + up * 1.5)) * 0.35 + Math.min(100, n * 3) * 0.15;
    },
    exclude: ({ stock }) => (voteTotal(stock.outlook) || stock.outlook?.analysts || 0) < 5,
  },
  {
    id: 'stable',
    emoji: '🛡️',
    title: '안정적인',
    desc: '덜 흔들리고 꾸준히 돈을 버는 종목',
    how: '안정 50% · 실적 30% · 배당 20%. 1년 변동성이 50%를 넘는 종목은 빼요.',
    focus: ['safe', 'earn', 'div'],
    score: ({ f }) => f.safe * 0.5 + f.earn * 0.3 + f.div * 0.2,
    exclude: ({ stock: { metrics: m } }) => ok(m.vol) && m.vol > 50,
  },
  {
    id: 'student',
    emoji: '🎒',
    title: '학생 추천',
    desc: '용돈으로 시작하기 좋은, 잘 알려진 튼튼한 회사',
    how: '안정 30% · 1주 가격 부담 20% · 회사 크기 20% · 실적 20% · 배당 10%. 해외 주식은 소수점으로 살 수 있어서 가격 비중을 줄였어요. 많이 출렁이는 종목은 점수를 깎아요.',
    focus: ['safe', 'earn'],
    score: ({ f, afford, size, stock }) => {
      const m = stock.metrics;
      const price = stock.market === 'US' ? 50 + afford / 2 : afford;
      let v = f.safe * 0.3 + price * 0.2 + size * 0.2 + f.earn * 0.2 + f.div * 0.1;
      if (ok(m.vol) && m.vol > 45) v -= 8;
      if (ok(m.mdd) && m.mdd < -40) v -= 5;
      return v;
    },
    exclude: ({ stock: { metrics: m } }) => ok(m.profitMargin) && m.profitMargin < 0,
  },
  {
    id: 'dividend',
    emoji: '💰',
    title: '배당 넉넉한',
    desc: '갖고만 있어도 꼬박꼬박 돈을 주는 종목',
    how: '배당 60% · 실적 20% · 안정 20%. 배당수익률 1.5% 미만이거나, 번 돈보다 많이 나눠주는 종목은 뒤로 밀려요.',
    focus: ['div', 'earn', 'safe'],
    score: ({ f }) => f.div * 0.6 + f.earn * 0.2 + f.safe * 0.2,
    exclude: ({ stock: { metrics: m } }) => !ok(m.divYield) || m.divYield < 1.5,
  },
  {
    id: 'growth',
    emoji: '🌱',
    title: '쑥쑥 크는',
    desc: '매출과 이익이 빠르게 늘고 있는 종목',
    how: '실적 60% · 흐름 40%. 매출이 늘지 않는 종목은 빼요. 성장주는 대체로 많이 흔들려요.',
    focus: ['earn', 'trend'],
    score: ({ f, stock: { metrics: m } }) => {
      let v = f.earn * 0.6 + f.trend * 0.4;
      if (ok(m.revenueGrowth) && m.revenueGrowth > 20) v += 5;
      return v;
    },
    exclude: ({ stock: { metrics: m } }) => !ok(m.revenueGrowth) || m.revenueGrowth <= 3,
  },
  {
    id: 'value',
    emoji: '💎',
    title: '저평가 숨은 보석',
    desc: '버는 돈에 비해 주가가 싸게 매겨진 종목',
    how: '가치 60% · 실적 25% · 안정 15%. 적자 회사는 빼요. 싼 데는 이유가 있을 수 있으니 꼭 이유를 확인하세요.',
    focus: ['value', 'earn'],
    score: ({ f }) => f.value * 0.6 + f.earn * 0.25 + f.safe * 0.15,
    exclude: ({ stock: { metrics: m } }) => !ok(m.per) || m.per <= 0,
  },
];

export const collectionById = (id: CollectionId) => COLLECTIONS.find((c) => c.id === id)!;

export interface Pick {
  rated: Rated;
  score: number;
  rank: number;
}

export interface MarketBoard {
  market: Market;
  rated: Rated[];
  byCode: Map<string, Rated>;
  lists: Record<CollectionId, Pick[]>;
}

/** 한 시장의 성적표와 모든 추천 목록을 한 번에 만듭니다. */
export function buildBoard(stocks: Stock[], market: Market): MarketBoard {
  const rated = rateMarket(stocks, market);
  const lists = {} as Record<CollectionId, Pick[]>;
  for (const c of COLLECTIONS) {
    lists[c.id] = rated
      .filter((r) => !c.exclude?.(r))
      .map((r) => ({ rated: r, score: Math.round(clamp(c.score(r))), rank: 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }
  return { market, rated, byCode: new Map(rated.map((r) => [r.stock.code, r])), lists };
}

/** 이 종목이 어떤 추천 목록에 몇 위로 들어가 있는지 */
export function memberships(board: MarketBoard, code: string) {
  const out: { c: Collection; rank: number }[] = [];
  for (const c of COLLECTIONS) {
    const p = board.lists[c.id].find((x) => x.rated.stock.code === code);
    if (p) out.push({ c, rank: p.rank });
  }
  return out.sort((a, b) => a.rank - b.rank);
}
