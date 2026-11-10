import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Market } from '../data/types';
import { usePrefs } from '../data/prefs';
import { memberships } from '../engine/collections';
import { grade, ok } from '../engine/factors';
import { fmtPct, fmtPrice } from '../engine/format';
import { allStats, keyStats, oneLiner, Point, points } from '../engine/insights';
import { useData, useNav } from '../nav/context';
import { AreaChart } from '../ui/Chart';
import { BackBar, LevelToggle } from '../ui/Bars';
import { Disclaimer } from '../ui/Disclaimer';
import { FactorBars } from '../ui/FactorBars';
import { Icon } from '../ui/Icon';
import { Card, Divider, Pill, Segmented, T, Tap } from '../ui/kit';
import { c, changeColor, toneColor } from '../ui/theme';

type Period = '3m' | '6m' | '1y';
const PERIOD_POINTS: Record<Period, number> = { '3m': 14, '6m': 27, '1y': 999 };

export function StockScreen({ market, code }: { market: Market; code: string }) {
  const nav = useNav();
  const { boards } = useData();
  const { level, isWatched, toggleWatch } = usePrefs();
  const [period, setPeriod] = useState<Period>('1y');
  const board = boards[market];
  const r = board.byCode.get(code);

  if (!r) {
    return (
      <View style={{ flex: 1 }}>
        <BackBar onBack={nav.back} />
        <T style={{ padding: 20 }} color={c.faint}>
          종목 정보를 찾을 수 없어요.
        </T>
      </View>
    );
  }

  const s = r.stock;
  const m = s.metrics;
  const pro = level === 'pro';
  const pts = points(s);
  const good = pts.filter((x) => x.good).slice(0, pro ? 6 : 3);
  const bad = pts.filter((x) => !x.good).slice(0, pro ? 6 : 3);
  const g = grade(r.total);
  const tone = toneColor[g.tone];
  const watched = isWatched(market, code);
  const chart = s.spark.slice(-PERIOD_POINTS[period]);
  const periodRet = chart.length > 1 ? (chart[chart.length - 1] / chart[0] - 1) * 100 : null;
  const inLists = memberships(board, code);

  return (
    <View style={{ flex: 1 }}>
      <BackBar
        onBack={nav.back}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <LevelToggle />
            <Tap
              onPress={() => toggleWatch(market, code)}
              hitSlop={10}
              style={{ padding: 8 }}
              accessibilityLabel={watched ? '관심 종목에서 빼기' : '관심 종목에 추가'}
            >
              <Icon name={watched ? 'heartFill' : 'heart'} color={watched ? c.up : c.faint} />
            </Tap>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 가격 + 그래프 */}
        <View style={{ backgroundColor: c.card, paddingHorizontal: 20, paddingBottom: 20 }}>
          <T size={15} color={c.sub}>
            {s.name}{' '}
            <T size={13} color={c.faint}>
              {s.code} · {s.sector}
            </T>
          </T>
          <T size={30} w="bold" style={{ marginTop: 2 }}>
            {fmtPrice(m.price, s.currency)}
          </T>
          <T size={14} w="semibold" color={changeColor(m.change1d)}>
            어제보다 {fmtPct(m.change1d, 2)}
          </T>
          <View style={{ marginTop: 16 }}>
            <AreaChart data={chart} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
            <Segmented<Period>
              value={period}
              onChange={setPeriod}
              options={[
                { value: '3m', label: '3개월' },
                { value: '6m', label: '6개월' },
                { value: '1y', label: '1년' },
              ]}
              style={{ flex: 1 }}
            />
            <T size={14} w="bold" color={changeColor(periodRet)} style={{ minWidth: 64, textAlign: 'right' }}>
              {fmtPct(periodRet, 1)}
            </T>
          </View>
          {ok(m.low52) && ok(m.high52) && <RangeBar low={m.low52} high={m.high52} now={m.price} currency={s.currency} />}
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          {/* 종합 성적 */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: tone.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <T size={26} w="bold" color={tone.fg} style={{ lineHeight: 32 }}>
                  {r.total}
                </T>
                <T size={10} w="semibold" color={tone.fg} style={{ lineHeight: 12 }}>
                  종합 점수
                </T>
              </View>
              <View style={{ flex: 1 }}>
                <T size={13} color={c.faint}>
                  {market === 'KR' ? '국내' : '해외'} 후보 {board.rated.length}개 중 종합 성적
                </T>
                <T size={20} w="bold" color={tone.fg}>
                  {g.label}
                </T>
              </View>
            </View>
            <View style={{ backgroundColor: c.soft, borderRadius: 14, padding: 14, marginTop: 16 }}>
              <T size={15} w="semibold">
                💬 {oneLiner(r, pts)}
              </T>
            </View>
            <View style={{ marginTop: 20 }}>
              <FactorBars f={r.f} pro={pro} />
            </View>
            {r.coverage < 0.6 && (
              <T size={12} color={c.orange} style={{ marginTop: 12 }}>
                ⚠️ 이 종목은 빠진 데이터가 많아서 점수가 덜 정확할 수 있어요.
              </T>
            )}
          </Card>

          {/* 추천 목록 */}
          {inLists.length > 0 && (
            <Card>
              <T size={17} w="bold" style={{ marginBottom: 10 }}>
                이런 추천 목록에 들어 있어요
              </T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {inLists.map(({ c: col, rank }) => (
                  <Tap
                    key={col.id}
                    onPress={() => nav.push({ name: 'collection', market, id: col.id })}
                    style={{ backgroundColor: c.blueSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <T size={14} w="semibold" color={c.blue}>
                      {col.emoji} {col.title} {rank}위
                    </T>
                  </Tap>
                ))}
              </View>
            </Card>
          )}

          {/* 좋은 점 / 조심할 점 */}
          <Card>
            <T size={17} w="bold" style={{ marginBottom: 6 }}>
              👍 이런 점이 좋아요
            </T>
            {good.length ? good.map((p) => <PointRow key={p.title} p={p} pro={pro} />) : <Empty text="눈에 띄게 좋은 점은 아직 없어요." />}
            <Divider style={{ marginVertical: 14 }} />
            <T size={17} w="bold" style={{ marginBottom: 6 }}>
              ✋ 이런 점은 조심하세요
            </T>
            {bad.length ? bad.map((p) => <PointRow key={p.title} p={p} pro={pro} />) : <Empty text="크게 걱정할 점은 보이지 않아요." />}
          </Card>

          {/* 지표 */}
          <Card>
            <T size={17} w="bold" style={{ marginBottom: 4 }}>
              {pro ? '전체 지표' : '꼭 봐야 할 숫자 6개'}
            </T>
            <T size={13} color={c.faint} style={{ marginBottom: 12 }}>
              이름을 누르면 무슨 뜻인지 알려 드려요
            </T>
            {pro ? <ProStats stock={s} /> : <EasyStats stock={s} />}
          </Card>

          <Disclaimer />
        </View>
      </ScrollView>
    </View>
  );
}

function PointRow({ p, pro }: { p: Point; pro: boolean }) {
  const nav = useNav();
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 9, backgroundColor: p.good ? c.blue : c.up }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <T size={15} w="semibold">
            {p.title}
          </T>
          {p.term && (
            <Tap onPress={() => nav.showTerm(p.term!)} hitSlop={8} accessibilityLabel="용어 설명">
              <Icon name="info" size={16} color={c.faint} />
            </Tap>
          )}
        </View>
        <T size={14} color={c.sub}>
          {p.easy}
        </T>
        {pro && (
          <T size={13} color={c.faint} style={{ marginTop: 2 }}>
            {p.detail}
          </T>
        )}
      </View>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <T size={14} color={c.faint} style={{ paddingVertical: 6 }}>
      {text}
    </T>
  );
}

function EasyStats({ stock }: { stock: Parameters<typeof keyStats>[0] }) {
  const nav = useNav();
  const judgeColor = { good: c.blue, soso: c.orange, bad: c.up, none: c.faint };
  const judgeLabel = { good: '좋아요', soso: '보통', bad: '아쉬워요', none: '' };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {keyStats(stock).map((k) => (
        <Tap
          key={k.label}
          onPress={() => k.term && nav.showTerm(k.term)}
          disabled={!k.term}
          style={{ width: '48%', flexGrow: 1, backgroundColor: c.soft, borderRadius: 14, padding: 14 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T size={13} color={c.sub}>
              {k.label}
            </T>
            {k.judge !== 'none' && <Pill label={judgeLabel[k.judge]} fg={judgeColor[k.judge]} bg="#fff" />}
          </View>
          <T size={18} w="bold" style={{ marginTop: 4 }}>
            {k.value}
          </T>
          <T size={12} color={c.faint}>
            {k.plain}
          </T>
        </Tap>
      ))}
    </View>
  );
}

function ProStats({ stock }: { stock: Parameters<typeof allStats>[0] }) {
  const nav = useNav();
  return (
    <View style={{ gap: 16 }}>
      {allStats(stock).map((g) => (
        <View key={g.group}>
          <T size={13} w="bold" color={c.faint} style={{ marginBottom: 4 }}>
            {g.group}
          </T>
          {g.rows.map((row) => (
            <Tap
              key={row.label}
              disabled={!row.term}
              onPress={() => row.term && nav.showTerm(row.term)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 }}
            >
              <T size={14} color={c.sub} style={row.term ? { textDecorationLine: 'underline', textDecorationStyle: 'dotted' } : undefined}>
                {row.label}
              </T>
              <T size={14} w="semibold">
                {row.value}
              </T>
            </Tap>
          ))}
        </View>
      ))}
    </View>
  );
}

function RangeBar({ low, high, now, currency }: { low: number; high: number; now: number; currency: string }) {
  const p = Math.max(0, Math.min(1, (now - low) / (high - low || 1)));
  return (
    <View style={{ marginTop: 20 }}>
      <T size={13} color={c.faint} style={{ marginBottom: 8 }}>
        1년 중 지금 가격 위치
      </T>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.soft }}>
        <View
          style={{
            position: 'absolute',
            left: `${p * 100}%`,
            top: -4,
            width: 14,
            height: 14,
            marginLeft: -7,
            borderRadius: 7,
            backgroundColor: c.text,
            borderWidth: 3,
            borderColor: '#fff',
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <T size={12} color={c.down}>
          최저 {fmtPrice(low, currency)}
        </T>
        <T size={12} color={c.up}>
          최고 {fmtPrice(high, currency)}
        </T>
      </View>
    </View>
  );
}
