import { Reason, RecommendationKind, Scored, Stock, StockMetrics, SubScore } from '../data/types';
import { fmtPct, fmtPrice } from './format';

/**
 * 추천 점수 계산
 *
 * 같은 시장(한국/미국) 안의 종목끼리 각 지표의 "순위(백분위)"를 매겨 0~100점으로 바꾼 뒤,
 * 목적별 가중치로 합칩니다. 값이 없는 지표는 중간값(50점)으로 보고, 데이터가 부족하다고 표시합니다.
 *
 * 지금 사기 좋은 종목 = 오르는 힘(모멘텀) 40% + 가격 매력(저평가) 35% + 성장·수익성 25%
 * 안정적인 종목     = 낮은 흔들림 35% + 하락 방어 20% + 배당 20% + 재무 건전성 25%
 * 학생에게 좋은 종목 = 덜 흔들림 30% + 소액으로 시작 20% + 잘 알려진 큰 회사 20% + 꾸준한 이익 20% + 배당 10%
 */

type Getter = (m: StockMetrics) => number | null | undefined;

const FINANCIAL_SECTORS = ['은행', '금융', '보험', '지주/보험'];
const isFinancial = (s: Stock) => FINANCIAL_SECTORS.includes(s.sector);

const ok = (v: number | null | undefined): v is number => v != null && Number.isFinite(v);

/** universe 안에서 v의 백분위 (0~100). higherBetter=false면 낮을수록 높은 점수 */
function rank(values: number[], v: number | null | undefined, higherBetter = true): number | null {
  if (!ok(v) || values.length === 0) return null;
  let below = 0,
    equal = 0;
  for (const x of values) {
    if (x < v) below++;
    else if (x === v) equal++;
  }
  const p = ((below + equal / 2) / values.length) * 100;
  return higherBetter ? p : 100 - p;
}

function avg(parts: (number | null)[], fallback = 50): { value: number; known: number } {
  const known = parts.filter(ok);
  if (known.length === 0) return { value: fallback, known: 0 };
  return { value: known.reduce((a, b) => a + b, 0) / known.length, known: known.length };
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

interface Ctx {
  col: (g: Getter, filter?: (s: Stock) => boolean) => number[];
}

function makeCtx(universe: Stock[]): Ctx {
  const cache = new Map<string, number[]>();
  return {
    col: (g, filter) => {
      const key = g.toString() + (filter ? filter.toString() : '');
      let c = cache.get(key);
      if (!c) {
        c = universe.filter((s) => !filter || filter(s)).map((s) => g(s.metrics)).filter(ok);
        cache.set(key, c);
      }
      return c;
    },
  };
}

// ----- 공통 지표 접근자 -----
const G = {
  ret3m: (m: StockMetrics) => m.ret3m,
  ret6m: (m: StockMetrics) => m.ret6m,
  ret1y: (m: StockMetrics) => m.ret1y,
  per: (m: StockMetrics) => (ok(m.per) && m.per > 0 ? m.per : null),
  fwdPer: (m: StockMetrics) => (ok(m.fwdPer) && m.fwdPer > 0 ? m.fwdPer : null),
  pbr: (m: StockMetrics) => (ok(m.pbr) && m.pbr > 0 ? m.pbr : null),
  peg: (m: StockMetrics) => (ok(m.peg) && m.peg > 0 ? m.peg : null),
  upside: (m: StockMetrics) =>
    ok(m.targetPrice) && ok(m.analystCount) && m.analystCount >= 3 ? (m.targetPrice / m.price - 1) * 100 : null,
  eg: (m: StockMetrics) => m.earningsGrowth,
  rg: (m: StockMetrics) => m.revenueGrowth,
  roe: (m: StockMetrics) => m.roe,
  vol: (m: StockMetrics) => m.vol,
  beta: (m: StockMetrics) => m.beta,
  mdd: (m: StockMetrics) => m.mdd,
  div: (m: StockMetrics) => m.divYield ?? 0,
  debt: (m: StockMetrics) => m.debtToEquity,
  margin: (m: StockMetrics) => m.profitMargin,
  cap: (m: StockMetrics) => m.marketCap,
  price: (m: StockMetrics) => m.price,
};

// ---------- 지금 사기 좋은 종목 ----------
function scoreBuyNow(s: Stock, ctx: Ctx): { score: number; subs: SubScore[]; coverage: number } {
  const m = s.metrics;
  const mom = avg([
    rank(ctx.col(G.ret3m), m.ret3m),
    rank(ctx.col(G.ret6m), m.ret6m),
    rank(ctx.col(G.ret1y), m.ret1y),
  ]);
  // 추세 보너스: 50일선/200일선 위
  const trend = (m.aboveMa50 ? 10 : -5) + (m.aboveMa200 ? 10 : -10);
  const momentum = clamp(mom.value + trend);

  // 금융주는 PBR, 그 외는 PER/선행PER 중심
  const value = avg([
    rank(ctx.col(G.per), G.per(m), false),
    rank(ctx.col(G.fwdPer), G.fwdPer(m), false),
    rank(ctx.col(G.pbr, isFinancial), isFinancial(s) ? G.pbr(m) : null, false) ??
      rank(ctx.col(G.pbr), G.pbr(m), false),
    rank(ctx.col(G.peg), G.peg(m), false),
    rank(ctx.col(G.upside), G.upside(m)),
  ]);
  // 적자 기업은 가격 매력 낮게
  const valueScore = ok(m.per) && m.per < 0 ? Math.min(value.value, 25) : value.value;

  const growth = avg([rank(ctx.col(G.eg), m.earningsGrowth), rank(ctx.col(G.rg), m.revenueGrowth), rank(ctx.col(G.roe), m.roe)]);

  let score = momentum * 0.4 + valueScore * 0.35 + growth.value * 0.25;
  // 단기 과열 감점
  if (ok(m.rsi14) && m.rsi14 >= 75) score -= 6;
  if (ok(m.ret1m) && m.ret1m >= 25) score -= 5;
  // 장기 하락 추세 감점
  if (!m.aboveMa200 && ok(m.ret6m) && m.ret6m < -15) score -= 6;

  const coverage = (mom.known / 3 + value.known / 5 + growth.known / 3) / 3;
  return {
    score: clamp(Math.round(score)),
    coverage,
    subs: [
      { key: 'momentum', label: '오르는 힘', score: Math.round(momentum), weight: 0.4 },
      { key: 'value', label: '가격 매력', score: Math.round(valueScore), weight: 0.35 },
      { key: 'growth', label: '성장·수익성', score: Math.round(growth.value), weight: 0.25 },
    ],
  };
}

// ---------- 안정적인 종목 ----------
function scoreStable(s: Stock, ctx: Ctx): { score: number; subs: SubScore[]; coverage: number } {
  const m = s.metrics;
  const calm = avg([rank(ctx.col(G.vol), m.vol, false), rank(ctx.col(G.beta), m.beta, false)]);
  const defense = avg([rank(ctx.col(G.mdd), m.mdd)]); // mdd는 음수, 클수록(0에 가까울수록) 좋음

  let dividend = rank(ctx.col(G.div), m.divYield ?? 0) ?? 50;
  if (ok(m.payout) && m.payout > 100) dividend *= 0.6; // 번 돈보다 많이 주는 배당은 지속성 의문
  const finParts = [
    rank(ctx.col(G.roe), m.roe),
    rank(ctx.col(G.margin), m.profitMargin),
    isFinancial(s) ? null : rank(ctx.col(G.debt, (x) => !isFinancial(x)), m.debtToEquity, false),
    rank(ctx.col(G.cap), m.marketCap),
  ];
  const fin = avg(finParts);
  let finScore = fin.value;
  if (ok(m.profitMargin) && m.profitMargin < 0) finScore = Math.min(finScore, 20);

  const score = calm.value * 0.35 + defense.value * 0.2 + dividend * 0.2 + finScore * 0.25;
  const coverage = (calm.known / 2 + defense.known + fin.known / (isFinancial(s) ? 3 : 4)) / 3;
  return {
    score: clamp(Math.round(score)),
    coverage: Math.min(1, coverage),
    subs: [
      { key: 'calm', label: '덜 흔들림', score: Math.round(calm.value), weight: 0.35 },
      { key: 'defense', label: '하락 방어', score: Math.round(defense.value), weight: 0.2 },
      { key: 'dividend', label: '배당', score: Math.round(dividend), weight: 0.2 },
      { key: 'finance', label: '재무 튼튼함', score: Math.round(finScore), weight: 0.25 },
    ],
  };
}

// ---------- 학생에게 좋은 종목 ----------
// 용돈 수준의 적은 돈으로 시작할 수 있고, 이해하기 쉬운 큰 회사이며, 크게 흔들리지 않는 종목.
// 미국 주식은 국내 증권사에서 소수점 투자가 되므로 1주 가격 비중을 낮게 봅니다.
function scoreStudent(s: Stock, ctx: Ctx): { score: number; subs: SubScore[]; coverage: number } {
  const m = s.metrics;
  const calm = avg([rank(ctx.col(G.vol), m.vol, false), rank(ctx.col(G.mdd), m.mdd)]);
  const priceRank = rank(ctx.col(G.price), m.price, false) ?? 50;
  const afford = s.market === 'US' ? 50 + priceRank / 2 : priceRank;
  const known = rank(ctx.col(G.cap), m.marketCap) ?? 50;
  const profit = avg([rank(ctx.col(G.roe), m.roe), rank(ctx.col(G.margin), m.profitMargin)]);
  let profitScore = profit.value;
  if (ok(m.profitMargin) && m.profitMargin < 0) profitScore = Math.min(profitScore, 15);
  const dividend = rank(ctx.col(G.div), m.divYield ?? 0) ?? 50;

  let score = calm.value * 0.3 + afford * 0.2 + known * 0.2 + profitScore * 0.2 + dividend * 0.1;
  // 크게 출렁이는 종목은 학생에게 부담
  if (ok(m.vol) && m.vol > 45) score -= 8;
  if (ok(m.mdd) && m.mdd < -40) score -= 5;

  const coverage = (calm.known / 2 + (ok(m.marketCap) ? 1 : 0) + profit.known / 2) / 3;
  return {
    score: clamp(Math.round(score)),
    coverage,
    subs: [
      { key: 'calm', label: '덜 흔들림', score: Math.round(calm.value), weight: 0.3 },
      { key: 'afford', label: '소액으로 시작', score: Math.round(afford), weight: 0.2 },
      { key: 'known', label: '잘 알려진 큰 회사', score: Math.round(known), weight: 0.2 },
      { key: 'profit', label: '꾸준한 이익', score: Math.round(profitScore), weight: 0.2 },
      { key: 'dividend', label: '배당', score: Math.round(dividend), weight: 0.1 },
    ],
  };
}

// ---------- 이유 문장 ----------
function buyNowReasons(s: Stock): Reason[] {
  const m = s.metrics;
  const r: Reason[] = [];
  const cur = s.currency;

  if (ok(m.ret6m) && m.ret6m > 10 && m.aboveMa200) {
    r.push({
      tone: 'good',
      title: '꾸준히 오르는 흐름',
      easy: `최근 6개월 동안 주가가 ${fmtPct(m.ret6m, 0, false)} 올랐고, 장기 평균 가격보다 위에 있어요. 오르는 흐름이 이어지고 있다는 뜻이에요.`,
      detail: `6개월 ${fmtPct(m.ret6m)}, 3개월 ${fmtPct(m.ret3m)}, 1년 ${fmtPct(m.ret1y)}. 50일선·200일선 위 (정배열${m.aboveMa50 ? '' : ', 단 50일선은 하회'}).`,
      term: 'momentum',
      weight: Math.min(m.ret6m, 60) / 10 + 2,
    });
  } else if (ok(m.ret3m) && m.ret3m > 5 && m.aboveMa50) {
    r.push({
      tone: 'good',
      title: '최근 반등 중',
      easy: `최근 3개월 동안 ${fmtPct(m.ret3m, 0, false)} 오르면서 다시 힘을 받고 있어요.`,
      detail: `3개월 ${fmtPct(m.ret3m)}, 50일선 상회${m.aboveMa200 ? ', 200일선 상회' : ', 200일선은 아직 하회'}.`,
      term: 'ma',
      weight: m.ret3m / 10 + 1,
    });
  }

  if (ok(m.per) && m.per > 0 && m.per < 12) {
    r.push({
      tone: 'good',
      title: '이익 대비 싼 주가',
      easy: `주가가 1년 이익의 약 ${m.per.toFixed(0)}배예요. 지금 버는 돈에 비해 주가가 비싸지 않은 편이에요.`,
      detail: `PER ${m.per.toFixed(1)}배${ok(m.fwdPer) ? `, 선행 PER ${m.fwdPer.toFixed(1)}배` : ''}${ok(m.pbr) ? `, PBR ${m.pbr.toFixed(2)}배` : ''}.`,
      term: 'per',
      weight: (12 - m.per) / 2 + 2,
    });
  } else if (ok(m.pbr) && m.pbr > 0 && m.pbr < 0.8) {
    r.push({
      tone: 'good',
      title: '자산 대비 싼 주가',
      easy: `회사가 가진 재산보다 주가가 낮게 평가돼 있어요 (재산의 약 ${(m.pbr * 100).toFixed(0)}% 가격).`,
      detail: `PBR ${m.pbr.toFixed(2)}배${ok(m.roe) ? `, ROE ${m.roe.toFixed(1)}%` : ''}.`,
      term: 'pbr',
      weight: (1 - m.pbr) * 5 + 1,
    });
  }
  if (ok(m.peg) && m.peg > 0 && m.peg < 1.2) {
    r.push({
      tone: 'good',
      title: '성장에 비해 적당한 가격',
      easy: '이익이 늘어나는 속도를 생각하면 주가가 아직 부담스럽지 않은 수준이에요.',
      detail: `PEG ${m.peg.toFixed(2)} (1 이하면 성장 대비 저평가로 봄).`,
      term: 'peg',
      weight: 2.5,
    });
  }
  if (ok(m.earningsGrowth) && m.earningsGrowth > 15) {
    r.push({
      tone: 'good',
      title: '이익이 빠르게 늘어남',
      easy:
        m.earningsGrowth > 200
          ? `최근 이익이 1년 전보다 몇 배로 크게 늘었어요. 다만 작년 이익이 유난히 적었던 탓(기저효과)도 있어서, 이 속도가 계속되긴 어려워요.`
          : `최근 이익이 1년 전보다 ${fmtPct(m.earningsGrowth, 0, false)} 늘었어요. 장사가 잘되고 있다는 신호예요.`,
      detail: `이익 성장률(전년 동기) ${fmtPct(m.earningsGrowth)}${ok(m.revenueGrowth) ? `, 매출 성장률 ${fmtPct(m.revenueGrowth)}` : ''}.`,
      term: 'growth',
      weight: Math.min(m.earningsGrowth, 100) / 20 + 1.5,
    });
  } else if (ok(m.revenueGrowth) && m.revenueGrowth > 10) {
    r.push({
      tone: 'good',
      title: '매출 성장',
      easy: `물건(서비스)이 1년 전보다 ${fmtPct(m.revenueGrowth, 0, false)} 더 많이 팔리고 있어요.`,
      detail: `매출 성장률(전년 동기) ${fmtPct(m.revenueGrowth)}.`,
      term: 'growth',
      weight: m.revenueGrowth / 15 + 1,
    });
  }
  if (ok(m.roe) && m.roe >= 15) {
    r.push({
      tone: 'good',
      title: '돈을 잘 버는 회사',
      easy:
        m.roe > 60
          ? '주주 돈에 비해 이익이 아주 커요. 다만 자사주를 많이 사들여 자기자본이 작아진 탓에 숫자가 크게 보이는 면도 있어요.'
          : `주주 돈 100원으로 1년에 약 ${m.roe.toFixed(0)}원을 벌어요. 돈 버는 실력이 좋은 편이에요.`,
      detail: `ROE ${m.roe.toFixed(1)}%${ok(m.opMargin) ? `, 영업이익률 ${m.opMargin.toFixed(1)}%` : ''}.`,
      term: 'roe',
      weight: Math.min(m.roe, 50) / 10 + 1,
    });
  }
  const up = G.upside(m);
  if (ok(up) && up > 15) {
    r.push({
      tone: 'info',
      title: '분석가 목표가와 거리',
      easy: `증권사 분석가들이 본 적정 가격이 지금보다 ${fmtPct(up, 0, false)} 높아요. (자주 틀리니 참고만 하세요)`,
      detail: `평균 목표가 ${fmtPrice(m.targetPrice!, cur)} (분석가 ${m.analystCount}명), 괴리율 ${fmtPct(up)}.`,
      term: 'target',
      weight: 1,
    });
  }

  // 주의할 점
  if (ok(m.rsi14) && m.rsi14 >= 70) {
    r.push({
      tone: 'warn',
      title: '단기 과열',
      easy: '최근 짧은 기간에 많이 올라서 잠깐 쉬어가거나 떨어질 수 있어요. 한 번에 다 사기보다 나눠서 사는 게 좋아요.',
      detail: `RSI(14) ${m.rsi14.toFixed(0)} — 70 이상은 과매수 구간.${ok(m.ret1m) ? ` 1개월 ${fmtPct(m.ret1m)}.` : ''}`,
      term: 'rsi',
      weight: 3,
    });
  }
  if (ok(m.per) && m.per > 40) {
    r.push({
      tone: 'warn',
      title: '비싼 가격',
      easy: `주가가 이익의 ${m.per.toFixed(0)}배나 돼요. 앞으로 크게 성장해야 지금 가격이 정당화돼요.`,
      detail: `PER ${m.per.toFixed(1)}배${ok(m.fwdPer) ? ` (선행 ${m.fwdPer.toFixed(1)}배)` : ''}.`,
      term: 'per',
      weight: 2,
    });
  }
  if (ok(m.per) && m.per < 0) {
    r.push({
      tone: 'warn',
      title: '현재 적자',
      easy: '최근 1년 동안 돈을 벌지 못하고 손해를 봤어요. 회복 기대만으로 오르는 주가는 위험할 수 있어요.',
      detail: `PER 음수 (순손실)${ok(m.profitMargin) ? `, 순이익률 ${m.profitMargin.toFixed(1)}%` : ''}.`,
      term: 'margin',
      weight: 3,
    });
  }
  if (ok(m.vol) && m.vol > 45) {
    r.push({
      tone: 'warn',
      title: '크게 출렁임',
      easy: '주가가 오르내리는 폭이 매우 커요. 단기간에 손실이 커질 수 있으니 비중을 작게 가져가세요.',
      detail: `연 변동성 ${m.vol.toFixed(0)}%, 1년 최대 낙폭 ${fmtPct(m.mdd)}.`,
      term: 'vol',
      weight: 2,
    });
  }
  if (!m.aboveMa200 && ((ok(m.ret6m) && m.ret6m < -10) || !m.aboveMa50)) {
    r.push({
      tone: 'warn',
      title: '아직 하락 추세',
      easy: '장기 평균 가격보다 아래에 있어요. 싸 보여도 더 떨어질 수 있으니 반등을 확인하고 들어가는 게 안전해요.',
      detail: `200일선 하회${m.aboveMa50 ? '' : ', 50일선 하회'}, 6개월 ${fmtPct(m.ret6m)}.`,
      term: 'ma',
      weight: 2,
    });
  }
  return r;
}

function stableReasons(s: Stock): Reason[] {
  const m = s.metrics;
  const r: Reason[] = [];
  if (ok(m.vol) && m.vol < 25) {
    r.push({
      tone: 'good',
      title: '주가가 얌전함',
      easy: `1년 동안 주가가 크게 출렁이지 않았어요. 오래 들고 있어도 마음이 편한 편이에요.`,
      detail: `연 변동성 ${m.vol.toFixed(1)}%${ok(m.beta) ? `, 베타 ${m.beta.toFixed(2)}` : ''}.`,
      term: 'vol',
      weight: (25 - m.vol) / 3 + 2,
    });
  }
  if (ok(m.beta) && m.beta < 0.7) {
    r.push({
      tone: 'good',
      title: '시장이 흔들려도 덜 흔들림',
      easy:
        m.beta < 0.3
          ? '최근 1년 동안 시장 전체가 오르내릴 때도 거의 따로 움직였어요. 시장이 급락할 때 함께 크게 빠질 위험이 적은 편이에요.'
          : `시장 전체가 10% 움직일 때 이 종목은 약 ${(m.beta * 10).toFixed(0)}% 정도만 움직였어요.`,
      detail: `베타 ${m.beta.toFixed(2)}.`,
      term: 'beta',
      weight: (1 - m.beta) * 4 + 1,
    });
  }
  if (ok(m.mdd) && m.mdd > -15) {
    r.push({
      tone: 'good',
      title: '하락장에서도 잘 버팀',
      easy: `최근 1년 중 가장 많이 떨어졌을 때도 ${fmtPct(-m.mdd, 0, false)} 정도였어요.`,
      detail: `1년 최대 낙폭 ${fmtPct(m.mdd)}.`,
      term: 'mdd',
      weight: (15 + m.mdd) / 3 + 1.5,
    });
  }
  if (ok(m.divYield) && m.divYield >= 2.5) {
    const sustain = ok(m.payout) && m.payout > 0 && m.payout <= 75;
    r.push({
      tone: 'good',
      title: '배당을 잘 줌',
      easy: `가지고만 있어도 1년에 주가의 약 ${m.divYield.toFixed(1)}%를 배당으로 받아요. 100만 원어치면 약 ${Math.round(m.divYield * 10000).toLocaleString('ko-KR')}원(세전)이에요.${sustain ? ' 번 돈에 비해 무리하지 않는 수준이라 꾸준히 줄 가능성이 높아요.' : ''}`,
      detail: `배당수익률 ${m.divYield.toFixed(2)}%${ok(m.payout) ? `, 배당성향 ${m.payout.toFixed(0)}%` : ''}.`,
      term: 'div',
      weight: Math.min(m.divYield, 8) + (sustain ? 1 : 0),
    });
  }
  if (ok(m.roe) && m.roe >= 12 && ok(m.profitMargin) && m.profitMargin > 8) {
    r.push({
      tone: 'good',
      title: '꾸준히 돈을 버는 회사',
      easy: `매출 100원당 약 ${m.profitMargin.toFixed(0)}원이 남고, 주주 돈으로도 이익을 잘 내요.`,
      detail: `순이익률 ${m.profitMargin.toFixed(1)}%, ROE ${m.roe.toFixed(1)}%.`,
      term: 'roe',
      weight: 2 + m.roe / 15,
    });
  }
  if (!isFinancial(s) && ok(m.debtToEquity) && m.debtToEquity < 60) {
    r.push({
      tone: 'good',
      title: '빚이 적음',
      easy: '자기 돈에 비해 빚이 적어서 경기가 나빠져도 버틸 힘이 있어요.',
      detail: `부채비율(D/E) ${m.debtToEquity.toFixed(0)}%${ok(m.currentRatio) ? `, 유동비율 ${m.currentRatio.toFixed(2)}배` : ''}.`,
      term: 'debt',
      weight: 1.5,
    });
  }
  if (ok(m.marketCap) && ((s.market === 'KR' && m.marketCap > 3e13) || (s.market === 'US' && m.marketCap > 2e11))) {
    r.push({
      tone: 'info',
      title: '덩치가 큰 대표 기업',
      easy: '시장에서 손꼽히는 큰 회사라 거래가 활발하고, 갑자기 사라질 위험이 낮아요.',
      detail: `시가총액 ${fmtCapShort(m.marketCap, s.currency)}.`,
      weight: 1,
    });
  }

  // 주의할 점
  if (ok(m.payout) && m.payout > 100) {
    r.push({
      tone: 'warn',
      title: '배당이 이익보다 많음',
      easy: '번 돈보다 배당을 더 많이 주고 있어요. 이익이 늘지 않으면 배당이 줄어들 수 있어요.',
      detail: `배당성향 ${m.payout.toFixed(0)}%.`,
      term: 'payout',
      weight: 3,
    });
  }
  if (ok(m.profitMargin) && m.profitMargin < 0) {
    r.push({
      tone: 'warn',
      title: '적자',
      easy: '최근 손해를 보고 있어요. 안정성 측면에선 조심해야 해요.',
      detail: `순이익률 ${m.profitMargin.toFixed(1)}%.`,
      term: 'margin',
      weight: 3,
    });
  }
  if (!isFinancial(s) && ok(m.debtToEquity) && m.debtToEquity > 200) {
    r.push({
      tone: 'warn',
      title: '빚이 많은 편',
      easy: '자기 돈에 비해 빚이 많아요. 금리가 오르면 이자 부담이 커질 수 있어요.',
      detail: `부채비율(D/E) ${m.debtToEquity.toFixed(0)}%.`,
      term: 'debt',
      weight: 2,
    });
  }
  if (ok(m.ret1y) && m.ret1y < -15) {
    r.push({
      tone: 'warn',
      title: '1년 동안 많이 내림',
      easy: `최근 1년 동안 주가가 ${fmtPct(-m.ret1y, 0, false)} 내렸어요. 안정적인 종목이라도 회사 상황을 한 번 확인해 보세요.`,
      detail: `1년 수익률 ${fmtPct(m.ret1y)}.`,
      weight: 2,
    });
  }
  if (isFinancial(s)) {
    r.push({
      tone: 'info',
      title: '금융 업종 참고',
      easy: '은행·보험 같은 금융회사는 원래 빚(예금 등)이 많은 구조라 부채비율은 점수에서 뺐어요.',
      detail: '금융업은 부채비율 평가 제외, ROE·배당·변동성 위주로 평가.',
      term: 'debt',
      weight: 0.5,
    });
  }
  return r;
}

function studentReasons(s: Stock): Reason[] {
  const m = s.metrics;
  const r: Reason[] = [];
  if (s.market === 'KR') {
    if (m.price <= 100000) {
      r.push({
        tone: 'good',
        title: '용돈으로도 시작 가능',
        easy: `1주가 약 ${fmtPrice(m.price, s.currency)}이라 적은 돈으로도 한 주씩 모아갈 수 있어요.`,
        detail: `현재가 ${fmtPrice(m.price, s.currency)}.`,
        weight: (100000 - m.price) / 25000 + 2,
      });
    }
  } else {
    r.push({
      tone: 'info',
      title: '소수점으로 조금씩',
      easy: `1주는 ${fmtPrice(m.price, s.currency)}이지만, 국내 증권사 앱의 소수점 투자로 몇천 원어치씩도 살 수 있어요.`,
      detail: `현재가 ${fmtPrice(m.price, s.currency)}. 소수점 거래 지원 여부는 증권사마다 달라요.`,
      weight: 1.5,
    });
  }
  if (ok(m.vol) && m.vol < 30) {
    r.push({
      tone: 'good',
      title: '크게 출렁이지 않음',
      easy: '1년 동안 주가가 비교적 얌전했어요. 처음 투자할 때 마음 졸일 일이 적은 편이에요.',
      detail: `연 변동성 ${m.vol.toFixed(1)}%, 1년 최대 낙폭 ${fmtPct(m.mdd)}.`,
      term: 'vol',
      weight: (30 - m.vol) / 4 + 2,
    });
  }
  if (ok(m.marketCap) && ((s.market === 'KR' && m.marketCap > 2e13) || (s.market === 'US' && m.marketCap > 1.5e11))) {
    r.push({
      tone: 'good',
      title: '누구나 아는 큰 회사',
      easy: '이름만 들어도 아는 큰 회사라 뉴스로 회사 소식을 따라가기 쉬워요. 공부하면서 투자하기 좋아요.',
      detail: `시가총액 ${fmtCapShort(m.marketCap, s.currency)}.`,
      weight: 2,
    });
  }
  if (ok(m.profitMargin) && m.profitMargin > 8 && ok(m.roe) && m.roe > 10) {
    r.push({
      tone: 'good',
      title: '돈을 꾸준히 버는 회사',
      easy: `매출 100원당 약 ${m.profitMargin.toFixed(0)}원이 남는, 이익을 잘 내는 회사예요.`,
      detail: `순이익률 ${m.profitMargin.toFixed(1)}%, ROE ${m.roe.toFixed(1)}%.`,
      term: 'roe',
      weight: 2 + m.roe / 20,
    });
  }
  if (ok(m.divYield) && m.divYield >= 2) {
    r.push({
      tone: 'good',
      title: '배당으로 받는 용돈',
      easy: `들고만 있어도 1년에 주가의 약 ${m.divYield.toFixed(1)}%를 배당으로 받아요. 10만 원어치면 약 ${Math.round(m.divYield * 1000).toLocaleString('ko-KR')}원(세전)이에요.`,
      detail: `배당수익률 ${m.divYield.toFixed(2)}%${ok(m.payout) ? `, 배당성향 ${m.payout.toFixed(0)}%` : ''}.`,
      term: 'div',
      weight: Math.min(m.divYield, 6) / 2 + 1,
    });
  }

  // 주의할 점
  if (s.market === 'KR' && m.price > 300000) {
    r.push({
      tone: 'warn',
      title: '1주 가격이 비쌈',
      easy: `1주가 ${fmtPrice(m.price, s.currency)}이라 용돈으로 모으기엔 부담될 수 있어요.`,
      detail: `현재가 ${fmtPrice(m.price, s.currency)}.`,
      weight: 2,
    });
  }
  if (ok(m.vol) && m.vol > 45) {
    r.push({
      tone: 'warn',
      title: '크게 출렁임',
      easy: '주가가 오르내리는 폭이 커서 처음 투자하기엔 마음고생할 수 있어요. 산다면 아주 조금만 사세요.',
      detail: `연 변동성 ${m.vol.toFixed(0)}%, 1년 최대 낙폭 ${fmtPct(m.mdd)}.`,
      term: 'vol',
      weight: 3,
    });
  }
  if (ok(m.profitMargin) && m.profitMargin < 0) {
    r.push({
      tone: 'warn',
      title: '현재 적자',
      easy: '최근 손해를 보고 있는 회사예요. 처음 투자하는 종목으로는 조심하세요.',
      detail: `순이익률 ${m.profitMargin.toFixed(1)}%.`,
      term: 'margin',
      weight: 3,
    });
  }
  if (ok(m.ret1y) && m.ret1y < -15) {
    r.push({
      tone: 'warn',
      title: '1년 동안 많이 내림',
      easy: `최근 1년 동안 주가가 ${fmtPct(-m.ret1y, 0, false)} 내렸어요. 왜 내렸는지 뉴스를 먼저 찾아보세요.`,
      detail: `1년 수익률 ${fmtPct(m.ret1y)}.`,
      weight: 2,
    });
  }
  return r;
}

function fmtCapShort(v: number, currency: string) {
  if (currency === 'KRW') return v >= 1e12 ? `${(v / 1e12).toFixed(1)}조 원` : `${Math.round(v / 1e8).toLocaleString('ko-KR')}억 원`;
  return v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : `$${(v / 1e9).toFixed(0)}B`;
}

function pickReasons(all: Reason[]): Reason[] {
  const goods = all.filter((r) => r.tone !== 'warn').sort((a, b) => b.weight - a.weight);
  const warns = all.filter((r) => r.tone === 'warn').sort((a, b) => b.weight - a.weight);
  return [...goods.slice(0, 4), ...warns.slice(0, 3)];
}

function makeSummary(kind: RecommendationKind, score: number, reasons: Reason[]): string {
  const goods = reasons.filter((r) => r.tone === 'good').map((r) => r.title);
  const warn = reasons.find((r) => r.tone === 'warn');
  const q = (t: string) => `‘${t}’`;
  const head =
    goods.length > 0
      ? `장점은 ${goods.slice(0, 2).map(q).join(', ')}이에요.`
      : '눈에 띄는 장점은 없지만 여러 지표가 고르게 무난해요.';
  const verdict =
    score >= 75
      ? `${kind === 'buyNow' ? '지금' : kind === 'student' ? '처음 투자하는 학생에게' : '오래 들고 가기에'} 눈여겨볼 만해요.`
      : score >= 60
        ? '관심 가져볼 만해요.'
        : '다른 후보와 비교해 보세요.';
  const tail = warn ? ` 다만 ${q(warn.title)}은 조심하세요.` : '';
  return `${head} 종합하면 ${verdict}${tail}`;
}

export function scoreMarket(stocks: Stock[], kind: RecommendationKind): Scored[] {
  const ctx = makeCtx(stocks);
  return stocks
    .map((stock) => {
      const res =
        kind === 'buyNow' ? scoreBuyNow(stock, ctx) : kind === 'student' ? scoreStudent(stock, ctx) : scoreStable(stock, ctx);
      const reasons = pickReasons(
        kind === 'buyNow' ? buyNowReasons(stock) : kind === 'student' ? studentReasons(stock) : stableReasons(stock),
      );
      return {
        stock,
        kind,
        score: res.score,
        subs: res.subs,
        coverage: res.coverage,
        reasons,
        summary: makeSummary(kind, res.score, reasons),
      };
    })
    .sort((a, b) => b.score - a.score);
}
