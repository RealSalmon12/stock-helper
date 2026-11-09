import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.box, compact && styles.compact]}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>
        이 앱의 정보는 투자 조언이 아닌 <Text style={styles.bold}>참고용 정보</Text>입니다. 점수는 공개된 숫자를 정해진 규칙으로
        계산한 것이라 미래 주가를 보장하지 않아요. 투자 판단과 그 결과의 책임은 본인에게 있습니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.warnBg,
    borderRadius: radius.md,
    padding: 12,
  },
  compact: { padding: 10 },
  icon: { fontSize: 13, lineHeight: 18 },
  text: { flex: 1, color: colors.warnText, fontSize: 12, lineHeight: 18 },
  bold: { fontWeight: '800' },
});
