import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { usePrefs } from '../data/prefs';
import { COLLECTIONS, collectionById, CollectionId } from '../engine/collections';
import { ok } from '../engine/factors';
import { fmtDate, fmtPct } from '../engine/format';
import { oneLiner, points } from '../engine/insights';
import { INVESTOR } from '../engine/investor';
import { useData, useNav } from '../nav/context';
import { MarketSwitch, TopBar } from '../ui/Bars';
import { Spark } from '../ui/Chart';
import { Disclaimer } from '../ui/Disclaimer';
import { Icon } from '../ui/Icon';
import { Card, Divider, Logo, Segmented, T, Tap } from '../ui/kit';
import { StockRow } from '../ui/StockRow';
import { c, changeColor } from '../ui/theme';

export function HomeScreen() {
  const { market, investor } = usePrefs();
  const { boards, data, state, refresh } = useData();
  const nav = useNav();
  const board = boards[market];
  const [moverDir, setMoverDir] = useState<'up' | 'down'>('up');

  // ----- 시장 분위기 -----
  const changes = board.rated.map((r) => r.stock.metrics.change1d).filter(ok);
  const upCount = changes.filter((v) => v > 0).length;
  const avg = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
  const share = changes.length ? upCount / changes.length : 0.5;
  const mood =
    share >= 0.7
      ? { e: '☀️', t: '맑음', d: '대부분 올랐어요' }
      : share >= 0.5
        ? { e: '🌤️', t: '구름 조금', d: '오른 종목이 조금 더 많아요' }
        : share >= 0.3
          ? { e: '☁️', t: '흐림', d: '내린 종목이 조금 더 많아요' }
          : { e: '🌧️', t: '비', d: '대부분 내렸어요' };

  const top = board.lists.buy.slice(0, 3);
  const movers = [...board.rated]
    .filter((r) => ok(r.stock.metrics.change1d))
    .sort((a, b) => (moverDir === 'up' ? 1 : -1) * ((b.stock.metrics.change1d ?? 0) - (a.stock.metrics.change1d ?? 0)))
    .slice(0, 5);

  const open = (id: CollectionId) => nav.push({ name: 'collection', market, id });
  const mine = investor ? INVESTOR[investor] : null;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <TopBar title="주식 도우미" />
      <MarketSwitch />

      <View style={{ padding: 16, gap: 12 }}>
        {/* 시장 분위기 */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <T size={40} style={{ lineHeight: 50 }}>
              {mood.e}
            </T>
            <View style={{ flex: 1 }}>
              <T size={13} color={c.faint}>
                오늘 {market === 'KR' ? '국내' : '미국'} 대형주 날씨
              </T>
              <T size={20} w="bold">
                {mood.t}, {mood.d}
              </T>
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16, backgroundColor: c.soft, borderRadius: 14, padding: 14 }}>
            <Stat label="오른 종목" value={`${upCount}개`} color={c.up} />
            <Stat label="내린 종목" value={`${changes.length - upCount}개`} color={c.down} />
            <Stat label="평균 등락" value={fmtPct(avg, 2)} color={changeColor(avg)} />
          </View>
          <Tap
            onPress={refresh}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}
            accessibilityLabel="새로고침"
          >
            <T size={12} color={c.faint}>
              {fmtDate(data.generatedAt)} 기준 · {state === 'loading' ? '불러오는 중…' : state === 'offline' ? '저장된 데이터' : '최신'}
            </T>
            <Icon name="refresh" size={14} color={c.faint} />
          </Tap>
        </Card>

        {/* 내 성향 맞춤 */}
        {mine ? (
          <Card>
            <Tap onPress={() => nav.push({ name: 'test' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <T size={13} w="semibold" color={c.blue}>
                {mine.emoji} {mine.name} 맞춤
              </T>
              <T size={12} color={c.faint}>
                다시 하기
              </T>
            </Tap>
            <T size={19} w="bold" style={{ marginBottom: 4 }}>
              나에게 맞는 {collectionById(mine.list).title} 종목
            </T>
            {board.lists[mine.list].slice(0, 3).map((p) => (
              <StockRow key={p.rated.stock.code} stock={p.rated.stock} rank={p.rank} score={p.score} right="score" />
            ))}
            <MoreButton onPress={() => open(mine.list)} />
          </Card>
        ) : (
          <Tap onPress={() => nav.push({ name: 'test' })}>
            <Card style={{ backgroundColor: c.blue, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <T size={34} style={{ lineHeight: 44 }}>
                🧭
              </T>
              <View style={{ flex: 1 }}>
                <T size={17} w="bold" color="#fff">
                  나에게 맞는 종목 찾기
                </T>
                <T size={14} color="rgba(255,255,255,0.85)">
                  4문제만 답하면 내 투자 성향에 맞춰 골라 드려요
                </T>
              </View>
              <Icon name="chevron" color="#fff" />
            </Card>
          </Tap>
        )}

        {/* 오늘의 추천 */}
        <Card>
          <T size={13} w="semibold" color={c.up} style={{ marginBottom: 2 }}>
            🚀 오늘의 추천
          </T>
          <T size={19} w="bold" style={{ marginBottom: 12 }}>
            지금 사기 좋은 종목 TOP 3
          </T>
          <View style={{ gap: 10 }}>
            {top.map((p) => {
              const s = p.rated.stock;
              return (
                <Tap
                  key={s.code}
                  onPress={() => nav.push({ name: 'stock', market, code: s.code })}
                  style={{ backgroundColor: c.soft, borderRadius: 16, padding: 16 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Logo name={s.name} code={s.code} size={36} />
                    <View style={{ flex: 1 }}>
                      <T size={16} w="bold" numberOfLines={1}>
                        {p.rank}. {s.name}
                      </T>
                      <T size={13} color={c.faint}>
                        {s.sector} · 추천 점수 {p.score}점
                      </T>
                    </View>
                    <Spark data={s.spark.slice(-26)} />
                  </View>
                  <T size={14} color={c.sub} style={{ marginTop: 10 }}>
                    {oneLiner(p.rated, points(s))}
                  </T>
                </Tap>
              );
            })}
          </View>
          <MoreButton onPress={() => open('buy')} label="10위까지 보기" />
        </Card>

        {/* 테마 */}
        <Card>
          <T size={19} w="bold" style={{ marginBottom: 14 }}>
            목적별로 골라보기
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {COLLECTIONS.map((col) => {
              const first = board.lists[col.id][0]?.rated.stock;
              return (
                <Tap
                  key={col.id}
                  onPress={() => open(col.id)}
                  style={{ width: '48%', flexGrow: 1, backgroundColor: c.soft, borderRadius: 16, padding: 14 }}
                >
                  <T size={26} style={{ lineHeight: 34 }}>
                    {col.emoji}
                  </T>
                  <T size={15} w="bold" style={{ marginTop: 6 }}>
                    {col.title}
                  </T>
                  <T size={12} color={c.faint} numberOfLines={1}>
                    1위 {first?.name ?? '-'}
                  </T>
                </Tap>
              );
            })}
          </View>
        </Card>

        {/* 학생 추천 */}
        <Preview id="student" />
        <Preview id="stable" />

        {/* 오늘 많이 움직인 */}
        <Card>
          <T size={19} w="bold" style={{ marginBottom: 12 }}>
            오늘 많이 움직인 종목
          </T>
          <Segmented
            value={moverDir}
            onChange={setMoverDir}
            options={[
              { value: 'up', label: '많이 오른' },
              { value: 'down', label: '많이 내린' },
            ]}
          />
          <View style={{ marginTop: 6 }}>
            {movers.map((r, i) => (
              <StockRow key={r.stock.code} stock={r.stock} rank={i + 1} />
            ))}
          </View>
        </Card>

        <Disclaimer />
      </View>
    </ScrollView>
  );
}

function Preview({ id }: { id: CollectionId }) {
  const { market } = usePrefs();
  const { boards } = useData();
  const nav = useNav();
  const col = collectionById(id);
  return (
    <Card>
      <T size={19} w="bold">
        {col.emoji} {col.title} 종목
      </T>
      <T size={13} color={c.faint} style={{ marginBottom: 4 }}>
        {col.desc}
      </T>
      {boards[market].lists[id].slice(0, 3).map((p) => (
        <StockRow key={p.rated.stock.code} stock={p.rated.stock} rank={p.rank} score={p.score} right="score" />
      ))}
      <MoreButton onPress={() => nav.push({ name: 'collection', market, id })} />
    </Card>
  );
}

function MoreButton({ onPress, label = '더 보기' }: { onPress: () => void; label?: string }) {
  return (
    <>
      <Divider style={{ marginTop: 8 }} />
      <Tap onPress={onPress} style={{ paddingTop: 14, alignItems: 'center' }}>
        <T size={14} w="semibold" color={c.sub}>
          {label}
        </T>
      </Tap>
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <T size={12} color={c.faint}>
        {label}
      </T>
      <T size={16} w="bold" color={color}>
        {value}
      </T>
    </View>
  );
}
