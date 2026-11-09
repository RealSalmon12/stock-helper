import { StyleSheet, Text, View } from 'react-native';
import { RecommendationKind } from '../data/types';
import { accent, colors, font } from '../theme';

/**
 * 점수 표시: 선생님이 공책에 점수를 적고 형광펜으로 칠한 모양.
 * 형광펜 길이는 점수에 비례하고, 색은 추천 종류(지금 사기/안정적/학생용)를 따릅니다.
 */
export function ScoreRing({
  score,
  size = 52,
  label = '점',
  kind = 'buyNow',
}: {
  score: number;
  size?: number;
  label?: string;
  kind?: RecommendationKind;
}) {
  const w = size * 1.35;
  const fill = Math.max(0.25, score / 100);
  return (
    <View style={{ width: w, height: size, justifyContent: 'center' }} accessibilityLabel={`${score}점`}>
      <View
        style={[
          styles.hl,
          {
            backgroundColor: accent[kind].hl,
            width: w * fill,
            height: size * 0.46,
            top: size * 0.44,
          },
        ]}
      />
      <View style={styles.row}>
        <Text style={[styles.num, { fontSize: size * 1.05, lineHeight: size * 1.1 }]}>{score}</Text>
        {size >= 40 && <Text style={[styles.unit, { fontSize: size * 0.42 }]}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hl: { position: 'absolute', left: 0, borderRadius: 3, transform: [{ rotate: '-2.5deg' }], opacity: 0.9 },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 1 },
  num: { fontFamily: font.pen, color: colors.text },
  unit: { fontFamily: font.pen, color: colors.sub },
});
