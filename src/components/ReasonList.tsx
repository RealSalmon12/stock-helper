import { StyleSheet, Text, View } from 'react-native';
import { Mode, Reason } from '../data/types';
import { colors, radius } from '../theme';
import { TermChip } from './Terms';

const TONE = {
  good: { icon: '👍', bg: colors.goodSoft, fg: colors.good, label: '좋은 점' },
  info: { icon: '💡', bg: colors.infoSoft, fg: colors.info, label: '참고' },
  warn: { icon: '⚠️', bg: colors.warnSoft, fg: colors.warn, label: '주의' },
} as const;

export function ReasonList({ reasons, mode, limit }: { reasons: Reason[]; mode: Mode; limit?: number }) {
  const list = limit ? reasons.slice(0, limit) : reasons;
  if (list.length === 0) {
    return <Text style={styles.empty}>눈에 띄는 특징은 없지만 여러 지표가 고르게 무난해요.</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {list.map((r, i) => {
        const t = TONE[r.tone];
        return (
          <View key={i} style={[styles.row, { backgroundColor: t.bg }]}>
            <Text style={styles.icon}>{t.icon}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: t.fg }]}>{r.title}</Text>
                {r.term && <TermChip term={r.term} />}
              </View>
              <Text style={styles.body}>{mode === 'beginner' ? r.easy : r.detail}</Text>
              {mode === 'expert' && <Text style={styles.easySub}>{r.easy}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md },
  icon: { fontSize: 15, lineHeight: 21 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  title: { fontSize: 14, fontWeight: '800' },
  body: { fontSize: 14, color: colors.text, lineHeight: 21, marginTop: 3 },
  easySub: { fontSize: 12, color: colors.sub, lineHeight: 18, marginTop: 4 },
  empty: { fontSize: 14, color: colors.sub },
});
