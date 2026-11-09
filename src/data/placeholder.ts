import { Market, StockPick } from './types';

// 화면 뼈대 확인용 예시 데이터입니다. 실제 시세/추천 로직은 다음 단계에서 연결합니다.
const picks: StockPick[] = [
  { symbol: '000000', name: '예시 종목 A', market: 'KR', kind: 'buyNow', reason: '최근 실적이 좋아지고 있어요 (예시 문구)' },
  { symbol: '000001', name: '예시 종목 B', market: 'KR', kind: 'buyNow', reason: '주가가 평소보다 낮은 구간이에요 (예시 문구)' },
  { symbol: '000002', name: '예시 종목 C', market: 'KR', kind: 'stable', reason: '오랫동안 배당을 꾸준히 줬어요 (예시 문구)' },
  { symbol: '000003', name: '예시 종목 D', market: 'KR', kind: 'stable', reason: '주가 변동이 작은 편이에요 (예시 문구)' },
  { symbol: 'AAAA', name: 'Example Corp A', market: 'US', kind: 'buyNow', reason: '매출이 빠르게 늘고 있어요 (예시 문구)' },
  { symbol: 'BBBB', name: 'Example Corp B', market: 'US', kind: 'buyNow', reason: '최근 하락 후 반등 조짐이 있어요 (예시 문구)' },
  { symbol: 'CCCC', name: 'Example Corp C', market: 'US', kind: 'stable', reason: '빚이 적고 현금이 많아요 (예시 문구)' },
  { symbol: 'DDDD', name: 'Example Corp D', market: 'US', kind: 'stable', reason: '경기에 덜 흔들리는 업종이에요 (예시 문구)' },
];

export function getPicks(market: Market): StockPick[] {
  return picks.filter((p) => p.market === market);
}
