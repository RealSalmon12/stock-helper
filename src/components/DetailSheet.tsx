import { useState } from 'react';
import { LayoutChangeEvent, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mode, Scored } from '../data/types';
import { fmtPct, fmtPrice } from '../logic/format';
import { BEGINNER_KEYS, Judge, METRICS, MetricDef } from '../logic/metrics';
import { accent, changeColor, colors, radius, scoreColor, scoreLabel, font } from '../theme';
import { Disclaimer } from './Disclaimer';
import { ReasonList } from './ReasonList';
import { ScoreRing } from './ScoreRing';
import { Sparkline } from './Sparkline';
import { TermChip, TermProvider } from './Terms';

const JUDGE: Record<Judge, { label: string; fg: string; bg: string } | null> = {
  good: { label: '좋음', fg: colors.good, bg: colors.goodSoft },
  normal: { label: '보통', fg: colors.sub, bg: colors.infoSoft },
  bad: { label: '주의', fg: colors.warn, bg: colors.warnSoft },
  none: null,
};

interface Props {
  item: Scored | null;
  other: Scored | null;
  mode: Mode;
  onClose: () => void;
}

export function DetailSheet({ item, other, mode, onClose }: Props) {
  const [chartW, setChartW] = useState(0);
  if (!item) return null;
  const { stock } = item;
  const m = stock.metrics;
  const a = accent[item.kind];
  const trend = changeColor(m.ret1y);
  const onLayout = (e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width);

  const metricList = mode === 'beginner' ? METRICS.filter((d) => BEGINNER_KEYS.includes(d.key)) : METRICS;
  const groups = Array.from(new Set(metricList.map((d) => d.group)));

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      {/* 모달 안에서 용어 설명 창이 위에 뜨도록 Provider를 한 번 더 둡니다 */}
      <TermProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기">
            <Text style={styles.back}>‹ 목록</Text>
          </Pressable>
          <Text style={[styles.kindPill, { color: a.main, backgroundColor: a.soft }]}>
            {a.label}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.inner}>
            <Text style={styles.code}>
              {stock.code} · {stock.sector}
            </Text>
            <Text style={styles.name}>{stock.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{fmtPrice(m.price, stock.currency)}</Text>
              <Text style={[styles.change, { color: changeColor(m.change1d) }]}>전일 대비 {fmtPct(m.change1d, 2)}</Text>
            </View>

            <View style={styles.chartCard} onLayout={onLayout}>
              <Sparkline data={stock.spark} width={chartW - 32} height={140} color={trend} strokeWidth={2.5} />
              <View style={styles.chartMeta}>
                <Text style={styles.chartLabel}>1년 최저 {m.low52 != null ? fmtPrice(m.low52, stock.currency) : '-'}</Text>
                <Text style={[styles.chartLabel, { color: trend, fontFamily: font.bold }]}>1년 {fmtPct(m.ret1y, 0)}</Text>
                <Text style={styles.chartLabel}>최고 {m.high52 != null ? fmtPrice(m.high52, stock.currency) : '-'}</Text>
              </View>
            </View>

            {/* 점수 */}
            <View style={styles.card}>
              <View style={styles.scoreHead}>
                <ScoreRing score={item.score} size={64} kind={item.kind} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardKicker}>{a.label} 점수</Text>
                  <Text style={[styles.scoreVerdict, { color: scoreColor(item.score) }]}>{scoreLabel(item.score)}</Text>
                  {other && (
                    <Text style={styles.otherScore}>
                      {accent[other.kind].label} 점수는 {other.score}점
                    </Text>
                  )}
                </View>
              </View>
              <Text style={styles.summary}>{item.summary}</Text>
              <View style={{ gap: 10, marginTop: 14 }}>
                {item.subs.map((s) => (
                  <View key={s.key}>
                    <View style={styles.subRow}>
                      <Text style={styles.subLabel}>
                        {s.label}
                        {mode === 'expert' && <Text style={styles.subWeight}> · 비중 {Math.round(s.weight * 100)}%</Text>}
                      </Text>
                      <Text style={[styles.subVal, { color: scoreColor(s.score) }]}>{s.score}</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFg, { width: `${s.score}%`, backgroundColor: scoreColor(s.score) }]} />
                    </View>
                  </View>
                ))}
              </View>
              {item.coverage < 0.7 && (
                <Text style={styles.coverage}>
                  ℹ️ 이 종목은 일부 재무 데이터가 없어 비어 있는 항목은 중간값으로 계산했어요.
                </Text>
              )}
              {mode === 'expert' && (
                <Text style={styles.method}>
                  각 지표를 같은 시장 {stock.market === 'KR' ? '한국' : '미국'} 후보 종목들 안에서 백분위로 바꾼 뒤 비중대로 합산했어요.
                  {item.kind === 'buyNow'
                    ? ' RSI 75 이상(-6), 1개월 +25% 이상(-5), 200일선 아래·6개월 -15% 이하(-6)는 감점.'
                    : item.kind === 'student'
                      ? ' 연 변동성 45% 초과(-8), 1년 최대 낙폭 -40% 이하(-5)는 감점. 미국 주식은 소수점 투자가 돼서 1주 가격 영향을 절반으로 줄였어요.'
                      : ' 배당성향 100% 초과 시 배당 점수 ×0.6, 적자면 재무 점수 최대 20점.'}
                </Text>
              )}
            </View>

            {/* 이유 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>왜 이 점수일까요?</Text>
              <ReasonList reasons={item.reasons} mode={mode} />
            </View>

            {/* 지표 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{mode === 'beginner' ? '핵심 숫자 쉽게 보기' : '전체 지표'}</Text>
              {mode === 'beginner' && (
                <Text style={styles.cardDesc}>파란 물음표를 누르면 용어 설명이 나와요.</Text>
              )}
              {groups.map((g) => (
                <View key={g} style={{ marginTop: 12 }}>
                  <Text style={styles.group}>{g}</Text>
                  {metricList
                    .filter((d) => d.group === g)
                    .map((d) => (
                      <MetricRow key={d.key} def={d} item={item} mode={mode} />
                    ))}
                </View>
              ))}
            </View>

            <Disclaimer compact />
            <Text style={styles.source}>데이터: Yahoo Finance, 네이버 증권 · 하루 2번 자동 갱신</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      </TermProvider>
    </Modal>
  );
}

function MetricRow({ def, item, mode }: { def: MetricDef; item: Scored; mode: Mode }) {
  const m = item.stock.metrics;
  const j = def.judge ? JUDGE[def.judge(m, item.stock)] : null;
  const plain = mode === 'beginner' && def.plain ? def.plain(m, item.stock) : null;
  return (
    <View style={styles.metricRow}>
      <View style={{ flex: 1 }}>
        <View style={styles.metricLabelRow}>
          <Text style={styles.metricLabel}>{def.label}</Text>
          {def.term && <TermChip term={def.term} label="?" />}
        </View>
        {plain && <Text style={styles.metricPlain}>{plain}</Text>}
      </View>
      <Text style={styles.metricValue}>{def.value(m, item.stock)}</Text>
      {j && (
        <Text style={[styles.judge, { color: j.fg, backgroundColor: j.bg }]}>{j.label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  back: { fontSize: 16, color: colors.primary, fontFamily: font.bold },
  kindPill: { fontSize: 12, fontFamily: font.bold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, overflow: 'hidden' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 40 },
  inner: { width: '100%', maxWidth: 640, gap: 14 },
  code: { fontSize: 13, color: colors.faint, fontFamily: font.bold },
  name: { fontSize: 28, fontFamily: font.bold, color: colors.text, letterSpacing: -0.5, marginTop: -10 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: -8 },
  price: { fontSize: 20, fontFamily: font.bold, color: colors.text },
  change: { fontSize: 14, fontFamily: font.bold },
  chartCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16 },
  chartMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLabel: { fontSize: 12, fontFamily: font.regular, color: colors.sub },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16 },
  cardTitle: { fontSize: 17, fontFamily: font.bold, color: colors.text, marginBottom: 10 },
  cardDesc: { fontSize: 12, fontFamily: font.regular, color: colors.sub, marginTop: -6 },
  cardKicker: { fontSize: 12, color: colors.sub, fontFamily: font.bold },
  scoreHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreVerdict: { fontSize: 22, fontFamily: font.bold, marginTop: 2 },
  otherScore: { fontSize: 12, fontFamily: font.regular, color: colors.faint, marginTop: 2 },
  summary: { fontSize: 15, fontFamily: font.regular, lineHeight: 23, color: colors.text, marginTop: 14 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  subLabel: { fontSize: 13, color: colors.text, fontFamily: font.bold },
  subWeight: { fontSize: 12, color: colors.faint, fontFamily: font.regular },
  subVal: { fontSize: 13, fontFamily: font.bold },
  barBg: { height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: 'hidden' },
  barFg: { height: 8, borderRadius: 4 },
  coverage: { fontSize: 12, fontFamily: font.regular, color: colors.sub, marginTop: 12, lineHeight: 18 },
  method: { fontSize: 12, fontFamily: font.regular, color: colors.sub, marginTop: 12, lineHeight: 18 },
  group: { fontSize: 12, fontFamily: font.bold, color: colors.faint, marginBottom: 2 },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricLabel: { fontSize: 14, color: colors.text, fontFamily: font.bold },
  metricPlain: { fontSize: 12, fontFamily: font.regular, color: colors.sub, marginTop: 2 },
  metricValue: { fontSize: 14, color: colors.text, fontFamily: font.bold, textAlign: 'right' },
  judge: {
    fontSize: 11,
    fontFamily: font.bold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
    minWidth: 40,
    textAlign: 'center',
  },
  source: { fontSize: 11, fontFamily: font.regular, color: colors.faint, textAlign: 'center' },
});
