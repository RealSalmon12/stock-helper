import { InvestorType } from '../data/prefs';
import { CollectionId } from './collections';

export const INVESTOR: Record<InvestorType, { emoji: string; name: string; desc: string; list: CollectionId }> = {
  safe: {
    emoji: '🐢',
    name: '안정 추구형',
    desc: '크게 버는 것보다 잃지 않는 게 더 중요해요. 덜 흔들리고 튼튼한 회사가 잘 맞아요.',
    list: 'stable',
  },
  balance: {
    emoji: '⚖️',
    name: '균형형',
    desc: '적당히 오르면서 너무 비싸지 않은 종목을 골라요. 흐름과 가격을 함께 보는 게 잘 맞아요.',
    list: 'buy',
  },
  growth: {
    emoji: '🚀',
    name: '성장 추구형',
    desc: '흔들림을 견딜 수 있다면 빠르게 크는 회사에서 큰 수익을 노려요. 대신 비중 조절이 꼭 필요해요.',
    list: 'growth',
  },
  income: {
    emoji: '💰',
    name: '배당 수집형',
    desc: '주가보다 꼬박꼬박 들어오는 돈이 좋아요. 배당을 넉넉히, 무리 없이 주는 회사가 잘 맞아요.',
    list: 'dividend',
  },
};

export interface Question {
  q: string;
  a: { text: string; score: Partial<Record<InvestorType, number>> }[];
}

export const QUESTIONS: Question[] = [
  {
    q: '주식으로 가장 하고 싶은 건 뭐예요?',
    a: [
      { text: '은행 이자보다 조금 더 벌고 싶어요', score: { safe: 2, income: 1 } },
      { text: '꾸준히 받는 용돈(배당)이 좋아요', score: { income: 3 } },
      { text: '적당히 오르는 종목을 고르고 싶어요', score: { balance: 2 } },
      { text: '크게 오를 종목을 찾고 싶어요', score: { growth: 3 } },
    ],
  },
  {
    q: '산 주식이 한 달 만에 20% 떨어졌어요. 어떻게 할까요?',
    a: [
      { text: '너무 무서워서 바로 팔래요', score: { safe: 3 } },
      { text: '불안하지만 일단 기다려 볼래요', score: { safe: 1, balance: 1, income: 1 } },
      { text: '회사에 문제가 없으면 그대로 둘래요', score: { balance: 2, income: 1 } },
      { text: '싸졌으니 더 살래요', score: { growth: 2, balance: 1 } },
    ],
  },
  {
    q: '이 돈은 얼마나 묵혀 둘 수 있어요?',
    a: [
      { text: '1년 안에 쓸 수도 있어요', score: { safe: 3 } },
      { text: '1~3년 정도요', score: { balance: 2, safe: 1 } },
      { text: '3년 넘게 그냥 둘 수 있어요', score: { growth: 2, income: 2 } },
    ],
  },
  {
    q: '두 종목 중 하나를 고른다면?',
    a: [
      { text: '1년에 5% 오르고 거의 안 흔들리는 종목', score: { safe: 2, income: 1 } },
      { text: '1년에 4% 배당을 꼬박꼬박 주는 종목', score: { income: 3 } },
      { text: '15% 오를 수도, 10% 빠질 수도 있는 종목', score: { balance: 2 } },
      { text: '50% 오를 수도, 30% 빠질 수도 있는 종목', score: { growth: 3 } },
    ],
  },
];

export function judgeInvestor(answers: number[]): InvestorType {
  const total: Record<InvestorType, number> = { safe: 0, balance: 0, growth: 0, income: 0 };
  answers.forEach((ai, qi) => {
    const sc = QUESTIONS[qi]?.a[ai]?.score ?? {};
    for (const [k, v] of Object.entries(sc)) total[k as InvestorType] += v ?? 0;
  });
  // 동점이면 더 보수적인 쪽으로
  const order: InvestorType[] = ['safe', 'income', 'balance', 'growth'];
  return order.reduce((best, k) => (total[k] > total[best] ? k : best), order[0]);
}
