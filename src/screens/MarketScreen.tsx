import { StyleSheet, Text, View } from 'react-native';
import { StockCard } from '../components/StockCard';
import { getPicks } from '../data/placeholder';
import { Market, RecommendationKind } from '../data/types';
import { colors } from '../theme';

const SECTIONS: { kind: RecommendationKind; title: string; desc: string }[] = [
  { kind: 'buyNow', title: '지금 사기 좋은 종목', desc: '최근 흐름과 가치를 함께 봤을 때 관심 가져볼 만한 종목' },
  { kind: 'stable', title: '안정적인 종목', desc: '크게 흔들리지 않고 오래 들고 가기 좋은 종목' },
];

export function MarketScreen({ market }: { market: Market }) {
  const picks = getPicks(market);
  return (
    <View>
      {SECTIONS.map((s) => (
        <View key={s.kind} style={styles.section}>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.desc}>{s.desc}</Text>
          {picks
            .filter((p) => p.kind === s.kind)
            .map((p) => (
              <StockCard key={p.symbol} pick={p} />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  desc: { fontSize: 13, color: colors.sub, marginTop: 2, marginBottom: 10 },
});
