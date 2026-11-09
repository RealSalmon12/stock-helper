import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Scored } from '../data/types';
import { fmtPct, fmtPrice } from '../logic/format';
import { accent, changeColor, colors, radius, scoreLabel, shadow } from '../theme';
import { ScoreRing } from './ScoreRing';
import { Sparkline } from './Sparkline';

/** 초보 모드 카드: 한 줄 요약 + 핵심 이유 2개 */
export function StockCard({ item, rank, onPress }: { item: Scored; rank: number; onPress: () => void }) {
  const { stock, score, summary, reasons, kind } = item;
  const m = stock.metrics;
  const a = accent[kind];
  const goods = reasons.filter((r) => r.tone !== 'warn').slice(0, 2);
  const warn = reasons.find((r) => r.tone === 'warn');
  const trendColor = changeColor(m.ret3m);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadow, pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 }]}
      accessibilityRole="button"
      accessibilityLabel={`${stock.name}, 추천 점수 ${score}점. 자세히 보기`}
    >
      <View style={styles.head}>
        <View style={[styles.rank, { backgroundColor: a.soft }]}>
          <Text style={[styles.rankText, { color: a.main }]}>{rank}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {stock.name}
            </Text>
            <Text style={styles.sector}>{stock.sector}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{fmtPrice(m.price, stock.currency)}</Text>
            <Text style={[styles.change, { color: changeColor(m.change1d) }]}>{fmtPct(m.change1d, 2)}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center' }}>
          <ScoreRing score={score} size={52} />
          <Text style={styles.scoreLabel}>{scoreLabel(score)}</Text>
        </View>
      </View>

      <View style={styles.sparkRow}>
        <Sparkline data={stock.spark} width={120} height={34} color={trendColor} />
        <View style={styles.sparkMeta}>
          <Text style={styles.sparkLabel}>최근 1년</Text>
          <Text style={[styles.sparkValue, { color: changeColor(m.ret1y) }]}>{fmtPct(m.ret1y, 0)}</Text>
        </View>
      </View>

      <Text style={styles.summary}>{summary}</Text>

      <View style={styles.tags}>
        {goods.map((r, i) => (
          <View key={i} style={[styles.tag, { backgroundColor: colors.goodSoft }]}>
            <Text style={[styles.tagText, { color: colors.good }]}>👍 {r.title}</Text>
          </View>
        ))}
        {warn && (
          <View style={[styles.tag, { backgroundColor: colors.warnSoft }]}>
            <Text style={[styles.tagText, { color: colors.warn }]}>⚠️ {warn.title}</Text>
          </View>
        )}
      </View>

      <Text style={styles.more}>자세히 보기 ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontWeight: '800', fontSize: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  name: { fontSize: 17, fontWeight: '800', color: colors.text, flexShrink: 1 },
  sector: { fontSize: 12, color: colors.faint },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  price: { fontSize: 14, color: colors.text, fontWeight: '600' },
  change: { fontSize: 13, fontWeight: '700' },
  scoreLabel: { fontSize: 11, color: colors.sub, marginTop: 3, fontWeight: '600' },
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 10,
    gap: 12,
  },
  sparkMeta: { flex: 1, alignItems: 'flex-end' },
  sparkLabel: { fontSize: 11, color: colors.faint },
  sparkValue: { fontSize: 16, fontWeight: '800' },
  summary: { fontSize: 14, color: colors.text, lineHeight: 21, marginTop: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  tagText: { fontSize: 12, fontWeight: '700' },
  more: { marginTop: 12, color: colors.primary, fontWeight: '700', fontSize: 13, textAlign: 'right' },
});
