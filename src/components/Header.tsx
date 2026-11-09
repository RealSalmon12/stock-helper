import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { LoadState } from '../data/useMarketData';
import { Market, Mode } from '../data/types';
import { fmtDate } from '../logic/format';
import { colors, radius } from '../theme';

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
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="hdr" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.navy} />
            <Stop offset="1" stopColor={colors.navy2} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hdr)" />
        <Circle cx="92%" cy="8%" r="90" fill="#3B5BFD" opacity={0.25} />
        <Circle cx="78%" cy="96%" r="60" fill="#F0562E" opacity={0.12} />
      </Svg>

      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>주식 도우미</Text>
          <Text style={styles.sub}>초보부터 고수까지, 쉬운 말로 보는 종목 추천</Text>
        </View>
        <ModeToggle value={mode} onChange={onMode} />
      </View>

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
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {m === 'KR' ? '🇰🇷 한국장' : '🇺🇸 미국장'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={onRefresh} style={styles.updated} accessibilityRole="button" accessibilityLabel="데이터 새로고침">
        <View style={[styles.dot, { backgroundColor: loadState === 'offline' ? '#F5A524' : '#3DDC97' }]} />
        <Text style={styles.updatedText}>
          {loadState === 'loading'
            ? '최신 데이터 확인 중…'
            : `${fmtDate(updatedAt)} 기준 시세${loadState === 'offline' ? ' (저장된 데이터)' : ''}`}
        </Text>
        <Text style={styles.refresh}>↻</Text>
      </Pressable>
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
    borderRadius: radius.lg + 4,
    overflow: 'hidden',
    padding: 20,
    paddingBottom: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 4 },
  mode: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, padding: 3 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill },
  modeBtnActive: { backgroundColor: '#fff' },
  modeText: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 13 },
  modeTextActive: { color: colors.navy },
  tabs: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 11, borderRadius: radius.md - 4, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: 'rgba(255,255,255,0.78)', fontSize: 15, fontWeight: '700' },
  tabTextActive: { color: colors.navy },
  updated: { flexDirection: 'row', alignItems: 'center', marginTop: 14, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  updatedText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  refresh: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginLeft: 6 },
});
