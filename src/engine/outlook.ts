import { Crowd, NewsItem, Outlook, Stock } from '../data/types';
import { ok } from './factors';

/** 애널리스트 의견을 한국어로 */
export function consensusLabel(o: Outlook | null | undefined): { label: string; tone: 'up' | 'flat' | 'down' } | null {
  if (!o) return null;
  const m = o.recMean;
  if (ok(m)) {
    if (m <= 1.6) return { label: '적극 매수', tone: 'up' };
    if (m <= 2.4) return { label: '매수', tone: 'up' };
    if (m <= 3.3) return { label: '중립 (보유)', tone: 'flat' };
    if (m <= 4.1) return { label: '매도', tone: 'down' };
    return { label: '적극 매도', tone: 'down' };
  }
  const map: Record<string, { label: string; tone: 'up' | 'flat' | 'down' }> = {
    strong_buy: { label: '적극 매수', tone: 'up' },
    buy: { label: '매수', tone: 'up' },
    hold: { label: '중립 (보유)', tone: 'flat' },
    underperform: { label: '비중 축소', tone: 'down' },
    sell: { label: '매도', tone: 'down' },
  };
  return o.recKey ? (map[o.recKey] ?? null) : null;
}

export function voteTotal(o: Outlook | null | undefined) {
  const v = o?.votes;
  return v ? v.strongBuy + v.buy + v.hold + v.sell + v.strongSell : 0;
}

/** 매수 의견 비율 0~100 */
export function buyShare(o: Outlook | null | undefined): number | null {
  const v = o?.votes;
  const t = voteTotal(o);
  return v && t > 0 ? ((v.strongBuy + v.buy) / t) * 100 : null;
}

export function targetUpside(s: Stock): number | null {
  const t = s.outlook?.targetMean ?? s.metrics.targetPrice;
  return ok(t) && t > 0 ? (t / s.metrics.price - 1) * 100 : null;
}

const ACTION: Record<string, string> = {
  up: '상향',
  down: '하향',
  main: '유지',
  reit: '유지',
  init: '신규',
};

const GRADE: Record<string, string> = {
  'Strong Buy': '적극 매수',
  Buy: '매수',
  Outperform: '시장 상회',
  Overweight: '비중 확대',
  'Sector Outperform': '업종 상회',
  'Market Outperform': '시장 상회',
  Positive: '긍정적',
  Accumulate: '매집',
  Hold: '보유',
  Neutral: '중립',
  'Equal-Weight': '시장 비중',
  'Equal Weight': '시장 비중',
  'Market Perform': '시장 수준',
  'Sector Perform': '업종 수준',
  'Sector Weight': '업종 비중',
  'Peer Perform': '동종 수준',
  'In-Line': '시장 수준',
  Underperform: '시장 하회',
  Underweight: '비중 축소',
  Reduce: '비중 축소',
  Sell: '매도',
  'Strong Sell': '적극 매도',
};

export const actionKo = (a: string) => ACTION[a] ?? a;
export const gradeKo = (g: string | null) => (g ? (GRADE[g] ?? g) : null);

/** 투자자 반응 요약 */
export function crowdMood(cr: Crowd | null | undefined) {
  if (!cr || cr.posts === 0) return null;
  const voted = cr.bull + cr.bear;
  if (voted < 3) return { bullPct: null as number | null, label: '의견이 갈리지 않을 만큼 글이 적어요', tone: 'flat' as const };
  const bullPct = (cr.bull / voted) * 100;
  if (bullPct >= 70) return { bullPct, label: '대부분 오를 거라고 봐요', tone: 'up' as const };
  if (bullPct >= 55) return { bullPct, label: '오를 거라는 쪽이 조금 많아요', tone: 'up' as const };
  if (bullPct > 45) return { bullPct, label: '반반으로 갈려 있어요', tone: 'flat' as const };
  if (bullPct > 30) return { bullPct, label: '내릴 거라는 쪽이 조금 많아요', tone: 'down' as const };
  return { bullPct, label: '대부분 내릴 거라고 봐요', tone: 'down' as const };
}

/** 뉴스 제목 분위기 */
export function newsMood(news: NewsItem[] | undefined) {
  if (!news || news.length === 0) return null;
  const pos = news.filter((n) => n.tone > 0).length;
  const neg = news.filter((n) => n.tone < 0).length;
  const label = pos > neg + 1 ? '좋은 소식이 많아요' : neg > pos + 1 ? '걱정스러운 소식이 많아요' : '좋은 소식과 나쁜 소식이 섞여 있어요';
  return { pos, neg, neutral: news.length - pos - neg, label };
}

export function timeAgo(t: number | null) {
  if (!t) return '';
  const s = Date.now() / 1000 - t;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}분 전`;
  if (s < 86400) return `${Math.round(s / 3600)}시간 전`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}일 전`;
  const d = new Date(t * 1000);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}
