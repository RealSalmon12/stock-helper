import { Stock, StockMetrics, TermKey } from '../data/types';
import { fmtCap, fmtNum, fmtPct, fmtPrice } from './format';

export type Judge = 'good' | 'normal' | 'bad' | 'none';

export interface MetricDef {
  key: string;
  label: string;
  group: '가격 흐름' | '가치(싸고 비싼지)' | '수익성·성장' | '안정성' | '배당';
  term?: TermKey;
  value: (m: StockMetrics, s: Stock) => string;
  /** 초보 모드에서 보여줄 판정 */
  judge?: (m: StockMetrics, s: Stock) => Judge;
  /** 초보용 한 줄 해석 */
  plain?: (m: StockMetrics, s: Stock) => string | null;
}

const ok = (v: number | null | undefined): v is number => v != null && Number.isFinite(v);
const FIN = ['은행', '금융', '보험', '지주/보험'];

export const METRICS: MetricDef[] = [
  {
    key: 'ret3m',
    label: '3개월 수익률',
    group: '가격 흐름',
    term: 'momentum',
    value: (m) => fmtPct(m.ret3m),
    judge: (m) => (!ok(m.ret3m) ? 'none' : m.ret3m > 5 ? 'good' : m.ret3m < -10 ? 'bad' : 'normal'),
  },
  { key: 'ret6m', label: '6개월 수익률', group: '가격 흐름', term: 'momentum', value: (m) => fmtPct(m.ret6m) },
  {
    key: 'ret1y',
    label: '1년 수익률',
    group: '가격 흐름',
    term: 'momentum',
    value: (m) => fmtPct(m.ret1y),
    judge: (m) => (!ok(m.ret1y) ? 'none' : m.ret1y > 10 ? 'good' : m.ret1y < -15 ? 'bad' : 'normal'),
  },
  {
    key: 'trend',
    label: '추세 (50일/200일선)',
    group: '가격 흐름',
    term: 'ma',
    value: (m) => `${m.aboveMa50 ? '위' : '아래'} / ${m.aboveMa200 ? '위' : '아래'}`,
    judge: (m) => (m.aboveMa50 && m.aboveMa200 ? 'good' : !m.aboveMa50 && !m.aboveMa200 ? 'bad' : 'normal'),
    plain: (m) =>
      m.aboveMa50 && m.aboveMa200
        ? '단기·장기 모두 오르는 흐름'
        : !m.aboveMa50 && !m.aboveMa200
          ? '단기·장기 모두 내리는 흐름'
          : m.aboveMa200
            ? '장기로는 오름, 최근 잠시 쉬는 중'
            : '최근 반등, 장기 흐름은 아직 약함',
  },
  {
    key: 'rsi',
    label: 'RSI(14)',
    group: '가격 흐름',
    term: 'rsi',
    value: (m) => fmtNum(m.rsi14, 0),
    judge: (m) => (!ok(m.rsi14) ? 'none' : m.rsi14 >= 70 ? 'bad' : m.rsi14 <= 30 ? 'normal' : 'good'),
    plain: (m) =>
      !ok(m.rsi14) ? null : m.rsi14 >= 70 ? '단기간 많이 올라 과열' : m.rsi14 <= 30 ? '단기간 많이 빠진 상태' : '과열도 침체도 아님',
  },
  {
    key: 'fromHigh',
    label: '52주 최고가 대비',
    group: '가격 흐름',
    value: (m) => fmtPct(m.fromHigh),
    plain: (m) => (ok(m.fromHigh) ? `1년 중 가장 비쌌을 때보다 ${Math.abs(m.fromHigh).toFixed(0)}% ${m.fromHigh < 0 ? '낮아요' : '높아요'}` : null),
  },
  {
    key: 'per',
    label: 'PER',
    group: '가치(싸고 비싼지)',
    term: 'per',
    value: (m) => (ok(m.per) ? (m.per < 0 ? '적자' : `${m.per.toFixed(1)}배`) : '-'),
    judge: (m) => (!ok(m.per) ? 'none' : m.per < 0 ? 'bad' : m.per < 12 ? 'good' : m.per > 35 ? 'bad' : 'normal'),
    plain: (m) =>
      !ok(m.per) ? null : m.per < 0 ? '최근 적자라 계산 불가' : m.per < 12 ? '이익에 비해 싼 편' : m.per > 35 ? '이익에 비해 비싼 편' : '보통 수준',
  },
  { key: 'fwdPer', label: '선행 PER', group: '가치(싸고 비싼지)', term: 'per', value: (m) => fmtNum(m.fwdPer, 1, '배') },
  {
    key: 'pbr',
    label: 'PBR',
    group: '가치(싸고 비싼지)',
    term: 'pbr',
    value: (m) => fmtNum(m.pbr, 2, '배'),
    judge: (m) => (!ok(m.pbr) || m.pbr <= 0 ? 'none' : m.pbr < 1 ? 'good' : m.pbr > 5 ? 'bad' : 'normal'),
    plain: (m) => (!ok(m.pbr) || m.pbr <= 0 ? null : m.pbr < 1 ? '회사 재산보다 싸게 거래 중' : m.pbr > 5 ? '재산에 비해 높은 가격' : '보통 수준'),
  },
  { key: 'peg', label: 'PEG', group: '가치(싸고 비싼지)', term: 'peg', value: (m) => fmtNum(m.peg, 2) },
  {
    key: 'target',
    label: '분석가 목표가',
    group: '가치(싸고 비싼지)',
    term: 'target',
    value: (m, s) =>
      ok(m.targetPrice) ? `${fmtPrice(m.targetPrice, s.currency)} (${fmtPct((m.targetPrice / m.price - 1) * 100, 0)})` : '-',
  },
  {
    key: 'roe',
    label: 'ROE',
    group: '수익성·성장',
    term: 'roe',
    value: (m) => fmtNum(m.roe, 1, '%'),
    judge: (m) => (!ok(m.roe) ? 'none' : m.roe >= 15 ? 'good' : m.roe < 5 ? 'bad' : 'normal'),
    plain: (m) => (!ok(m.roe) ? null : m.roe >= 15 ? '돈을 아주 잘 버는 편' : m.roe < 5 ? '돈 버는 힘이 약한 편' : '보통 수준'),
  },
  {
    key: 'margin',
    label: '순이익률',
    group: '수익성·성장',
    term: 'margin',
    value: (m) => fmtNum(m.profitMargin, 1, '%'),
    judge: (m) => (!ok(m.profitMargin) ? 'none' : m.profitMargin >= 10 ? 'good' : m.profitMargin < 0 ? 'bad' : 'normal'),
  },
  { key: 'opMargin', label: '영업이익률', group: '수익성·성장', term: 'margin', value: (m) => fmtNum(m.opMargin, 1, '%') },
  {
    key: 'eg',
    label: '이익 성장률',
    group: '수익성·성장',
    term: 'growth',
    value: (m) => fmtPct(m.earningsGrowth, 0),
    judge: (m) => (!ok(m.earningsGrowth) ? 'none' : m.earningsGrowth > 10 ? 'good' : m.earningsGrowth < -10 ? 'bad' : 'normal'),
  },
  { key: 'rg', label: '매출 성장률', group: '수익성·성장', term: 'growth', value: (m) => fmtPct(m.revenueGrowth, 0) },
  {
    key: 'vol',
    label: '변동성(연)',
    group: '안정성',
    term: 'vol',
    value: (m) => fmtNum(m.vol, 0, '%'),
    judge: (m) => (!ok(m.vol) ? 'none' : m.vol < 25 ? 'good' : m.vol > 45 ? 'bad' : 'normal'),
    plain: (m) => (!ok(m.vol) ? null : m.vol < 25 ? '얌전한 편' : m.vol > 45 ? '크게 출렁이는 편' : '보통 수준'),
  },
  {
    key: 'beta',
    label: '베타',
    group: '안정성',
    term: 'beta',
    value: (m) => fmtNum(m.beta, 2),
    judge: (m) => (!ok(m.beta) ? 'none' : m.beta < 0.8 ? 'good' : m.beta > 1.3 ? 'bad' : 'normal'),
  },
  {
    key: 'mdd',
    label: '1년 최대 낙폭',
    group: '안정성',
    term: 'mdd',
    value: (m) => fmtPct(m.mdd, 0),
    judge: (m) => (!ok(m.mdd) ? 'none' : m.mdd > -15 ? 'good' : m.mdd < -35 ? 'bad' : 'normal'),
    plain: (m) => (ok(m.mdd) ? `1년 중 가장 많이 빠졌을 때 ${Math.abs(m.mdd).toFixed(0)}% 하락` : null),
  },
  {
    key: 'debt',
    label: '부채비율(D/E)',
    group: '안정성',
    term: 'debt',
    value: (m, s) => (FIN.includes(s.sector) ? '금융업 제외' : fmtNum(m.debtToEquity, 0, '%')),
    judge: (m, s) =>
      FIN.includes(s.sector) || !ok(m.debtToEquity) ? 'none' : m.debtToEquity < 60 ? 'good' : m.debtToEquity > 200 ? 'bad' : 'normal',
  },
  { key: 'cap', label: '시가총액', group: '안정성', value: (m, s) => fmtCap(m.marketCap, s.currency) },
  {
    key: 'div',
    label: '배당수익률',
    group: '배당',
    term: 'div',
    value: (m) => fmtNum(m.divYield, 2, '%'),
    judge: (m) => (!ok(m.divYield) ? 'none' : m.divYield >= 3 ? 'good' : m.divYield < 1 ? 'normal' : 'normal'),
    plain: (m) =>
      ok(m.divYield) && m.divYield > 0
        ? `100만 원어치면 1년에 약 ${Math.round(m.divYield * 10000).toLocaleString('ko-KR')}원`
        : '배당이 없거나 아주 적어요',
  },
  {
    key: 'payout',
    label: '배당성향',
    group: '배당',
    term: 'payout',
    value: (m) => fmtNum(m.payout, 0, '%'),
    judge: (m) => (!ok(m.payout) || m.payout === 0 ? 'none' : m.payout > 100 ? 'bad' : m.payout <= 70 ? 'good' : 'normal'),
  },
];

/** 초보 모드에서 보여줄 핵심 지표 */
export const BEGINNER_KEYS = ['trend', 'per', 'pbr', 'roe', 'vol', 'mdd', 'div', 'rsi'];
