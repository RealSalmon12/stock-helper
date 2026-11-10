import { Market, Stock, StockMetrics } from '../data/types';

/**
 * 종목 성적표
 *
 * 모든 종목을 다섯 가지 과목으로 채점합니다. 같은 시장(국내끼리, 해외끼리) 후보들 사이에서
 * 각 지표가 몇 등쯤인지(백분위)를 0~100점으로 바꾼 뒤 과목별로 평균을 냅니다.
 *
 *  흐름  : 최근 3·6·12개월 주가가 얼마나 올라왔는지 + 이동평균선 위/아래
 *  가치  : 이익·자산에 비해 주가가 싼지 (PER, 선행 PER, PBR, PEG, 목표주가 여유)
 *  실적  : 돈을 잘 벌고 잘 크는지 (ROE, 순이익률, 이익·매출 성장률)
 *  안정  : 덜 흔들리고 덜 빠지고 튼튼한지 (변동성, 베타, 최대 낙폭, 부채비율, 회사 크기)
 *  배당  : 배당을 넉넉히, 무리 없이 주는지 (배당수익률, 배당성향)
 *
 * 값이 없는 지표는 빼고 평균을 내며, 과목 전체에 값이 없으면 50점(보통)으로 둡니다.
 */

export type FactorKey = 'trend' | 'value' | 'earn' | 'safe' | 'div';

export const FACTORS: { key: FactorKey; label: string; easy: string }[] = [
  { key: 'trend', label: '흐름', easy: '요즘 주가가 오르는 힘' },
  { key: 'value', label: '가치', easy: '버는 돈에 비해 싼 정도' },
  { key: 'earn', label: '실적', easy: '돈을 잘 벌고 잘 크는지' },
  { key: 'safe', label: '안정', easy: '덜 흔들리고 튼튼한지' },
  { key: 'div', label: '배당', easy: '갖고만 있어도 받는 돈' },
];

export type Factors = Record<FactorKey, number>;

export interface Rated {
  stock: Stock;
  f: Factors;
  /** 다섯 과목을 합친 종합 점수 */
  total: number;
  /** 같은 시장 안에서 1주 가격 순위 (낮을수록 높은 점수) — 학생 추천용 */
  afford: number;
  /** 회사 크기 순위 */
  size: number;
  /** 값이 있는 지표 비율 0~1 */
  coverage: number;
}

export const ok = (v: number | null | undefined): v is number => v != null && Number.isFinite(v);
export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

const FIN = ['은행', '금융', '보험', '지주/보험'];
export const isFinancial = (s: Stock) => FIN.includes(s.sector);

type Get = (m: StockMetrics) => number | null | undefined;

const pos = (v: number | null | undefined) => (ok(v) && v > 0 ? v : null);
export const upside = (m: StockMetrics) =>
  ok(m.targetPrice) && ok(m.analystCount) && m.analystCount >= 3 ? (m.targetPrice / m.price - 1) * 100 : null;

function percentile(values: number[], v: number | null | undefined, higherBetter: boolean): number | null {
  if (!ok(v) || values.length === 0) return null;
  let below = 0;
  let equal = 0;
  for (const x of values) {
    if (x < v) below++;
    else if (x === v) equal++;
  }
  const p = ((below + equal / 2) / values.length) * 100;
  return higherBetter ? p : 100 - p;
}

function mean(parts: (number | null)[]) {
  const known = parts.filter(ok);
  return { v: known.length ? known.reduce((a, b) => a + b, 0) / known.length : 50, known: known.length, total: parts.length };
}

/** 한 시장의 종목들을 채점합니다. */
export function rateMarket(all: Stock[], market: Market): Rated[] {
  const list = all.filter((s) => s.market === market && ok(s.metrics.price));
  const cols = new Map<string, number[]>();
  const col = (key: string, g: Get, filter?: (s: Stock) => boolean) => {
    let c = cols.get(key);
    if (!c) {
      c = list
        .filter((s) => !filter || filter(s))
        .map((s) => g(s.metrics))
        .filter(ok);
      cols.set(key, c);
    }
    return c;
  };
  const r = (key: string, g: Get, s: Stock, higher = true, filter?: (s: Stock) => boolean) =>
    percentile(col(key, g, filter), g(s.metrics), higher);

  return list.map((s) => {
    const m = s.metrics;
    const fin = isFinancial(s);

    const trendParts = mean([r('r3', (x) => x.ret3m, s), r('r6', (x) => x.ret6m, s), r('r12', (x) => x.ret1y, s)]);
    const trend = clamp(trendParts.v + (m.aboveMa50 ? 8 : -6) + (m.aboveMa200 ? 8 : -10));

    const valueParts = mean([
      r('per', (x) => pos(x.per), s, false),
      r('fper', (x) => pos(x.fwdPer), s, false),
      fin ? r('pbrF', (x) => pos(x.pbr), s, false, isFinancial) : r('pbr', (x) => pos(x.pbr), s, false),
      r('peg', (x) => pos(x.peg), s, false),
      r('up', upside, s),
    ]);
    let value = valueParts.v;
    if (ok(m.per) && m.per < 0) value = Math.min(value, 25);

    const earnParts = mean([
      r('roe', (x) => x.roe, s),
      r('pm', (x) => x.profitMargin, s),
      r('eg', (x) => x.earningsGrowth, s),
      r('rg', (x) => x.revenueGrowth, s),
    ]);
    let earn = earnParts.v;
    if (ok(m.profitMargin) && m.profitMargin < 0) earn = Math.min(earn, 20);

    const safeParts = mean([
      r('vol', (x) => x.vol, s, false),
      r('beta', (x) => x.beta, s, false),
      r('mdd', (x) => x.mdd, s),
      fin
        ? null
        : r(
            'debt',
            (x) => x.debtToEquity,
            s,
            false,
            (x) => !isFinancial(x),
          ),
      r('cap', (x) => x.marketCap, s),
    ]);
    const safe = safeParts.v;

    let div = r('div', (x) => x.divYield ?? 0, s) ?? 50;
    if (ok(m.payout) && m.payout > 100) div *= 0.6;
    if (!ok(m.divYield) || m.divYield === 0) div = Math.min(div, 10);

    const f: Factors = {
      trend: Math.round(trend),
      value: Math.round(value),
      earn: Math.round(earn),
      safe: Math.round(safe),
      div: Math.round(div),
    };
    const total = Math.round(f.trend * 0.22 + f.value * 0.2 + f.earn * 0.25 + f.safe * 0.23 + f.div * 0.1);
    const parts = [trendParts, valueParts, earnParts, safeParts];
    const coverage = parts.reduce((a, p) => a + p.known / p.total, 0) / parts.length;

    return {
      stock: s,
      f,
      total,
      afford: Math.round(r('price', (x) => x.price, s, false) ?? 50),
      size: Math.round(r('cap', (x) => x.marketCap, s) ?? 50),
      coverage,
    };
  });
}

export function grade(score: number): { label: string; tone: 'great' | 'good' | 'soso' | 'weak' } {
  if (score >= 80) return { label: '아주 좋아요', tone: 'great' };
  if (score >= 65) return { label: '좋아요', tone: 'good' };
  if (score >= 45) return { label: '보통이에요', tone: 'soso' };
  return { label: '아쉬워요', tone: 'weak' };
}
