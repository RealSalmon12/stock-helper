import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DetailSheet } from '../components/DetailSheet';
import { ExpertList } from '../components/ExpertList';
import { MarketMood } from '../components/MarketMood';
import { StockCard } from '../components/StockCard';
import { Market, Mode, RecommendationKind, Scored, Stock } from '../data/types';
import { scoreMarket } from '../logic/score';
import { accent, colors, radius, font } from '../theme';

const SECTIONS: { kind: RecommendationKind; desc: string; how: string }[] = [
  {
    kind: 'buyNow',
    desc: '최근 오르는 힘이 있으면서, 버는 돈에 비해 주가가 아직 비싸지 않은 종목',
    how: '오르는 힘 40% · 가격 매력 35% · 성장·수익성 25%',
  },
  {
    kind: 'stable',
    desc: '주가가 덜 흔들리고, 배당을 주며, 재무가 튼튼해서 오래 들고 가기 좋은 종목',
    how: '덜 흔들림 35% · 하락 방어 20% · 배당 20% · 재무 튼튼함 25%',
  },
  {
    kind: 'student',
    desc: '용돈 수준의 적은 돈으로 시작할 수 있고, 누구나 아는 회사라 공부하며 투자하기 좋은 종목',
    how: '덜 흔들림 30% · 소액으로 시작 20% · 잘 알려진 큰 회사 20% · 꾸준한 이익 20% · 배당 10%',
  },
];

interface Props {
  market: Market;
  mode: Mode;
  stocks: Stock[];
}

export function MarketScreen({ market, mode, stocks }: Props) {
  const universe = useMemo(() => stocks.filter((s) => s.market === market), [stocks, market]);
  const lists = useMemo(
    () => ({
      buyNow: scoreMarket(universe, 'buyNow'),
      stable: scoreMarket(universe, 'stable'),
      student: scoreMarket(universe, 'student'),
    }),
    [universe],
  );
  const [selected, setSelected] = useState<Scored | null>(null);
  const [expertKind, setExpertKind] = useState<RecommendationKind>('buyNow');
  const [expanded, setExpanded] = useState<Record<RecommendationKind, boolean>>({
    buyNow: false,
    stable: false,
    student: false,
  });

  const other = selected
    ? lists[selected.kind === 'stable' ? 'buyNow' : 'stable'].find((s) => s.stock.code === selected.stock.code) ?? null
    : null;

  return (
    <View style={{ gap: 16 }}>
      <MarketMood stocks={universe} mode={mode} />

      {mode === 'beginner' ? (
        SECTIONS.map((s) => {
          const a = accent[s.kind];
          const n = expanded[s.kind] ? 10 : 5;
          return (
            <View key={s.kind}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionTab, { backgroundColor: a.main }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{a.label}</Text>
                  <Text style={styles.desc}>{s.desc}</Text>
                </View>
              </View>
              {lists[s.kind].slice(0, n).map((item, i) => (
                <StockCard key={item.stock.code} item={item} rank={i + 1} onPress={() => setSelected(item)} />
              ))}
              <Pressable
                style={styles.moreBtn}
                onPress={() => setExpanded((e) => ({ ...e, [s.kind]: !e[s.kind] }))}
                accessibilityRole="button"
              >
                <Text style={styles.moreText}>{expanded[s.kind] ? '접기' : '5개 더 보기'}</Text>
              </Pressable>
            </View>
          );
        })
      ) : (
        <View>
          <Text style={styles.title}>전체 순위</Text>
          <Text style={styles.desc}>
            {market === 'KR' ? '한국' : '미국'} 대형주 {universe.length}종목 · 점수 구성:{' '}
            {SECTIONS.find((s) => s.kind === expertKind)?.how}
          </Text>
          <ExpertList lists={lists} kind={expertKind} onKind={setExpertKind} onOpen={setSelected} />
        </View>
      )}

      <DetailSheet item={selected} other={other} mode={mode} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12, marginTop: 18 },
  sectionTab: { width: 6, alignSelf: 'stretch', borderRadius: 2 },
  title: { fontSize: 20, fontFamily: font.bold, color: colors.text, letterSpacing: -0.3 },
  desc: { fontSize: 13, fontFamily: font.regular, color: colors.sub, marginTop: 2, lineHeight: 19 },
  moreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  moreText: { color: colors.primary, fontFamily: font.bold, fontSize: 14 },
});
