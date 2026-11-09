import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { LoadState } from '../data/useMarketData';
import { Market, Mode } from '../data/types';
import { fmtDate } from '../logic/format';
import { colors, radius, font } from '../theme';

interface Props {
  mode: Mode;
  onMode: (m: Mode) => void;
  market: Market;
  onMarket: (m: Market) => void;
  updatedAt: string;
  loadState: LoadState;
  onRefresh: () => void;
}

export function Header({ mode, onMode, market, onMarket, updatedAt, loadState, onRefresh }: Props) {
  return (
    <View style={styles.wrap}>
      {/* 모눈 노트 배경 */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id="grid" width={18} height={18} patternUnits="userSpaceOnUse">
            <Path d="M 18 0 L 0 0 0 18" fill="none" stroke={colors.grid} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>

      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>주식 도우미</Text>
          <Text style={styles.sub}>초보부터 고수까지, 쉬운 말로 보는 종목 추천</Text>
        </View>
        <ModeToggle value={mode} onChange={onMode} />
      </View>

      <Pressable onPress={onRefresh} style={styles.updated} accessibilityRole="button" accessibilityLabel="데이터 새로고침">
        <View style={[styles.dot, { backgroundColor: loadState === 'offline' ? '#E0A100' : colors.good }]} />
        <Text style={styles.updatedText}>
          {loadState === 'loading'
            ? '최신 데이터 확인 중…'
            : `${fmtDate(updatedAt)} 기준 시세${loadState === 'offline' ? ' (저장된 데이터)' : ''}`}
        </Text>
        <Text style={styles.refresh}>↻</Text>
      </Pressable>

      <View style={styles.tabs} accessibilityRole="tablist">
        {(['KR', 'US'] as Market[]).map((m) => {
          const active = m === market;
          return (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onMarket(m)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{m === 'KR' ? '한국장' : '미국장'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ModeToggle({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <View style={styles.mode}>
      {(
        [
          ['beginner', '초보'],
          ['expert', '고수'],
        ] as [Mode, string][]
      ).map(([k, label]) => {
        const active = k === value;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            style={[styles.modeBtn, active && styles.modeBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    paddingTop: 22,
    paddingHorizontal: 20,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: colors.text, fontSize: 30, lineHeight: 38, fontFamily: font.bold, letterSpacing: -0.8 },
  sub: { color: colors.sub, fontSize: 13, fontFamily: font.regular, marginTop: 2 },
  mode: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  modeBtnActive: { backgroundColor: colors.text },
  modeText: { color: colors.text, fontFamily: font.bold, fontSize: 13 },
  modeTextActive: { color: '#fff' },
  updated: { flexDirection: 'row', alignItems: 'center', marginTop: 14, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  updatedText: { color: colors.sub, fontSize: 12, fontFamily: font.regular },
  refresh: { color: colors.sub, fontSize: 13, fontFamily: font.regular, marginLeft: 6 },
  tabs: { flexDirection: 'row', marginTop: 18, gap: 24 },
  tab: { paddingTop: 6, paddingBottom: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.text },
  tabText: { color: colors.faint, fontSize: 18, fontFamily: font.bold },
  tabTextActive: { color: colors.text },
});
