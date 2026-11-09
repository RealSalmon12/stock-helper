import { StyleSheet, Text, View } from 'react-native';
import { Mode, Stock } from '../data/types';
import { colors, radius, shadow } from '../theme';
import { TermChip } from './Terms';

/** 시장 분위기: 후보 종목 중 몇 개가 장기 상승 흐름(200일선 위)인지 */
export function MarketMood({ stocks, mode }: { stocks: Stock[]; mode: Mode }) {
  const n = stocks.length;
  if (n === 0) return null;
  const up = stocks.filter((s) => s.metrics.aboveMa200).length;
  const ratio = up / n;
  const avg3m = stocks.reduce((a, s) => a + (s.metrics.ret3m ?? 0), 0) / n;
  const hot = stocks.filter((s) => (s.metrics.rsi14 ?? 0) >= 70).length;

  const [emoji, title, desc] =
    ratio >= 0.65
      ? ['☀️', '맑음', '대부분 종목이 오르는 흐름이에요. 다만 많이 오른 종목은 나눠서 사는 게 좋아요.']
      : ratio >= 0.4
        ? ['⛅', '구름 조금', '오르는 종목과 내리는 종목이 섞여 있어요. 종목을 고를 때 더 꼼꼼히 보세요.']
        : ['🌧️', '흐림', '내리는 종목이 더 많아요. 서두르지 말고 안정적인 종목 위주로 살펴보세요.'];

  return (
    <View style={[styles.card, shadow]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>오늘의 시장 분위기</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
        {mode === 'expert' ? (
          <Text style={styles.stats}>
            200일선 위 {up}/{n} · 평균 3개월 {avg3m >= 0 ? '+' : ''}
            {avg3m.toFixed(1)}% · RSI 70+ {hot}종목
          </Text>
        ) : (
          <View style={styles.beginnerStats}>
            <Text style={styles.stats}>
              후보 {n}개 중 {up}개가 오르는 흐름
            </Text>
            <TermChip term="ma" label="기준?" />
          </View>
        )}
        <View style={styles.bar}>
          <View style={[styles.barUp, { flex: up }]} />
          <View style={[styles.barDown, { flex: n - up }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
  },
  emoji: { fontSize: 34 },
  kicker: { fontSize: 12, color: colors.faint, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 1 },
  desc: { fontSize: 13, color: colors.sub, lineHeight: 19, marginTop: 4 },
  beginnerStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stats: { fontSize: 12, color: colors.text, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  bar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.line },
  barUp: { backgroundColor: colors.up },
  barDown: { backgroundColor: colors.down, opacity: 0.5 },
});
