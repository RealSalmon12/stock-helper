import { Stock } from '../data/types';
import { FACTORS, ok, Rated, upside } from './factors';
import { fmtCap, fmtNum, fmtPct, fmtPrice } from './format';
import { TermKey } from './glossary';

/** 종목 상세 화면에 보여줄 "좋은 점 / 조심할 점" 문장 */
export interface Point {
  good: boolean;
  title: string;
  /** 쉬운 말 */
  easy: string;
  /** 숫자를 곁들인 말 (고수 모드) */
  detail: string;
  term?: TermKey;
  weight: number;
}

export function points(s: Stock): Point[] {
  const m = s.metrics;
  const p: Point[] = [];
  const add = (x: Point) => p.push(x);

  // ----- 흐름 -----
  if (ok(m.ret6m) && m.ret6m > 10 && m.aboveMa200) {
    add({
      good: true,
      title: '꾸준히 오르는 중',
      easy: `6개월 동안 ${fmtPct(m.ret6m, 0, false)} 올랐고, 장기 평균 가격보다 위에 있어요.`,
      detail: `6개월 ${fmtPct(m.ret6m)} · 1년 ${fmtPct(m.ret1y)} · 200일선 위${m.aboveMa50 ? ' · 50일선 위' : ''}`,
      term: 'momentum',
      weight: 2 + Math.min(m.ret6m, 60) / 12,
    });
  } else if (ok(m.ret3m) && m.ret3m > 5 && m.aboveMa50) {
    add({
      good: true,
      title: '다시 힘을 받는 중',
      easy: `최근 3개월 동안 ${fmtPct(m.ret3m, 0, false)} 오르며 반등하고 있어요.`,
      detail: `3개월 ${fmtPct(m.ret3m)} · 50일선 위 · 200일선 ${m.aboveMa200 ? '위' : '아래'}`,
      term: 'ma',
      weight: 1.5 + m.ret3m / 12,
    });
  }
  if (!m.aboveMa200 && !m.aboveMa50) {
    add({
      good: false,
      title: '아직 내리는 흐름이에요',
      easy: '단기·장기 평균 가격보다 모두 아래에 있어요. 싸 보여도 더 떨어질 수 있으니 반등을 확인하고 사는 게 안전해요.',
      detail: `50일선·200일선 모두 아래 · 6개월 ${fmtPct(m.ret6m)}`,
      term: 'ma',
      weight: 2.5,
    });
  }
  if (ok(m.rsi14) && m.rsi14 >= 70) {
    add({
      good: false,
      title: '단기간에 많이 올랐어요',
      easy: '짧은 기간에 빠르게 올라서 잠깐 쉬어갈 수 있어요. 한 번에 사기보다 나눠서 사는 게 좋아요.',
      detail: `RSI ${m.rsi14.toFixed(0)} (70 이상은 과열 구간) · 1개월 ${fmtPct(m.ret1m)}`,
      term: 'rsi',
      weight: 3,
    });
  } else if (ok(m.rsi14) && m.rsi14 <= 30) {
    add({
      good: false,
      title: '최근 많이 빠졌어요',
      easy: '짧은 기간에 많이 떨어졌어요. 이유가 있는 하락인지 뉴스를 꼭 확인해 보세요.',
      detail: `RSI ${m.rsi14.toFixed(0)} (30 이하는 과매도 구간) · 1개월 ${fmtPct(m.ret1m)}`,
      term: 'rsi',
      weight: 2,
    });
  }

  // ----- 가치 -----
  if (ok(m.per) && m.per > 0 && m.per < 12) {
    add({
      good: true,
      title: '버는 돈에 비해 싸요',
      easy: `주가가 1년 이익의 약 ${m.per.toFixed(0)}배예요. 지금 버는 돈에 비하면 비싸지 않은 편이에요.`,
      detail: `PER ${m.per.toFixed(1)}배${ok(m.fwdPer) ? ` · 선행 PER ${m.fwdPer.toFixed(1)}배` : ''}${ok(m.pbr) ? ` · PBR ${m.pbr.toFixed(2)}배` : ''}`,
      term: 'per',
      weight: 2 + (12 - m.per) / 3,
    });
  } else if (ok(m.pbr) && m.pbr > 0 && m.pbr < 0.8) {
    add({
      good: true,
      title: '가진 재산보다 싸요',
      easy: `회사가 가진 재산의 약 ${(m.pbr * 100).toFixed(0)}% 가격에 거래되고 있어요.`,
      detail: `PBR ${m.pbr.toFixed(2)}배${ok(m.roe) ? ` · ROE ${m.roe.toFixed(1)}%` : ''}`,
      term: 'pbr',
      weight: 1.5 + (1 - m.pbr) * 3,
    });
  }
  if (ok(m.per) && m.per > 40) {
    add({
      good: false,
      title: '가격이 비싼 편이에요',
      easy: `주가가 1년 이익의 ${m.per.toFixed(0)}배예요. 앞으로 크게 성장해야 지금 가격이 설명돼요.`,
      detail: `PER ${m.per.toFixed(1)}배${ok(m.fwdPer) ? ` · 선행 PER ${m.fwdPer.toFixed(1)}배` : ''}`,
      term: 'per',
      weight: 2,
    });
  }
  const up = upside(m);
  if (ok(up) && up > 15) {
    add({
      good: true,
      title: '전문가 눈높이가 더 높아요',
      easy: `증권사 분석가들이 본 적정 가격이 지금보다 ${fmtPct(up, 0, false)} 높아요. 자주 틀리니 참고만 하세요.`,
      detail: `평균 목표가 ${fmtPrice(m.targetPrice!, s.currency)} · 분석가 ${m.analystCount}명 · 여유 ${fmtPct(up)}`,
      term: 'target',
      weight: 1,
    });
  }

  // ----- 실적 -----
  if (ok(m.per) && m.per < 0) {
    add({
      good: false,
      title: '지금은 적자예요',
      easy: '최근 1년 동안 돈을 벌지 못하고 손해를 봤어요. 회복 기대만으로 오르는 주가는 위험할 수 있어요.',
      detail: `순손실${ok(m.profitMargin) ? ` · 순이익률 ${m.profitMargin.toFixed(1)}%` : ''}`,
      term: 'margin',
      weight: 3,
    });
  }
  if (ok(m.earningsGrowth) && m.earningsGrowth > 15) {
    add({
      good: true,
      title: '이익이 빠르게 늘어요',
      easy:
        m.earningsGrowth > 200
          ? '이익이 1년 전보다 몇 배로 늘었어요. 작년 이익이 유난히 적었던 영향도 있어서 이 속도가 계속되긴 어려워요.'
          : `이익이 1년 전보다 ${fmtPct(m.earningsGrowth, 0, false)} 늘었어요. 장사가 잘되고 있어요.`,
      detail: `이익 성장 ${fmtPct(m.earningsGrowth)}${ok(m.revenueGrowth) ? ` · 매출 성장 ${fmtPct(m.revenueGrowth)}` : ''}`,
      term: 'growth',
      weight: 1.5 + Math.min(m.earningsGrowth, 100) / 25,
    });
  } else if (ok(m.revenueGrowth) && m.revenueGrowth > 10) {
    add({
      good: true,
      title: '더 많이 팔고 있어요',
      easy: `1년 전보다 매출이 ${fmtPct(m.revenueGrowth, 0, false)} 늘었어요.`,
      detail: `매출 성장 ${fmtPct(m.revenueGrowth)}`,
      term: 'growth',
      weight: 1 + m.revenueGrowth / 20,
    });
  } else if (ok(m.earningsGrowth) && m.earningsGrowth < -20) {
    add({
      good: false,
      title: '이익이 줄고 있어요',
      easy: `이익이 1년 전보다 ${fmtPct(-m.earningsGrowth, 0, false)} 줄었어요. 실적이 다시 좋아지는지 지켜봐야 해요.`,
      detail: `이익 성장 ${fmtPct(m.earningsGrowth)}${ok(m.revenueGrowth) ? ` · 매출 성장 ${fmtPct(m.revenueGrowth)}` : ''}`,
      term: 'growth',
      weight: 2,
    });
  }
  if (ok(m.roe) && m.roe >= 15) {
    add({
      good: true,
      title: '돈 버는 실력이 좋아요',
      easy:
        m.roe > 60
          ? '주주 돈에 비해 이익이 아주 커요. 자사주를 많이 사서 숫자가 커 보이는 면도 있어요.'
          : `주주 돈 100원으로 1년에 약 ${m.roe.toFixed(0)}원을 벌어요.`,
      detail: `ROE ${m.roe.toFixed(1)}%${ok(m.opMargin) ? ` · 영업이익률 ${m.opMargin.toFixed(1)}%` : ''}`,
      term: 'roe',
      weight: 1 + Math.min(m.roe, 50) / 12,
    });
  }

  // ----- 안정 -----
  if (ok(m.vol) && m.vol < 25) {
    add({
      good: true,
      title: '주가가 얌전해요',
      easy: '1년 동안 크게 출렁이지 않았어요. 오래 들고 있어도 마음이 편한 편이에요.',
      detail: `연 변동성 ${m.vol.toFixed(0)}%${ok(m.beta) ? ` · 베타 ${m.beta.toFixed(2)}` : ''}`,
      term: 'vol',
      weight: 1.5 + (25 - m.vol) / 8,
    });
  } else if (ok(m.vol) && m.vol > 45) {
    add({
      good: false,
      title: '롤러코스터 같아요',
      easy: '주가가 오르내리는 폭이 아주 커요. 짧은 기간에 손실이 커질 수 있으니 조금만 담는 게 좋아요.',
      detail: `연 변동성 ${m.vol.toFixed(0)}% · 1년 최대 낙폭 ${fmtPct(m.mdd)}`,
      term: 'vol',
      weight: 2 + (m.vol - 45) / 20,
    });
  }
  if (ok(m.mdd) && m.mdd < -40 && !(ok(m.vol) && m.vol > 45)) {
    add({
      good: false,
      title: '크게 빠진 적이 있어요',
      easy: `최근 1년 사이 고점에서 ${fmtPct(-m.mdd, 0, false)}까지 떨어진 적이 있어요.`,
      detail: `1년 최대 낙폭 ${fmtPct(m.mdd)}`,
      term: 'mdd',
      weight: 1.5,
    });
  }
  if (ok(m.debtToEquity) && m.debtToEquity > 200 && !['은행', '금융', '보험', '지주/보험'].includes(s.sector)) {
    add({
      good: false,
      title: '빚이 많은 편이에요',
      easy: '자기 돈보다 빚이 두 배 넘게 많아요. 금리가 오르거나 장사가 안 되면 부담이 커져요.',
      detail: `부채비율 ${m.debtToEquity.toFixed(0)}%`,
      term: 'debt',
      weight: 1.5,
    });
  }

  // ----- 배당 -----
  if (ok(m.divYield) && m.divYield >= 3) {
    const warn = ok(m.payout) && m.payout > 100;
    add({
      good: !warn,
      title: warn ? '배당이 무리일 수 있어요' : '배당이 넉넉해요',
      easy: warn
        ? `배당은 ${m.divYield.toFixed(1)}%로 높지만 번 돈보다 많이 나눠주고 있어서 앞으로 줄어들 수 있어요.`
        : `100만 원어치를 갖고 있으면 1년에 약 ${Math.round(m.divYield * 10000).toLocaleString('ko-KR')}원(세전)을 받아요.`,
      detail: `배당수익률 ${m.divYield.toFixed(2)}%${ok(m.payout) ? ` · 배당성향 ${m.payout.toFixed(0)}%` : ''}`,
      term: warn ? 'payout' : 'div',
      weight: 1.5 + m.divYield / 3,
    });
  }

  return p.sort((a, b) => b.weight - a.weight);
}

/** 한 줄 요약: 가장 강한 과목 + 가장 큰 주의점 */
export function oneLiner(r: Rated, pts: Point[]): string {
  const sorted = [...FACTORS].sort((a, b) => r.f[b.key] - r.f[a.key]);
  const best = sorted[0];
  // 배당은 안 주는 게 흠은 아니라서 아쉬운 점으로는 꼽지 않아요
  const worst = sorted.filter((x) => x.key !== 'div').pop()!;
  const bestText: Record<string, string> = {
    trend: '요즘 오르는 힘이 좋은 종목이에요.',
    value: '버는 돈에 비해 가격이 싼 종목이에요.',
    earn: '돈을 잘 벌고 잘 크는 회사예요.',
    safe: '주가가 얌전하고 튼튼한 회사예요.',
    div: '배당을 넉넉히 주는 회사예요.',
  };
  const weakText: Record<string, string> = {
    trend: '최근 흐름은 약해요.',
    value: '가격은 비싼 편이에요.',
    earn: '실적은 아쉬워요.',
    safe: '흔들림은 큰 편이에요.',
    div: '배당은 거의 없어요.',
  };
  const head = r.f[best.key] >= 65 ? bestText[best.key] : '크게 튀는 점 없이 무난한 종목이에요.';
  const warn = pts.find((x) => !x.good);
  if (warn) return `${head} 다만 ${warn.title}.`;
  if (r.f[worst.key] < 35) return `${head} 다만 ${weakText[worst.key]}`;
  return `${head} 다섯 과목이 고른 편이에요.`;
}

export type Judge = 'good' | 'soso' | 'bad' | 'none';

export interface KeyStat {
  label: string;
  value: string;
  judge: Judge;
  term?: TermKey;
  /** 초보용 한 줄 해석 */
  plain: string;
}

/** 초보 모드 핵심 지표 6개 */
export function keyStats(s: Stock): KeyStat[] {
  const m = s.metrics;
  const j = (cond: boolean | null, bad: boolean | null): Judge => (cond == null ? 'none' : cond ? 'good' : bad ? 'bad' : 'soso');
  return [
    {
      label: 'PER',
      value: ok(m.per) ? (m.per < 0 ? '적자' : `${m.per.toFixed(1)}배`) : '-',
      judge: ok(m.per) ? j(m.per > 0 && m.per < 15, m.per < 0 || m.per > 35) : 'none',
      term: 'per',
      plain: ok(m.per)
        ? m.per < 0
          ? '손해를 보고 있어요'
          : m.per < 15
            ? '이익에 비해 싼 편'
            : m.per > 35
              ? '이익에 비해 비싼 편'
              : '보통 수준'
        : '정보 없음',
    },
    {
      label: 'ROE',
      value: fmtNum(m.roe, 1, '%'),
      judge: ok(m.roe) ? j(m.roe >= 12, m.roe < 5) : 'none',
      term: 'roe',
      plain: ok(m.roe) ? (m.roe >= 12 ? '돈을 잘 벌어요' : m.roe < 5 ? '버는 힘이 약해요' : '보통 수준') : '정보 없음',
    },
    {
      label: '변동성',
      value: fmtNum(m.vol, 0, '%'),
      judge: ok(m.vol) ? j(m.vol < 25, m.vol > 45) : 'none',
      term: 'vol',
      plain: ok(m.vol) ? (m.vol < 25 ? '얌전해요' : m.vol > 45 ? '크게 출렁여요' : '보통이에요') : '정보 없음',
    },
    {
      label: '최대 낙폭',
      value: fmtPct(m.mdd, 0),
      judge: ok(m.mdd) ? j(m.mdd > -20, m.mdd < -40) : 'none',
      term: 'mdd',
      plain: ok(m.mdd) ? (m.mdd > -20 ? '잘 버텼어요' : m.mdd < -40 ? '크게 빠졌었어요' : '보통이에요') : '정보 없음',
    },
    {
      label: '배당수익률',
      value: ok(m.divYield) && m.divYield > 0 ? `${m.divYield.toFixed(2)}%` : '없음',
      judge: ok(m.divYield) ? j(m.divYield >= 2.5, m.divYield < 0.5) : 'bad',
      term: 'div',
      plain:
        ok(m.divYield) && m.divYield > 0
          ? m.divYield >= 2.5
            ? '넉넉해요'
            : m.divYield < 0.5
              ? '아주 적어요'
              : '조금 줘요'
          : '배당이 없어요',
    },
    {
      label: '시가총액',
      value: fmtCap(m.marketCap, s.currency),
      judge: 'none',
      plain: '회사 전체의 몸값',
    },
  ];
}

export interface StatRow {
  group: string;
  rows: { label: string; value: string; term?: TermKey }[];
}

/** 고수 모드 전체 지표 표 */
export function allStats(s: Stock): StatRow[] {
  const m = s.metrics;
  const c = s.currency;
  const n = (v: number | null | undefined, d = 1, suf = '') => fmtNum(v, d, suf);
  return [
    {
      group: '가격 흐름',
      rows: [
        { label: '1개월', value: fmtPct(m.ret1m) },
        { label: '3개월', value: fmtPct(m.ret3m), term: 'momentum' },
        { label: '6개월', value: fmtPct(m.ret6m) },
        { label: '1년', value: fmtPct(m.ret1y) },
        { label: '50일선', value: ok(m.ma50) ? `${fmtPrice(m.ma50, c)} (${m.aboveMa50 ? '위' : '아래'})` : '-', term: 'ma' },
        { label: '200일선', value: ok(m.ma200) ? `${fmtPrice(m.ma200, c)} (${m.aboveMa200 ? '위' : '아래'})` : '-', term: 'ma' },
        { label: 'RSI(14)', value: n(m.rsi14, 0), term: 'rsi' },
      ],
    },
    {
      group: '가치',
      rows: [
        { label: 'PER', value: n(m.per, 1, '배'), term: 'per' },
        { label: '선행 PER', value: n(m.fwdPer, 1, '배'), term: 'per' },
        { label: 'PBR', value: n(m.pbr, 2, '배'), term: 'pbr' },
        { label: 'PEG', value: n(m.peg, 2), term: 'peg' },
        {
          label: '평균 목표가',
          value: ok(m.targetPrice) ? `${fmtPrice(m.targetPrice, c)}${ok(m.analystCount) ? ` (${m.analystCount}명)` : ''}` : '-',
          term: 'target',
        },
      ],
    },
    {
      group: '실적',
      rows: [
        { label: 'ROE', value: n(m.roe, 1, '%'), term: 'roe' },
        { label: '순이익률', value: n(m.profitMargin, 1, '%'), term: 'margin' },
        { label: '영업이익률', value: n(m.opMargin, 1, '%') },
        { label: '매출 성장', value: fmtPct(m.revenueGrowth), term: 'growth' },
        { label: '이익 성장', value: fmtPct(m.earningsGrowth), term: 'growth' },
      ],
    },
    {
      group: '안정',
      rows: [
        { label: '연 변동성', value: n(m.vol, 1, '%'), term: 'vol' },
        { label: '베타', value: n(m.beta, 2), term: 'beta' },
        { label: '1년 최대 낙폭', value: fmtPct(m.mdd), term: 'mdd' },
        { label: '부채비율', value: n(m.debtToEquity, 0, '%'), term: 'debt' },
        { label: '유동비율', value: n(m.currentRatio, 2, '배') },
        { label: '시가총액', value: fmtCap(m.marketCap, c) },
      ],
    },
    {
      group: '배당',
      rows: [
        { label: '배당수익률', value: n(m.divYield, 2, '%'), term: 'div' },
        { label: '배당성향', value: n(m.payout, 0, '%'), term: 'payout' },
      ],
    },
  ];
}
