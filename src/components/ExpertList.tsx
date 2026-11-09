import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RecommendationKind, Scored } from '../data/types';
import { fmtNum, fmtPct, fmtPrice } from '../logic/format';
import { accent, changeColor, colors, radius, scoreColor, shadow } from '../theme';
import { Sparkline } from './Sparkline';

type SortKey = 'score' | 'div' | 'per' | 'vol' | 'ret6m' | 'roe';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'score', label: '점수순' },
  { key: 'ret6m', label: '6개월 수익률' },
  { key: 'per', label: 'PER 낮은순' },
  { key: 'div', label: '배당 높은순' },
  { key: 'vol', label: '변동성 낮은순' },
  { key: 'roe', label: 'ROE 높은순' },
];

type FilterKey = 'profit' | 'div2' | 'per20' | 'vol30' | 'uptrend' | 'notHot';
const FILTERS: { key: FilterKey; label: string; test: (s: Scored) => boolean }[] = [
  { key: 'profit', label: '흑자만', test: (s) => (s.stock.metrics.per ?? 1) > 0 && (s.stock.metrics.profitMargin ?? 1) > 0 },
  { key: 'uptrend', label: '200일선 위', test: (s) => !!s.stock.metrics.aboveMa200 },
  { key: 'notHot', label: '과열 제외(RSI<70)', test: (s) => (s.stock.metrics.rsi14 ?? 50) < 70 },
  { key: 'per20', label: 'PER ≤ 20', test: (s) => { const p = s.stock.metrics.per; return p != null && p > 0 && p <= 20; } },
  { key: 'div2', label: '배당 ≥ 2%', test: (s) => (s.stock.metrics.divYield ?? 0) >= 2 },
  { key: 'vol30', label: '변동성 ≤ 30%', test: (s) => (s.stock.metrics.vol ?? 99) <= 30 },
];

const sortVal = (s: Scored, k: SortKey): number => {
  const m = s.stock.metrics;
  switch (k) {
    case 'score':
      return s.score;
    case 'div':
      return m.divYield ?? -1;
    case 'per':
      return m.per != null && m.per > 0 ? -m.per : -1e9;
    case 'vol':
      return -(m.vol ?? 1e9);
    case 'ret6m':
      return m.ret6m ?? -1e9;
    case 'roe':
      return m.roe ?? -1e9;
  }
};

interface Props {
  lists: Record<RecommendationKind, Scored[]>;
  kind: RecommendationKind;
  onKind: (k: RecommendationKind) => void;
  onOpen: (s: Scored) => void;
}

export function ExpertList({ lists, kind, onKind, onOpen }: Props) {
  const [sort, setSort] = useState<SortKey>('score');
  const [filters, setFilters] = useState<FilterKey[]>([]);
  const toggle = (k: FilterKey) => setFilters((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));

  const rows = useMemo(() => {
    const active = FILTERS.filter((f) => filters.includes(f.key));
    return lists[kind].filter((s) => active.every((f) => f.test(s))).sort((a, b) => sortVal(b, sort) - sortVal(a, sort));
  }, [lists, kind, sort, filters]);

  return (
    <View>
      <View style={styles.seg}>
        {(['buyNow', 'stable', 'student'] as RecommendationKind[]).map((k) => {
          const on = k === kind;
          return (
            <Pressable key={k} onPress={() => onKind(k)} style={[styles.segBtn, on && { backgroundColor: accent[k].main }]}>
              <Text style={[styles.segText, on && { color: '#fff' }]}>
                {accent[k].icon} {accent[k].short}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>정렬</Text>
      <View style={styles.chips}>
        {SORTS.map((s) => (
          <Chip key={s.key} label={s.label} on={sort === s.key} onPress={() => setSort(s.key)} />
        ))}
      </View>
      <Text style={styles.label}>필터</Text>
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} on={filters.includes(f.key)} onPress={() => toggle(f.key)} check />
        ))}
      </View>

      <Text style={styles.count}>
        {rows.length}개 종목 · 탭하면 상세 지표와 점수 구성이 보여요
      </Text>

      <View style={[styles.table, shadow]}>
        {rows.map((s, i) => (
          <Row key={s.stock.code} item={s} rank={i + 1} onPress={() => onOpen(s)} last={i === rows.length - 1} />
        ))}
        {rows.length === 0 && <Text style={styles.empty}>조건에 맞는 종목이 없어요. 필터를 줄여 보세요.</Text>}
      </View>
    </View>
  );
}

function Chip({ label, on, onPress, check }: { label: string; on: boolean; onPress: () => void; check?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>
        {check && on ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

function Row({ item, rank, onPress, last }: { item: Scored; rank: number; onPress: () => void; last: boolean }) {
  const { stock, score, subs } = item;
  const m = stock.metrics;
  const cells: [string, string, string?][] = [
    ['PER', m.per != null ? (m.per < 0 ? '적자' : fmtNum(m.per, 1)) : '-'],
    ['PBR', fmtNum(m.pbr, 2)],
    ['ROE', fmtNum(m.roe, 0, '%')],
    ['배당', fmtNum(m.divYield, 1, '%')],
    ['변동성', fmtNum(m.vol, 0, '%')],
    ['6M', fmtPct(m.ret6m, 0), changeColor(m.ret6m)],
    ['1Y', fmtPct(m.ret1y, 0), changeColor(m.ret1y)],
    ['RSI', fmtNum(m.rsi14, 0)],
  ];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && { backgroundColor: colors.bg }]}>
      <View style={styles.rowHead}>
        <Text style={styles.rowRank}>{rank}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowName} numberOfLines={1}>
            {stock.name} <Text style={styles.rowCode}>{stock.code}</Text>
          </Text>
          <Text style={styles.rowPrice}>
            {fmtPrice(m.price, stock.currency)}{' '}
            <Text style={{ color: changeColor(m.change1d) }}>{fmtPct(m.change1d, 2)}</Text>
          </Text>
        </View>
        <Sparkline data={stock.spark} width={64} height={26} color={changeColor(m.ret1y)} fill={false} strokeWidth={1.5} />
        <View style={[styles.scoreBox, { borderColor: scoreColor(score) }]}>
          <Text style={[styles.scoreNum, { color: scoreColor(score) }]}>{score}</Text>
        </View>
      </View>
      <View style={styles.subs}>
        {subs.map((s) => (
          <View key={s.key} style={styles.sub}>
            <Text style={styles.subLabel}>{s.label}</Text>
            <View style={styles.subBar}>
              <View style={[styles.subFill, { width: `${s.score}%`, backgroundColor: scoreColor(s.score) }]} />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.cells}>
        {cells.map(([k, v, c]) => (
          <View key={k} style={styles.cell}>
            <Text style={styles.cellK}>{k}</Text>
            <Text style={[styles.cellV, c ? { color: c } : null]}>{v}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', gap: 8, marginTop: 4 },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  segText: { fontWeight: '800', fontSize: 14, color: colors.text },
  label: { fontSize: 12, fontWeight: '800', color: colors.faint, marginTop: 14, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.sub },
  chipTextOn: { color: '#fff' },
  count: { fontSize: 12, color: colors.sub, marginTop: 14, marginBottom: 8 },
  table: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  row: { padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowRank: { width: 20, fontSize: 13, fontWeight: '800', color: colors.faint, textAlign: 'center' },
  rowName: { fontSize: 15, fontWeight: '800', color: colors.text },
  rowCode: { fontSize: 11, color: colors.faint, fontWeight: '500' },
  rowPrice: { fontSize: 12, color: colors.sub, marginTop: 2 },
  scoreBox: { width: 40, height: 32, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 15, fontWeight: '800' },
  subs: { flexDirection: 'row', gap: 8, marginTop: 10, paddingLeft: 30 },
  sub: { flex: 1 },
  subLabel: { fontSize: 10, color: colors.faint, marginBottom: 3 },
  subBar: { height: 4, backgroundColor: colors.line, borderRadius: 2, overflow: 'hidden' },
  subFill: { height: 4, borderRadius: 2 },
  cells: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, paddingLeft: 30 },
  cell: { width: '25%', paddingVertical: 3 },
  cellK: { fontSize: 10, color: colors.faint },
  cellV: { fontSize: 13, fontWeight: '700', color: colors.text },
  empty: { padding: 20, textAlign: 'center', color: colors.sub },
});
