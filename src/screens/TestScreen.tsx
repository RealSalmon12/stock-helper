import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { InvestorType, usePrefs } from '../data/prefs';
import { collectionById } from '../engine/collections';
import { INVESTOR, judgeInvestor, QUESTIONS } from '../engine/investor';
import { useData, useNav } from '../nav/context';
import { BackBar } from '../ui/Bars';
import { Card, T, Tap } from '../ui/kit';
import { StockRow } from '../ui/StockRow';
import { c } from '../ui/theme';

/** 4문제 투자 성향 테스트 */
export function TestScreen() {
  const nav = useNav();
  const { set, market } = usePrefs();
  const { boards } = useData();
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<InvestorType | null>(null);
  const step = answers.length;

  const choose = (i: number) => {
    const next = [...answers, i];
    if (next.length === QUESTIONS.length) {
      const t = judgeInvestor(next);
      setResult(t);
      set({ investor: t });
    }
    setAnswers(next);
  };

  if (result) {
    const inv = INVESTOR[result];
    const col = collectionById(inv.list);
    return (
      <View style={{ flex: 1 }}>
        <BackBar onBack={nav.back} title="투자 성향 결과" />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
            <T size={56} style={{ lineHeight: 70 }}>
              {inv.emoji}
            </T>
            <T size={14} color={c.faint} style={{ marginTop: 8 }}>
              나의 투자 성향은
            </T>
            <T size={26} w="bold">
              {inv.name}
            </T>
            <T size={15} color={c.sub} style={{ marginTop: 10, textAlign: 'center' }}>
              {inv.desc}
            </T>
          </Card>
          <Card pad={16}>
            <T size={17} w="bold" style={{ marginBottom: 2 }}>
              {col.emoji} 이런 종목이 잘 맞아요
            </T>
            <T size={13} color={c.faint} style={{ marginBottom: 4 }}>
              {market === 'KR' ? '국내' : '해외'} {col.title} 종목 TOP 5
            </T>
            {boards[market].lists[inv.list].slice(0, 5).map((p) => (
              <StockRow key={p.rated.stock.code} stock={p.rated.stock} rank={p.rank} score={p.score} right="score" />
            ))}
          </Card>
          <Tap
            onPress={() => {
              setAnswers([]);
              setResult(null);
            }}
            style={{ alignItems: 'center', padding: 12 }}
          >
            <T size={14} w="semibold" color={c.faint}>
              테스트 다시 하기
            </T>
          </Tap>
        </ScrollView>
      </View>
    );
  }

  const q = QUESTIONS[step];
  return (
    <View style={{ flex: 1, backgroundColor: c.card }}>
      <BackBar onBack={step > 0 ? () => setAnswers(answers.slice(0, -1)) : nav.back} />
      <View style={{ height: 4, backgroundColor: c.soft, marginHorizontal: 20, borderRadius: 2 }}>
        <View style={{ width: `${(step / QUESTIONS.length) * 100}%`, height: '100%', backgroundColor: c.blue, borderRadius: 2 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28 }}>
        <T size={14} w="semibold" color={c.blue}>
          질문 {step + 1} / {QUESTIONS.length}
        </T>
        <T size={24} w="bold" style={{ marginTop: 6, marginBottom: 28 }}>
          {q.q}
        </T>
        <View style={{ gap: 10 }}>
          {q.a.map((a, i) => (
            <Tap
              key={a.text}
              onPress={() => choose(i)}
              style={{ backgroundColor: c.soft, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 18 }}
            >
              <T size={16} w="semibold">
                {a.text}
              </T>
            </Tap>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
