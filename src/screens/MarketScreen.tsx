import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DetailSheet } from '../components/DetailSheet';
import { ExpertList } from '../components/ExpertList';
import { MarketMood } from '../components/MarketMood';
import { StockCard } from '../components/StockCard';
import { Market, Mode, RecommendationKind, Scored, Stock } from '../data/types';
import { scoreMarket } from '../logic/score';
import { accent, colors, radius } from '../theme';

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
];

interface Props {
  market: Market;
  mode: Mode;
  stocks: Stock[];
}

export function MarketScreen({ market, mode, stocks }: Props) {
  const universe = useMemo(() => stocks.filter((s) => s.market === market), [stocks, market]);
  const lists = useMemo(
    () => ({ buyNow: scoreMarket(universe, 'buyNow'), stable: scoreMarket(universe, 'stable') }),
    [universe],
  );
  const [selected, setSelected] = useState<Scored | null>(null);
  const [expertKind, setExpertKind] = useState<RecommendationKind>('buyNow');
  const [expanded, setExpanded] = useState<Record<RecommendationKind, boolean>>({ buyNow: false, stable: false });

  const other = selected
    ? lists[selected.kind === 'buyNow' ? 'stable' : 'buyNow'].find((s) => s.stock.code === selected.stock.code) ?? null
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
                <View style={[styles.sectionIcon, { backgroundColor: a.soft }]}>
                  <Text style={{ fontSize: 18 }}>{a.icon}</Text>
                </View>
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
  sectionHead: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  desc: { fontSize: 13, color: colors.sub, marginTop: 2, lineHeight: 19 },
  moreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  moreText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
